import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

const APIFY_TOKEN = process.env.APIFY_TOKEN;

// cache em memória
const cache = {};
const CACHE_TIME = 10 * 60 * 1000;

app.get("/api/instagram", async (req, res) => {
  const user = req.query.user;

  if (!user) {
    return res.json({ items: [] });
  }

  const cacheKey = `insta_${user}`;

  // cache
  if (cache[cacheKey] && Date.now() - cache[cacheKey].time < CACHE_TIME) {
    return res.json(cache[cacheKey].data);
  }

  try {
    // 🚀 inicia scraping
    const start = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usernames: [user],
          resultsLimit: 10
        })
      }
    );

    const data = await start.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.json({ items: [] });
    }

    // normalizar
    const result = data.map(post => ({
  link:
    post.url ||
    post.link ||
    (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}` : "#"),

  image:
    post.displayUrl ||
    post.image ||
    post.thumbnailUrl ||
    "",

  content_text:
    post.caption ||
    post.text ||
    post.alt ||
    "",

  date_published:
    post.timestamp
      ? new Date(post.timestamp).toISOString()
      : post.takenAt
      ? new Date(post.takenAt).toISOString()
      : new Date().toISOString()
}));

    const finalData = { items: result };

    // salvar cache
    cache[cacheKey] = {
      time: Date.now(),
      data: finalData
    };

    res.json(finalData);

  } catch (err) {
    res.json({ items: [] });
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando 🚀");
});
