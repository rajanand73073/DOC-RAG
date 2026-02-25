"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

export default function Page() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [expandedQueries, setExpandedQueries] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);
    setExpandedQueries([]);

    try {
      const res = await axios.post("/api/query", { query });
      const data = res.data;
      if (data.message) {
        setResponse(data.message);
        return;
      }      
      setExpandedQueries(data.multiQueries || []);
      setResponse(null);
    } catch (err: any) {
      console.error("Error fetching response:", err);
      const apiError =
        err?.response?.data?.error || err?.response?.data?.details || err?.message || "Request failed.";
      setResponse(apiError);
    }

finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center"
        >
          Qdrant Docs RAG Dashboard
        </motion.h1>

        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask anything about Qdrant documentation..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <Button onClick={handleSubmit} disabled={loading} className="cursor-pointer hover:bg-zinc-800 hover:text-white">
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {expandedQueries.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 rounded-2xl">
            <CardContent className="p-6 space-y-3">
              <h2 className="text-xl font-semibold">Generated Multi-Queries</h2>
              <ul className="space-y-2 text-sm text-zinc-400">
                {expandedQueries.map((q, i) => (
                  <li key={i} className="bg-zinc-800 p-2 rounded-lg">
                    {q}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-zinc-900 border-zinc-800 rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Answer</h2>
                <p className="text-zinc-300 whitespace-pre-line">{response}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
