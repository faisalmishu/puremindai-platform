// Serverless webhook for Messenger/Instagram + WhatsApp Cloud API
import { sendToMessenger, sendToWhatsApp } from "./send.js";
import { aiReply } from "./ai.js"; // <-- NEW: AI replies

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;        // any string you set in Vercel
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // FB Page token
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;    // WhatsApp Cloud API token
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;  // WhatsApp phone number ID

export default async function handler(req, res) {
  // --- 1) Meta verification for Messenger/IG & WhatsApp (GET) ---
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Verification failed");
  }

  // --- 2) Incoming messages (POST) ---
  if (req.method === "POST") {
    try {
      const body = req.body;

      // A) Messenger / Instagram payload
      if (body.object === "page" && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          const messaging = entry.messaging || [];
          for (const evt of messaging) {
            const senderId = evt.sender?.id;
            // ignore echoes we sent ourselves
            if (evt.message?.is_echo) continue;
            const text = (evt.message?.text || "").trim();
            if (senderId && text) {
              // --- AI reply instead of rule-based ---
              const reply = await aiReply(text);
              await sendToMessenger(PAGE_ACCESS_TOKEN, senderId, reply);
            }
          }
        }
      }

      // B) WhatsApp payload
      if (body.object === "whatsapp_business_account" && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          for (const change of entry.changes || []) {
            const messages = change.value?.messages || [];
            for (const msg of messages) {
              const from = msg.from;               // customer's phone (string)
              const text = (msg.text?.body || "").trim();
              if (from && text) {
                const reply = await aiReply(text);
                await sendToWhatsApp(WHATSAPP_TOKEN, PHONE_NUMBER_ID, from, reply);
              }
            }
          }
        }
      }

      // Always 200 OK so Meta doesn't retry
      return res.status(200).send("OK");
    } catch (e) {
      console.error("webhook error:", e?.response?.data || e.message);
      // Still 200 to acknowledge receipt (prevents repeated retries)
      return res.status(200).send("OK");
    }
  }

  res.status(405).send("Method Not Allowed");
}
