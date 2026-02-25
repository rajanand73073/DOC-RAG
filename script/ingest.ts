import { PlaywrightWebBaseLoader } from "@langchain/community/document_loaders/web/playwright";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { chromium } from "playwright";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { writeFile } from "fs/promises";
import path from "path";

dotenv.config();


function classifyFromUrl(url: string) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return {
    topic: parts[1] || "unknown",
    section: parts[2] || "overview",
  };
}

function cleanPageContent(rawHtml: string) {
  const $ = cheerio.load(rawHtml);

  $("script, style, nav, footer, header").remove();
  $(".sidebar,.docs-feedback,.table-of-contents__external-links").remove();

  const mainContent = $("main").text().trim();
  return mainContent || $.text().trim();
}

// ----------------------------
// Main Ingestion Function
// ----------------------------

async function ingest() {
  const topicList :string[] = []
  const sectionList:string[] = []
  if (!process.env.QDRANT_URL) {
    throw new Error("Missing QDRANT_URL");
  }

  if (!process.env.HUGGINGFACEHUB_API_KEY) {
    throw new Error("Missing HUGGINGFACEHUB_API_KEY");
  }

  console.log("🚀 Starting ingestion...");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto("https://qdrant.tech/documentation/");

  let links = await page.$$eval("a", (anchors) =>
    anchors
      .map((a) => a.href)
      .filter(
        (href) =>
          href.includes("/documentation/") &&
          !href.includes("#") &&
          !href.endsWith(".pdf")
      )
  );

  await browser.close();

  links = [...new Set(links)];

  console.log(`🔎 Found ${links.length} documentation links`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const embeddings = new HuggingFaceInferenceEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2", // 384 dim
    apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  });

  const collectionName = "qdrant-docs-miniLM";

  // Process links sequentially
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    console.log(`\n📄 Processing (${i + 1}/${links.length}): ${link}`);

    try {
      const loader = new PlaywrightWebBaseLoader(link);
      const docs = await loader.load();

      const enrichedDocs = docs.map((doc) => {
        const { topic, section } = classifyFromUrl(doc.metadata.source);
        topicList.push(topic)
        sectionList.push(section)
        console.log(`Topic: ${topic}, Section: ${section}`);
        return {
          ...doc,
          pageContent: cleanPageContent(doc.pageContent),
          metadata: {
            ...doc.metadata,
            topic,
            section,
          },
        };
      });

      const chunkedDocs = await splitter.splitDocuments(enrichedDocs);

      console.log(`✂️ Created ${chunkedDocs.length} chunks`);

      // Upload page-by-page (memory safe)
         QdrantVectorStore.fromDocuments(chunkedDocs, embeddings, {
        url: process.env.QDRANT_URL!,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName,
      });
      console.log(`✅ Uploaded ${chunkedDocs.length} chunks to Qdrant`);
    } catch (error) {
      console.error(`❌ Failed processing ${link}`, error);
    }
  }
  const uniqueTopics = Array.from(new Set(topicList));
  const uniqueSections = Array.from(new Set(sectionList));
  await writeFile(path.join(process.cwd(), "topicList.txt"), uniqueTopics.join("\n"), "utf-8");
  await writeFile(path.join(process.cwd(), "section.txt"), uniqueSections.join("\n"), "utf-8");
  console.log("📝 Saved topics to topicList.txt and sections to section.txt");

  console.log("\n🎉 Ingestion completed successfully!");
  
}

// Run it
ingest().catch((err) => {
  console.error("Fatal ingestion error:", err);
});
