import { QdrantVectorStore } from "@langchain/qdrant";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantClient } from "@qdrant/js-client-rest";

let vectorStore: QdrantVectorStore | null = null;

export async function getVectorStore() {
  if (vectorStore) return vectorStore;

  const embeddings = new HuggingFaceInferenceEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    apiKey: process.env.HUGGINGFACEHUB_API_KEY!,
  });

  vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: "qdrant-docs-miniLM",
  });

  // Create payload indexes for filtered search (no-op if they already exist)
  const client = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY,
  });

  await Promise.all([
    client.createPayloadIndex("qdrant-docs-miniLM", {
      field_name: "metadata.topic",
      field_schema: "keyword",
    }),
    client.createPayloadIndex("qdrant-docs-miniLM", {
      field_name: "metadata.section",
      field_schema: "keyword",
    }),
  ]);

  return vectorStore;
}
