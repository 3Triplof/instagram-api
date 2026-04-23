import express from "express";
import fetch from "node-fetch";

const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.RAPIDAPI_KEY;

// 🔥 cache em memória (rápido e grátis)
const cache = {};
const CACHE_TIME = 10 * 60 * 1000;

app.get("/api/instagram", async (req, res) => {
  const user = req.query.user;

  if (!user) {
    return res.json({ items: [] });
  }

  const cacheKey = `insta_${user}`;

  // 🧠 cache
  if (cache[cacheKey] && Date.now() - cache[cacheKey].time < CACHE_TIME) {
    return res.json(cache[cacheKey].data);
  }

  try {
    let posts = [];

    // 🥇 API 1 - Stable
    let response = await fetch(
      `https://instagram-scraper-stable-api.p.rapidapi.com/api/scrape?username=${user}`,
      {
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
        },
      }
    );

    let data = await response.json();
    posts = data.items || data.data || [];

    // 🥈 fallback API 2
    if (!posts.length) {
      response = await fetch(
        `https://instagram-scraper-api2.p.rapidapi.com/v1/posts?username=${user}`,
        {
          headers: {
            "x-rapidapi-key": API_KEY,
            "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com",
          },
        }
      );

      data = await response.json();
      posts = data?.data?.items || [];
    }

    // 🧹 normalizar
    const result = posts.map((post) => ({
      link: post.shortcode || post.code
        ? `https://www.instagram.com/p/${post.shortcode || post.code}`
        : "#",

      image:
        post.display_url ||
        post.image_versions?.[0]?.url ||
        "",

      content_text:
        post.caption?.text ||
        post.caption ||
        "",

      date_published: post.taken_at
        ? new Date(post.taken_at * 1000).toISOString()
        : new Date().toISOString(),
    }));

    const finalData = { items: result };

    // 💾 salvar cache
    cache[cacheKey] = {
      time: Date.now(),
      data: finalData,
    };

    res.json(finalData);

  } catch (err) {
    res.json({ items: [] });
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});      image:
        post.display_url ||
        post.image_versions?.[0]?.url ||
        "",

      content_text:
        post.caption?.text ||
        post.caption ||
        "",

      date_published: post.taken_at
        ? new Date(post.taken_at * 1000).toISOString()
        : new Date().toISOString(),
    }));

    const finalData = { items: result };

    // 💾 salvar cache
    cache[cacheKey] = {
      time: Date.now(),
      data: finalData,
    };

    res.json(finalData);

  } catch (err) {
    res.json({ items: [] });
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
