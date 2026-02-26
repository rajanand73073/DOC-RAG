import { getMultiQueries } from "@/src/lib/multiQuery"
import { NextResponse } from "next/server"
import { getDocuments } from "@/src/lib/documentRetrieval"  

export async function POST(req: Request) {
  const { query } = await req.json()
  const routedQueries = await getMultiQueries(query)
  if (routedQueries.length === 0) {
    return NextResponse.json({
      message: "Please ask a Qdrant-related question."
    })
  }
  const docs = await getDocuments(routedQueries) // Implement this function to retrieve relevant documents based on routedQueries
  // console.log("Retrieved Documents: ", docs);
  return NextResponse.json({
    routedQueries,
  })
}
