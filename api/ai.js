// api/ai.js
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `
You are "PureMind", a friendly, sales-focused support agent for Bangladesh e-commerce.
- Detect user's language (Bangla, English, Banglish) and reply the same way.
- Be concise, warm, and helpful. Always move toward closing an order.
- If user asks price/stock, ask missing info: product, size, color.
- If user wants to order, collect: product, size, color, full address, phone.
- Never invent prices. If unknown, ask for details or say you will confirm.
`;

export async function aiReply(text) {
  if (!OPENAI_API_KEY) {
    console.error("aiReply error: OPENAI_API_KEY missing");
    return "How can I help with products, price, delivery or order? পণ্য, দাম, ডেলিভারি বা অর্ডার—কিভাবে সাহায্য করতে পারি?";
  }

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text || "" }
        ]
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("aiReply OpenAI error:", { status: resp.status, data });
      return "Sorry, a small hiccup happened. Which product / size / color do you need?";
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    return reply || "Thanks! How can I help with product, price, delivery or order?";
  } catch (err) {
    console.error("aiReply fetch error:", err?.message || err);
    return "Sorry, a small hiccup happened. Which product / size / color do you need?";
  }
}
