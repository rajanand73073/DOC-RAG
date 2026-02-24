import {
  PlaywrightWebBaseLoader,
} from "@langchain/community/document_loaders/web/playwright";
import * as cheerio from "cheerio";
import { chromium } from "playwright";
import { NextResponse } from "next/server";

function classifyFromUrl(url: string) {
  const parts = new URL(url).pathname
    .split("/")
    .filter(Boolean);
  // parts example:
  // ["documentation", "concepts", "indexing"]
  const topic = parts[1] || "unknown";
  const section = parts[2] || "overview";
  return { topic, section };
}

function cleanPageContent(rawHtml: string) {
  const $ = cheerio.load(rawHtml);
  $("script, style, nav, footer, header").remove();
  $(".sidebar,.docs-feedback,.table-of-contents__external-links").remove();
  const mainContent = $("main").text().trim();
  return mainContent || $.text().trim();
}

function splitTextWithOverlap(text: string, chunkSize = 1000, chunkOverlap = 200) {
  const chunks: string[] = [];
  if (!text) return chunks;

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;
    start = Math.max(end - chunkOverlap, start + 1);
  }

  return chunks;
}

export async function GET() {
  try {
    const browser = await chromium.launch();
    //browser → full Chrome instance
    const page = await browser.newPage();
    await page.goto("https://qdrant.tech/documentation/");

    // Get all links inside documentation
    //$$ - Select ALL matching elements (like document.querySelectorAll)
    let links = await page.$$eval("a", (anchors) =>
      anchors
        .map((a) => a.href)
        .filter(
          (href) =>
            href.includes("/documentation/") &&
            !href.includes("#") &&
            !href.endsWith(".pdf"),
        ),
    );
     await browser.close();
    links = [...new Set(links)]; // Remove duplicates
    console.log("Links",links);
    links = links.slice(0, 5);


    // Create a loader for each link and load documents in parallel
    //await Promise.all() is used to efficiently run multiple asynchronous operations concurrently (in parallel) and wait for all of them to complete before proceeding.
    const docsArray = await Promise.all(
      links.map(async (link) => {
        const loader = new PlaywrightWebBaseLoader(link);
        return loader.load();
      })
    );
    // Flatten the array of arrays
    console.log("docsArray",docsArray);
    const docs = docsArray.flat();
    console.log("Docs",docs);
    const enrichedDocs = docs.map((doc) => {
      const { topic, section } = classifyFromUrl(doc.metadata.source);
      return { ...doc, metadata: { ...doc.metadata, topic, section } };
    });

    console.log("EnrichedDocs",enrichedDocs);

    // Split each doc into chunks and carry metadata to each chunk.
    // This enables embedding-level classification/filtering by topic/section/source.
    //flatMap is better here because embedding pipelines usually expect one flat array of chunk documents.
    const chunkedDocs = enrichedDocs.flatMap((doc) => {
      const cleanedContent = cleanPageContent(doc.pageContent);
      const chunks = splitTextWithOverlap(cleanedContent, 1000, 200);
      console.log("Chunks",chunks);
      
      return chunks.map((pageContent) => ({
        pageContent,
        metadata: {
          ...doc.metadata,
        },
      }));
    });

    console.log("ChunkedDocs", chunkedDocs[0]);
    return NextResponse.json({
      totalLinks: links.length,
      totalDocuments: enrichedDocs.length,
      totalChunks: chunkedDocs.length,
      chunks: chunkedDocs,
    });
  } catch (error) {
    console.error("Error loading document:", error);
  }
}
