import express from 'express';
import pool from '../db.js';

const router = express.Router();

const DEFAULT_BOOKS = [
  {
    title: 'The Power of Seeking God Early',
    author: 'Pastor John Wilson',
    price: 15,
    description: 'Learn the secrets of establishing a disciplined morning prayer altar.',
    cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=60',
    pages: [
      'The Altar of the Dawn — Seeking God early is an act of spiritual dominance.',
      'Establishing the Routine — Start with 15 minutes of prayer, praise, and Bible study.',
      'Spiritual Yields — Expect divine alignment and strategic wisdom for your day.',
    ],
  },
  {
    title: 'Financial Altar & Covenant Blessings',
    author: 'Dr. Samuel Boateng',
    price: 20,
    description: 'A biblical blueprint for covenant abundance and generous living.',
    cover_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=60',
    pages: [
      'Foundations of Covenant Wealth — Obedience unlocks kingdom provision.',
      'Overcoming Financial Strife — Shift from transaction to translation.',
      'Strategic Generosity — Invest in welfare and the spread of the gospel.',
    ],
  },
];

async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int as c FROM books');
  if (rows[0].c > 0) return;
  for (const b of DEFAULT_BOOKS) {
    await pool.query(
      `INSERT INTO books (title, author, price, description, cover_url, pages) VALUES ($1,$2,$3,$4,$5,$6)`,
      [b.title, b.author, b.price, b.description, b.cover_url, JSON.stringify(b.pages)]
    );
  }
}

router.get('/', async (req, res) => {
  try {
    await seedIfEmpty();
    const result = await pool.query('SELECT * FROM books WHERE is_active = true ORDER BY title');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, author, price, description, cover_url, pages } = req.body;
    const result = await pool.query(
      `INSERT INTO books (title, author, price, description, cover_url, pages)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, author, price || 0, description, cover_url, JSON.stringify(pages || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, author, price, description, cover_url, pages, is_active } = req.body;
    const result = await pool.query(
      `UPDATE books SET title=$1, author=$2, price=$3, description=$4, cover_url=$5, pages=$6, is_active=$7
       WHERE id=$8 RETURNING *`,
      [title, author, price, description, cover_url, JSON.stringify(pages || []), is_active ?? true, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Book not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/purchases/:memberId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT book_id FROM book_purchases WHERE member_id = $1',
      [req.params.memberId]
    );
    res.json(result.rows.map(r => r.book_id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/purchase', async (req, res) => {
  try {
    const { member_id, purchaser_name, payment_method, amount } = req.body;
    const book = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (!book.rows.length) return res.status(404).json({ error: 'Book not found' });

    const result = await pool.query(
      `INSERT INTO book_purchases (book_id, member_id, purchaser_name, payment_method, amount)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (book_id, member_id) DO NOTHING RETURNING *`,
      [req.params.id, member_id || null, purchaser_name, payment_method || 'Cash', amount || book.rows[0].price]
    );
    res.status(201).json(result.rows[0] || { message: 'Already purchased' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
