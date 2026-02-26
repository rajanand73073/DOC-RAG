"use client";

import { motion } from "framer-motion";
import { Database, Search, Layers, Sparkles, GitBranch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import Link from "next/link";
import type { ReactNode } from "react";

type CardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};
export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-black via-zinc-900 to-zinc-950 text-white">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold tracking-tight"
        >
          Intelligent Documentation RAG System
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto"
        >
          Multi‑Query Retrieval + Hybrid Search + Reciprocal Rank Fusion.
          Built for precision, scalability, and production‑grade knowledge retrieval.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex justify-center gap-4"
        >
       <Link href="/Query-Dashboard">
        <Button className="rounded-2xl px-8 cursor-pointer hover:bg-zinc-800 hover:text-white"  >
            Get Started
          </Button>
        </Link>
          
          <Button
            size="lg"
            variant="outline"
            className="rounded-2xl px-8 border-zinc-700 text-black"
          >
            View Architecture
          </Button>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8 ">
          <FeatureCard 
            icon={<Layers size={28} />}
            title="Smart Chunking"
            description="Recursive text splitting optimized for semantic coherence and retrieval accuracy."
          />
          <FeatureCard
            icon={<Search size={28} />}
            title="Hybrid Retrieval"
            description="Combines vector similarity and keyword search for higher precision in documentation queries."
          />
          <FeatureCard
            icon={<GitBranch size={28} />}
            title="Multi‑Query Expansion"
            description="LLM generates reformulated queries to maximize recall and reduce missed relevant context."
          />
        </div>
      </section>

      {/* Architecture Section */}
      <section className="bg-zinc-900/40 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-semibold text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8 mt-16">
            <StepCard
              icon={<Database size={26} />}
              title="Ingest Docs"
              description="Load web documentation using WebBaseLoader and store structured chunks."
            />
            <StepCard
              icon={<Layers size={26} />}
              title="Create Embeddings"
              description="Convert chunks into vector embeddings and index in Qdrant."
            />
            <StepCard
              icon={<Search size={26} />}
              title="Hybrid Search"
              description="Parallel retrieval across expanded queries with vector + keyword search."
            />
            <StepCard
              icon={<Sparkles size={26} />}
              title="Generate Answer"
              description="RRF fused results sent to LLM for reliable and context-aware output."
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="text-center py-20">
        <h3 className="text-2xl font-semibold">
          Ready to Build Enterprise‑Grade RAG?
        </h3>
        <p className="text-zinc-400 mt-4">
          Deploy scalable, intelligent documentation search powered by LangChain and Qdrant.
        </p>
        <div className="mt-8">
          <Button size="lg" className="rounded-2xl px-10">
            Launch Project
          </Button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: CardProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 rounded-2xl hover:scale-105 transition-transform">
      <CardContent className="p-8 text-white">
        <div className="text-indigo-400">{icon}</div>
        <h3 className="mt-4 text-xl font-semibold">{title}</h3>
        <p className="mt-3 text-white text-sm leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
function StepCard({ icon, title, description }: CardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-800 transition-colors">
      <div className="text-indigo-400">{icon}</div>
      <h4 className="mt-4 font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
