import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

const APIFY_TOKEN = process.env.APIFY_TOKEN;

app.get("/api/instagram", async (req, res) => {
  const user = req.query.user;

  if (!user) {
    return res.json({ items: [] });
  }

  try {
    // 🥇 1. roda o actor
    const run = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usernames: [user],
          resultsLimit: 5
        })
      }
    );

    const runData = await run.json();
    const datasetId = runData.data.defaultDatasetId;

    // 🥈 2. pega os itens do dataset
    const dataset = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
    );

    const posts = await dataset.json();

    if (!posts.length) {
      return res.json({ items: [] });
    }

    // 🧹 normalizar
    const result = posts.map(post => ({
      link: post.url || "#",
      image: post.displayUrl || "",
      content_text: post.caption || "",
      date_published: post.timestamp
        ? new Date(post.timestamp).toISOString()
        : new Date().toISOString()
    }));

    res.json({ items: result });

  } catch (err) {
    res.json({ items: [] });
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando 🚀");
});
