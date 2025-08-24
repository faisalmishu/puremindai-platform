import axios from "axios";

// Send to Facebook Messenger / Instagram (same Graph endpoint)
export async function sendToMessenger(PAGE_ACCESS_TOKEN, recipientId, text) {
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  await axios.post(url, {
    recipient: { id: recipientId },
    message: { text }
  });
}

// Send to WhatsApp Cloud API
export async function sendToWhatsApp(WHATSAPP_TOKEN, PHONE_NUMBER_ID, to, text) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
  await axios.post(url, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text }
  }, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
  });
}
