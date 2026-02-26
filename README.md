# Qdrant Docs RAG (Multi-Query + RRF)

This project is a Qdrant documentation assistant built with Next.js, LangChain, Qdrant, HuggingFace embeddings, and Groq models.

It follows a multi-stage RAG pipeline:

1. Expand one user query into multiple focused retrieval queries.
2. Retrieve documents from Qdrant using vector similarity + metadata filters.
3. Re-rank and fuse results from all expanded queries.
4. Generate a grounded final answer from the fused documents.

This README documents what is implemented so far and why each decision was made.

## Architecture (What We Built So Far)

The current implementation matches your architecture diagram closely:

1. Docs are ingested, cleaned, chunked, embedded, and stored in Qdrant.
2. User query is sent to an LLM that generates 3-4 routed queries (`query + topic + section`).
3. Each routed query runs similarity search in Qdrant with metadata constraints.
4. Results are boosted with lexical matching and fused using Reciprocal Rank Fusion (RRF).
5. Top fused documents are passed to a second LLM for final answer generation.
6. UI shows the final markdown response.

## Why These Decisions

### 1) Multi-query expansion instead of single-query retrieval

- One user sentence may not match all relevant doc chunks semantically.
- Multiple focused queries increase recall and reduce missed context.
- Routing each query with `topic` and `section` keeps retrieval targeted.

### 2) `must(topic)` + `should(section)` in Qdrant filters

This is an important improvement you made:

- Earlier approach: both `topic` and `section` in `must`.
- Problem: section labels can be too specific/noisy, so strict matching drops useful chunks.
- Current approach:
  - `must: metadata.topic = q.topic` keeps retrieval inside the right domain.
  - `should: metadata.section = q.section` gives section preference, but does not block otherwise relevant chunks.
- Result: better balance of precision and recall, so final documents are usually more relevant.

### 3) Lexical boost on top of vector search

- Pure embedding similarity can miss exact keyword intent in technical docs.
- If a chunk contains the exact query phrase, it gets an additional boost path.
- This helps when users ask config names, feature terms, or exact API words.

### 4) Reciprocal Rank Fusion (RRF) for final ranking

- Different expanded queries retrieve different good chunks.
- RRF combines rankings from all result sets without relying on raw score calibration.
- Formula used: `1 / (k + rank + 1)` (with `k = 60`).
- This reduces single-query bias and surfaces consistently relevant documents.

### 5) Two-model flow (routing model + answer model)

- Routing stage and answer stage have different goals.
- Query model (`openai/gpt-oss-120b`) is optimized for structured routing output.
- Final model (`groq/compound`) is optimized for grounded answer synthesis from retrieved context.

## Models Used

### 1) Ingestion (Embedding model)

- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Used in: `script/ingest.ts` and `src/lib/vectorStore.ts`
- Purpose: convert document chunks into dense vectors before storing in Qdrant.

### 2) Query generation (Routing model)

- Model: `openai/gpt-oss-120b` (via Groq)
- Used in: `src/lib/multiQuery.ts`
- Purpose: generate 3-4 structured retrieval queries with `topic` and `section`.

### 3) Final output generation (Answer model)

- Model: `groq/compound`
- Used in: `src/lib/finalOutput.ts`
- Purpose: generate the final grounded answer using retrieved document context.

## Current Project Flow (Code Map)

- `script/ingest.ts`
  - Crawls Qdrant docs pages.
  - Cleans HTML and extracts main content.
  - Splits into chunks (`chunkSize: 1000`, `chunkOverlap: 200`).
  - Classifies and stores `topic` + `section` in metadata.
  - Writes `topicList.txt` and `section.txt`.

- `src/lib/vectorStore.ts`
  - Creates/reuses Qdrant vector store instance.
  - Uses `sentence-transformers/all-MiniLM-L6-v2`.
  - Creates payload indexes for `metadata.topic` and `metadata.section`.

- `src/lib/multiQuery.ts`
  - Converts user query to routed query array: `{ query, topic, section }`.

- `src/lib/documentRetrieval.ts`
  - Runs similarity search with score.
  - Uses:
    - `must` for topic
    - `should` for section
  - Applies lexical boost.
  - Applies RRF and returns top documents.

- `src/lib/finalOutput.ts`
  - Formats retrieved docs into context blocks.
  - Sends context + original question to final LLM.
  - Returns markdown answer.

- `src/app/api/query/route.ts`
  - Orchestrates the end-to-end pipeline for POST `/api/query`.

- `src/app/(app)/Query-Dashboard/page.tsx`
  - Frontend dashboard to submit query and render markdown output.

## Environment Variables

Create `.env` with:

```env
QDRANT_URL=
QDRANT_API_KEY=
HUGGINGFACEHUB_API_KEY=
GROQ_API_KEY=
```

## Run Locally

Install and run:

```bash
npm install
npm run dev
```

Ingest docs (one-time or when refreshing data):

```bash
npm run ingest
```

Open:

- `http://localhost:3000`

## API

### `POST /api/query`

Request:

```json
{
  "query": "How does filtering work in Qdrant?"
}
```

Response (success):

```json
{
  "output": "..."
}
```

Response (non-Qdrant intent):

```json
{
  "message": "Please ask a Qdrant-related question."
}
```

