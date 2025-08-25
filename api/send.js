// api/send.js
import axios from "axios";

/**
 * Send a plain-text message to a Messenger recipient using a Page Access Token.
 * Uses /me/messages which works with just the token (no pageId needed).
 */
export async function sendToMessenger(PAGE_ACCESS_TOKEN, recipientId, text) {
  const url = `https://graph.facebook.com/v18.0/me/messages`;
  try {
    await axios.post(
      url,
      {
        recipient: { id: recipientId },
        message: { text }
      },
      { params: { access_token: PAGE_ACCESS_TOKEN } }
    );
    console.log("SENT TO MESSENGER OK");
  } catch (e) {
    console.error("sendToMessenger axios error:", e?.response?.data || e.message);
    throw e;
  }
}

/**
 * Send a WhatsApp text message via Cloud API.
 */
export async function sendToWhatsApp(WHATSAPP_TOKEN, PHONE_NUMBER_ID, to, text) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
  try {
    await axios.post(
      url,
      { messaging_product: "whatsapp", to, type: "text", text: { body: text } },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
    console.log("SENT TO WHATSAPP OK");
  } catch (e) {
    console.error("sendToWhatsApp axios error:", e?.response?.data || e.message);
    throw e;
  }
}
