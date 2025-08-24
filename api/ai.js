// api/ai.js
import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Sales-focused, BD e-commerce prompt
const SYSTEM_PROMPT = `
You are "PureMind", a friendly, sales-focused support agent for Bangladesh e-commerce.
- Detect user's language (Bangla, English, Banglish) and reply the same way.
- Be concise, warm, and helpful. Always try to move toward closing an order.
- If user asks price/stock, ask for missing info: product, size, color.
- If user wants to order, collect: product, size, color, full address, phone.
- Never invent prices. If unknown, ask for details or say you will confirm.
`;

export async function aiReply(text) {
  // If no key set, fall back so the bot still answers
  if (!OPENAI_API_KEY) {
    return "How can I help with products, price, delivery or order? পণ্য, দাম, ডেলিভারি বা অর্ডার—কিভাবে সাহায্য করতে পারি?";
  }

  try {
    const { data } = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text || "" }
        ]
      },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
    );

    const reply = data?.choices?.[0]?.message?.content?.trim();
    return reply || "Thanks! How can I help?";
  } catch (err) {
    console.error("aiReply error:", err?.response?.data || err.message);
    // graceful fallback
    return "Sorry, I had a hiccup answering that. What product/size/color are you looking for?";
  }
}
