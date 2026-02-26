import { RoutedQuery } from "./multiQuery";
import { getVectorStore } from "./vectorStore";
import { Document } from "@langchain/core/documents";

function reciprocalRankFusion(
  resultSets: [Document, number][][],
  k: number = 60
): Document[] {
  const scores = new Map<string, { doc: Document; score: number }>();

  for (const results of resultSets) {
    results.forEach(([doc], rank) => {
      const id = doc.id ?? doc.pageContent.slice(0, 100); // use id or content as key
      const rrfScore = 1 / (k + rank + 1);
      if (scores.has(id)) {
        scores.get(id)!.score += rrfScore;
      } else {
        scores.set(id, { doc, score: rrfScore });
      }
    });
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ doc }) => doc);
}

export async function getDocuments(queries: RoutedQuery[]) {
  const vectorStore = await getVectorStore();
  try {
    const allResultSets: [Document, number][][] = [];

    for (const q of queries) {
      console.log("Query: ", q);

      // Vector search results
      const vectorResults = await vectorStore.similaritySearchWithScore(
        q.query,
        6,
        {
          must: [
            { key: "metadata.topic", match: { value: q.topic } },
          ],
          should:[
            { key: "metadata.section", match: { value: q.section } },
          ]
        }
      );

      // Lexical boost — re-rank docs that contain the exact query string
      const lexicalResults = vectorResults.filter(([doc]) =>
        doc.pageContent.toLowerCase().includes(q.query.toLowerCase())
      );

      allResultSets.push(vectorResults);
      if (lexicalResults.length > 0) allResultSets.push(lexicalResults);
    }

    const fused = reciprocalRankFusion(allResultSets).slice(0, 6);
    console.log("Fused results: ", fused.length);
    return fused;
  } catch (error: any) {
    console.error("Error retrieving documents:", error);
    console.error("Qdrant error detail:", JSON.stringify(error?.data, null, 2));
  }
}