// api/ai-check.js
import { aiReply } from "./ai.js";

export default async function handler(req, res) {
  const q = req.query.q || "Hello from PureMind!";
  try {
    const ans = await aiReply(q);
    res.status(200).json({ ok: true, q, ans });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "error" });
  }
}
