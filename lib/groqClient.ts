import Groq from "groq-sdk";

let client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY belum di-set. Tambahkan di file .env.local (development) atau Environment Variables di Vercel (production)."
    );
  }
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}
