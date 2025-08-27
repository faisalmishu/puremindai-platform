// api/db.js
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// single server-side client
export const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

// Look up Messenger channel by page_id
export async function getChannelByPageId(pageId) {
  const { data, error } = await sb
    .from("channels")
    .select("id, tenant_id, type, page_id, access_token, status")
    .eq("type", "messenger")
    .eq("page_id", pageId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Look up WhatsApp channel by phone_number_id (for later)
export async function getChannelByPhoneId(phoneNumberId) {
  const { data, error } = await sb
    .from("channels")
    .select("id, tenant_id, type, phone_number_id, access_token, status")
    .eq("type", "whatsapp")
    .eq("phone_number_id", phoneNumberId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Simple search by first word against name/tags
export async function searchCatalog(tenantId, text, limit = 5) {
  const first = (text || "").toLowerCase().split(/\s+/)[0] || "";
  const { data, error } = await sb
    .from("catalog_items")
    .select("sku,name,price,tags,stock,image_url")
    .or(`name.ilike.%${first}%,tags.ilike.%${first}%`)
    .eq("tenant_id", tenantId)
    .gt("stock", 0)
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function topCatalog(tenantId, limit = 3) {
  const { data, error } = await sb
    .from("catalog_items")
    .select("sku,name,price,tags,stock,image_url")
    .eq("tenant_id", tenantId)
    .gt("stock", 0)
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function insertOrder(tenantId, row) {
  const { data, error } = await sb.from("orders").insert({ tenant_id: tenantId, ...row }).select().single();
  if (error) throw error;
  return data;
}
