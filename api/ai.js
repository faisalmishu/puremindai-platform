// api/ai.js
import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_NAME = process.env.MODEL_NAME || "gpt-4o-mini";   // OpenAI model
const FALLBACK_MODEL = process.env.FALLBACK_MODEL || "openrouter/llama-3.1-70b"; // fallback

const SYSTEM_PROMPT = `
You are "PureMind", a friendly sales-focused support agent for Bangladesh e-commerce.
- Detect language (Bangla, English, Banglish) and reply the same way.
- Be concise, warm, and helpful.
- Always try to move toward closing an order.
- If asked price/stock, request product, size, color.
- If user wants to order, collect product, size, color, address, phone.
`;

export async function aiReply(text) {
  // 1) Try OpenAI first
  if (OPENAI_API_KEY) {
    try {
      const { data } = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: MODEL_NAME,
          temperature: 0.5,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text || "" },
          ],
        },
        { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
      );
      return data?.choices?.[0]?.message?.content?.trim() || "How can I help?";
    } catch (err) {
      console.error("OpenAI failed:", err?.response?.data || err.message);
    }
  }

  // 2) Fallback: OpenRouter
  if (OPENROUTER_API_KEY) {
    try {
      const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: FALLBACK_MODEL,
          temperature: 0.5,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text || "" },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://puremindai-platform.vercel.app", // optional but recommended
            "X-Title": "PureMind Assistant",
          },
        }
      );
      return data?.choices?.[0]?.message?.content?.trim() || "How can I help?";
    } catch (err) {
      console.error("OpenRouter failed:", err?.response?.data || err.message);
    }
  }

  // If both fail
  return "Sorry, I had a hiccup. What product/size/color are you looking for?";
}
