
import { getMultiQueries } from "@/src/lib/multiQuery"
import { suggestTopicSection } from "@/src/lib/suggestTopic_Section"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { query } = await req.json()
  const multiQueries = await getMultiQueries(query)

  if (multiQueries.length === 0) {
    return NextResponse.json({
      message: "Please ask a Qdrant-related question."
    })
  }

  const topicSection = await suggestTopicSection(multiQueries)
  console.log("Docs with suggested topic and section: ", topicSection);

  return NextResponse.json({
    multiQueries,
    topicSection
  })
}
