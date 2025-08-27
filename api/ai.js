// api/ai.js
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_PROJECT = process.env.OPENAI_PROJECT || "";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com";
const MODEL_NAME = process.env.MODEL_NAME || "gpt-3.5-turbo";

function buildMessages(text, context = "") {
  const ctx = context ? `\nCATALOG CONTEXT:\n${context}\n` : "";
  return [
    {
      role: "system",
      content: `
You are "PureMind", a friendly, sales-focused support agent for Bangladesh e-commerce.
- Use Bangla/English based on user.
- If catalog context is provided, suggest 1–3 in-stock items with name + price (BDT).
- If unsure, ask 1–2 clarifying questions.
- If user wants to order, collect: product/SKU, size, color, full address, phone.
${ctx}
`
    },
    { role: "user", content: text || "" }
  ];
}

export async function aiReply(text, context = "") {
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing");
    return "How can I help with products, price, delivery or order? পণ্য, দাম, ডেলিভারি বা অর্ডার—কিভাবে সাহায্য করতে পারি?";
  }

  const headers = { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" };
  if (OPENAI_PROJECT) headers["OpenAI-Project"] = OPENAI_PROJECT;

  try {
    const resp = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: MODEL_NAME, temperature: 0.4, messages: buildMessages(text, context) })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error("OpenAI error:", resp.status, data);
      if (resp.status === 429) return "Quota exceeded. Please add billing to OpenAI.";
      return "Sorry, a small hiccup happened. Which product/size/color do you need?";
    }
    return data?.choices?.[0]?.message?.content?.trim()
      || "Thanks! How can I help with product, price, delivery or order?";
  } catch (e) {
    console.error("aiReply error:", e?.message || e);
    return "Sorry, a small hiccup happened. Which product/size/color do you need?";
  }
}
