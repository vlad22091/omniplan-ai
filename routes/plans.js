import express from "express";
const router = express.Router();
import db from "../db/connector.js";

router.get('/', (req, res) => {
  res.render('main');
});

router.get('/db', async function(req, res, next) {
  try {
    const result = await db.query('SELECT * FROM plans ORDER BY created_at DESC');
    res.render('plans_list', { plans: result.rows });
  } catch (err) {
    console.error(err);
    res.status(400).send("Помилка бази даних");
  }
});

router.get('/generate', (req, res) => {
  res.render('generate_form');
});

router.post('/generate', async (req, res) => {
  const { title, category, user_prompt } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "Ти професійний асистент з планування. Створюй чіткі, покрокові та структуровані плани українською мовою. Використовуй марковані списки та виділення головного.",
          },
          {
            role: "user",
            content: `Категорія: ${category}. Тема: ${title}. Додаткові побажання: ${user_prompt}. Напиши детальний план дій.`,
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Groq API error");
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    await db.query(
      `INSERT INTO plans (title, category, user_prompt, generated_content) VALUES ($1, $2, $3, $4)`,
      [title, category, user_prompt, generatedContent]
    );

    res.redirect('/db');

  } catch (err) {
    console.error("Groq Error:", err.message);
    res.status(400).send(`Помилка генерації: ${err.message}`);
  }
});

router.post('/favorite', async (req, res) => {
  const { id, is_favorite } = req.body;
  try {
    await db.query('UPDATE plans SET is_favorite = $1 WHERE id = $2', [is_favorite, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).send("Помилка бази даних");
  }
});

router.post('/update-status', async (req, res) => {
  const { id, status } = req.body;
  
  try {
    await db.query('UPDATE plans SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true, message: "Статус оновлено" });
  } catch (err) {
    console.error("Помилка оновлення статусу:", err);
    res.status(500).json({ success: false, error: "Помилка бази даних" });
  }
});

router.post('/delete', async (req, res) => {
  const { id } = req.body;
  
  try {
    await db.query('DELETE FROM plans WHERE id = $1', [id]);
    res.json({ success: true, message: "План видалено" });
  } catch (err) {
    console.error("Помилка видалення:", err);
    res.status(500).json({ success: false, error: "Помилка бази даних" });
  }
});

export default router;