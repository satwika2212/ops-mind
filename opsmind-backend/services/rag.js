const Document = require("../models/Document");
const getEmbedding = require("./embedding");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// cosine similarity
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

async function runRAG(query) {
  // 🔹 Step 1: Convert query → embedding
  const queryEmbedding = await getEmbedding(query);

  // 🔹 Step 2: Fetch documents
  const docs = await Document.find();

  // 🔹 Step 3: Similarity scoring
  const scoredDocs = docs.map(doc => {
    const score = cosineSimilarity(queryEmbedding, doc.embedding);
    return { ...doc._doc, score };
  });

  // 🔹 Step 4: Get top 3 chunks
  const topChunks = scoredDocs
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // 🚫 Step 5: Hallucination Guardrail
  if (topChunks.length === 0 || topChunks[0].score < 0.7) {
    return {
      answer: "I don't know based on available documents.",
      sources: [],
    };
  }

  // 🔹 Step 6: Build context
  const context = topChunks.map(c => c.content).join("\n");

  // 🔹 Step 7: LLM call
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const prompt = `
You are OpsMind AI.

STRICT RULES:
1. Answer ONLY from the context
2. ALWAYS include source + page
3. If missing info → say "I don't know"

Context:
${context}

Question:
${query}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // 🔹 Step 8: Return structured response
  return {
    answer: text,
    sources: topChunks.map(c => ({
      file: c.source,
      page: c.page,
    })),
  };
}

module.exports = runRAG;