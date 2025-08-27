// api/webhook.js
import { aiReply } from "./ai.js";
import { getChannelByPageId, searchCatalog, topCatalog, insertOrder } from "./db.js";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

function formatContext(items = []) {
  if (!items.length) return "";
  const lines = items.slice(0, 3).map(i => `• ${i.name} — ${i.price} BDT (SKU: ${i.sku})`);
  return `In-stock items:\n${lines.join("\n")}\nIf the user wants to order, collect: product/SKU, size, color, full address, phone.`;
}
function looksLikeOrder(t) {
  const s = (t || "").toLowerCase();
  return /(order|অর্ডার|buy|kinte|purchase|confirm)/.test(s);
}

export default async function handler(req, res) {
  // Verification
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.status(403).send("Verification failed");
  }

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }

    // Messenger events
    if (body?.object === "page" && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        const pageId = entry.id;
        const ch = await getChannelByPageId(pageId);
        if (!ch?.access_token) { console.error("No channel/token for pageId", pageId); continue; }

        const messaging = entry.messaging || [];
        for (const evt of messaging) {
          if (evt.message?.is_echo) continue;
          const senderId = evt.sender?.id;
          const text = (evt.message?.text || "").trim();
          if (!senderId || !text) continue;

          let items = await searchCatalog(ch.tenant_id, text, 5);
          if (!items?.length) items = await topCatalog(ch.tenant_id, 3);
          const ctx = formatContext(items);

          const reply = await aiReply(text, ctx);

          const r = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${ch.access_token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: { id: senderId }, message: { text: reply } })
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) console.error("SEND ERROR:", j);

          if (looksLikeOrder(text) || looksLikeOrder(reply)) {
            try {
              await insertOrder(ch.tenant_id, { channel: "messenger", customer_ref: senderId, raw_text: text, status: "new" });
            } catch (e) { console.error("insertOrder error:", e?.message || e); }
          }
        }
      }
    }

    return res.status(200).send("OK");
  } catch (e) {
    console.error("webhook error:", e?.message || e);
    return res.status(200).send("OK");
  }
}
