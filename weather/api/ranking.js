// みんなのお気に入りランキング：favorite_places の地点を地名ごとに数え、上位5つを返す。
// 返すのは name と count だけ。user_id やメールアドレスは取得しない。
// Project URL と秘密の鍵は、環境変数 SUPABASE_URL / SUPABASE_SECRET_KEY から読む。

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) {
    return res.status(500).json({ error: "server is not configured" });
  }

  try {
    // name の列だけを読む（鍵は apikey ヘッダーに付ける）
    const url = base.replace(/\/+$/, "") + "/rest/v1/favorite_places?select=name&limit=10000";
    const r = await fetch(url, { headers: { apikey: key } });
    if (!r.ok) return res.status(502).json({ error: "upstream error" });
    const rows = await r.json();
    if (!Array.isArray(rows)) return res.status(502).json({ error: "upstream error" });

    const counts = new Map();
    for (const row of rows) {
      const name = row && typeof row.name === "string" ? row.name.trim() : "";
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }
    const ranking = Array.from(counts, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .slice(0, 5);

    return res.status(200).json({ ranking });
  } catch (e) {
    return res.status(502).json({ error: "upstream error" });
  }
};
