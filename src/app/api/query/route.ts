import { getMultiQueries } from "@/src/lib/multiQuery";
import { NextResponse } from "next/server";
import { getDocuments } from "@/src/lib/documentRetrieval";
import { getFinalOutput } from "@/src/lib/finalOutput";
import type { Document } from "@langchain/core/documents";

export async function POST(req: Request) {
  const { query } = await req.json();
  const routedQueries = await getMultiQueries(query);
  if (routedQueries.length === 0) {
    return NextResponse.json({
      message: "Please ask a Qdrant-related question.",
    });
  }
  const docs: Document[] = (await getDocuments(routedQueries)) || []; // Implement this function to retrieve relevant documents based on routedQueries
  const output = await getFinalOutput(docs, query); // Implement this function to generate final output based on retrieved documents and user query
  console.log("OUtput", output);

  return NextResponse.json({
    output,
  });
}
