// Serverless webhook for Messenger/Instagram + WhatsApp Cloud API
import { sendToMessenger, sendToWhatsApp } from "./send.js";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // choose any string, put in Vercel env
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // from your FB App/Page
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // from WhatsApp Cloud API
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // WA phone number ID

// Vercel-style default export handler
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

      // A) Messenger/Instagram payload
      if (body.object === "page" && body.entry) {
        for (const entry of body.entry) {
          const messaging = entry.messaging || [];
          for (const evt of messaging) {
            const senderId = evt.sender?.id;
            const text = evt.message?.text;
            if (senderId && text) {
              // Simple echo for now. We'll replace with AI later.
              const reply = await smartReply(text);
              await sendToMessenger(PAGE_ACCESS_TOKEN, senderId, reply);
            }
          }
        }
      }

      // B) WhatsApp payload
      if (body.object === "whatsapp_business_account" && body.entry) {
        for (const entry of body.entry) {
          for (const change of entry.changes || []) {
            const messages = change.value?.messages || [];
            for (const msg of messages) {
              const from = msg.from;        // customer's phone
              const text = msg.text?.body;  // text message
              if (from && text) {
                const reply = await smartReply(text);
                await sendToWhatsApp(WHATSAPP_TOKEN, PHONE_NUMBER_ID, from, reply);
              }
            }
          }
        }
      }

      return res.status(200).send("OK");
    } catch (e) {
      console.error("webhook error:", e?.response?.data || e.message);
      return res.status(200).send("OK");
    }
  }

  res.status(405).send("Method Not Allowed");
}

// --- Very simple “smart” reply (placeholder). Replace with AI soon.
async function smartReply(userText) {
  // Basic intent-driven replies for e-commerce in BD (+ Bangla hints)
  const t = userText.toLowerCase();
  if (t.includes("price") || t.includes("dam")) return "Please tell me the product name/size, I’ll send the price. পণ্যের নাম/সাইজ বলুন, দাম পাঠাচ্ছি।";
  if (t.includes("delivery") || t.includes("shipping")) return "Inside Dhaka: 70 BDT, outside: 130 BDT. ডেলিভারি: ঢাকার ভিতরে ৭০, বাইরে ১৩০ টাকা।";
  if (t.includes("return") || t.includes("exchange")) return "7-day easy return/exchange. Proof of purchase required. ৭ দিনের মধ্যে রিটার্ন/এক্সচেঞ্জ।";
  if (t.includes("order") || t.includes("buy") || t.includes("kinte")) return "Please send product, size, color, your full address & phone. অর্ডারের জন্য পণ্য, সাইজ, রং, ঠিকানা ও ফোন দিন।";
  return "Thanks! How can I help with products, price, delivery or order? পণ্য, দাম, ডেলিভারি বা অর্ডার—কীভাবে সাহায্য করতে পারি?";
}
