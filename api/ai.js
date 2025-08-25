// api/ai.js — diagnostic + robust
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_PROJECT = process.env.OPENAI_PROJECT || "";   // optional (for Project API keys)
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com"; // optional override
const MODEL_NAME = process.env.MODEL_NAME || "gpt-4o-mini"; // change if needed

const SYSTEM_PROMPT = `
You are "PureMind", a friendly, sales-focused support agent for Bangladesh e-commerce.
- Detect user's language (Bangla, English, Banglish) and reply the same way.
- Be concise, warm, and helpful. Move toward closing an order.
- If user asks price/stock, ask for missing info: product, size, color.
- If user wants to order, collect: product, size, color, full address, phone.
- Never invent prices. If unknown, ask for details or say you will confirm.
`;

export async function aiReply(text) {
  if (!OPENAI_API_KEY) {
    console.error("aiReply error: OPENAI_API_KEY missing");
    return "How can I help with products, price, delivery or order? পণ্য, দাম, ডেলিভারি বা অর্ডার—কিভাবে সাহায্য করতে পারি?";
  }

  const headers = {
    "Authorization": `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json"
  };
  // If you’re using the new OpenAI “Projects”, include this header (set OPENAI_PROJECT in Vercel)
  if (OPENAI_PROJECT) headers["OpenAI-Project"] = OPENAI_PROJECT;

  try {
    const url = `${OPENAI_BASE_URL}/v1/chat/completions`;
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: MODEL_NAME,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text || "" }
        ]
      })
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error("aiReply OpenAI error:", { status: resp.status, data });
      // Show a helpful hint in fallback
      if (resp.status === 401) return "OpenAI key seems invalid/expired. Please set a valid API key.";
      if (resp.status === 429) return "Quota exceeded. Please add billing/credit to OpenAI.";
      if (resp.status === 404 || (data?.error?.code === "model_not_found"))
        return "Selected model isn’t available for this key. I’ll help if you choose another model.";
      if (resp.status === 403) return "Access to this model/project is restricted. Check OpenAI Project/Org settings.";
      return "Sorry, I’ve got a hiccup talking to AI. Which product/size/color do you need?";
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    return reply || "Thanks! How can I help with product, price, delivery or order?";
  } catch (err) {
    console.error("aiReply fetch error:", err?.message || err);
    return "Sorry, I’ve got a hiccup talking to AI. Which product/size/color do you need?";
  }
}
