// api/webhook.js
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

export default async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Verification failed");
  }

  if (req.method === "POST") {
    try {
      const body = req.body;
      console.log("INCOMING:", JSON.stringify(body));

      if (body.object === "page") {
        for (const entry of body.entry) {
          const messaging = entry.messaging || [];
          for (const evt of messaging) {
            const senderId = evt.sender?.id;
            const text = evt.message?.text;
            if (senderId && text) {
              console.log("MSG:", text);

              // Send fixed reply
              await fetch(
                `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    recipient: { id: senderId },
                    message: { text: "✅ I got your message: " + text }
                  })
                }
              );
            }
          }
        }
      }

      return res.status(200).send("OK");
    } catch (e) {
      console.error("ERROR:", e.message);
      return res.status(200).send("OK");
    }
  }

  res.status(405).send("Method Not Allowed");
}
