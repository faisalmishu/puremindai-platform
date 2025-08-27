// api/catalog-import.js
import { sb } from "./db.js";
const ADMIN_KEY = process.env.ADMIN_KEY;

function parseCSV(csvText = "") {
  const lines = csvText.trim().split(/\r?\n/);
  const header = lines.shift().split(",").map(s => s.trim().toLowerCase());
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(",").map(s => s.trim());
    const obj = {}; header.forEach((h, i) => (obj[h] = cols[i]));
    rows.push(obj);
  }
  return rows;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  try {
    const body = req.body || {};
    if (body.adminKey !== ADMIN_KEY) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const tenantId = body.tenantId, csv = body.csv || "";
    if (!tenantId || !csv) return res.status(400).json({ ok: false, error: "tenantId and csv required" });

    const items = parseCSV(csv);
    if (!items.length) return res.status(400).json({ ok: false, error: "No rows parsed" });

    const upserts = items.map(r => ({
      tenant_id: tenantId,
      sku: r.sku,
      name: r.name,
      price: parseInt(r.price || "0", 10),
      tags: r.tags || "",
      stock: parseInt(r.stock || "0", 10),
      image_url: r.image_url || null
    }));

    const { data, error } = await sb.from("catalog_items").upsert(upserts, { onConflict: "tenant_id,sku" }).select("sku");
    if (error) throw error;
    return res.status(200).json({ ok: true, count: data?.length || 0 });
  } catch (e) {
    console.error("catalog-import error:", e?.message || e);
    return res.status(200).json({ ok: false, error: e?.message || String(e) });
  }
}
