// api/webhook.js — AI version
import { aiReply } from "./ai.js";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

export default async function handler(req, res) {
  // --- Verification (GET) ---
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Verification failed");
  }

  // --- Messages (POST) ---
  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }

      // Messenger / Page payload
      if (body?.object === "page" && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          const messaging = entry.messaging || [];
          for (const evt of messaging) {
            if (evt.message?.is_echo) continue; // ignore our own echoes
            const senderId = evt.sender?.id;
            const text = (evt.message?.text || "").trim();
            if (!senderId || !text) continue;

            // AI reply
            const reply = await aiReply(text);

            // send back
            const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
            const payload = { recipient: { id: senderId }, message: { text: reply } };
            const resp = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const json = await resp.json().catch(() => ({}));
            if (!resp.ok) console.error("SEND ERROR:", json);
          }
        }
      }
      return res.status(200).send("OK");
    } catch (e) {
      console.error("HANDLER ERROR:", e?.message);
      return res.status(200).send("OK");
    }
  }

  res.status(405).send("Method Not Allowed");
}
