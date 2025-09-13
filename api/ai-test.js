// api/ai-test.js
import { aiReply } from "./ai.js";
import axios from "axios";

export default async function handler(req, res) {
  const q = req.query.q || "Hello from PureMind!";
  let provider = "none";
  let errorOpenAI = null;
  let errorOR = null;

  // inline probe for clarity
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL_NAME = process.env.MODEL_NAME || "gpt-4o-mini";
  const FALLBACK_MODEL = process.env.FALLBACK_MODEL || "meta-llama/llama-3.1-70b-instruct";

  try {
    if (OPENAI_API_KEY) {
      try {
        const { data } = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: MODEL_NAME,
            messages: [{ role: "user", content: q }],
          },
          { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
        );
        provider = "openai";
        return res.status(200).json({
          ok: true,
          provider,
          model: MODEL_NAME,
          ans: data?.choices?.[0]?.message?.content?.trim(),
        });
      } catch (e) {
        errorOpenAI = e?.response?.data || e.message;
      }
    }

    if (OPENROUTER_API_KEY) {
      try {
        const { data } = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: FALLBACK_MODEL,
            messages: [{ role: "user", content: q }],
          },
          { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` } }
        );
        provider = "openrouter";
        return res.status(200).json({
          ok: true,
          provider,
          model: FALLBACK_MODEL,
          ans: data?.choices?.[0]?.message?.content?.trim(),
        });
      } catch (e) {
        errorOR = e?.response?.data || e.message;
      }
    }

    return res.status(200).json({
      ok: false,
      provider,
      errorOpenAI,
      errorOpenRouter: errorOR,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "error" });
  }
}
