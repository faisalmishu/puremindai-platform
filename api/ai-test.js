// api/ai-test.js
import { aiReply } from "./ai.js";

export default async function handler(req, res) {
  try {
    const q = (req.query.q || "hi").toString();
    const ans = await aiReply(q);
    const hasKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length);
    return res.status(200).json({ ok: true, hasKey, q, ans });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e?.message || String(e) });
  }
}
