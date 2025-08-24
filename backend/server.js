const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection using environment variable DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection on startup
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ Connection error:", err));

// Get all affiliates
app.get("/affiliates", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM affiliates");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track click endpoint
app.get("/click", async (req, res) => {
  const { affiliate_id, campaign_id, click_id } = req.query;

  if (!affiliate_id || !campaign_id || !click_id) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    await pool.query(
      `INSERT INTO clicks (affiliate_id, campaign_id, click_id, timestamp) 
       VALUES ($1, $2, $3, NOW())`,
      [affiliate_id, campaign_id, click_id]
    );
    res.json({ status: "success", message: "Click tracked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Track postback (conversion)
app.get("/postback", async (req, res) => {
  const { affiliate_id, click_id, amount, currency } = req.query;

  if (!affiliate_id || !click_id || !amount || !currency) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    // Verify click exists for affiliate_id and click_id
    const clickResult = await pool.query(
      "SELECT id FROM clicks WHERE affiliate_id = $1 AND click_id = $2",
      [affiliate_id, click_id]
    );

    if (clickResult.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Click not found" });
    }

    const click_db_id = clickResult.rows[0].id;

    // Insert conversion linked to the click
    await pool.query(
      `INSERT INTO conversions (click_id, amount, currency, timestamp) 
       VALUES ($1, $2, $3, NOW())`,
      [click_db_id, amount, currency]
    );

    res.json({ status: "success", message: "Conversion tracked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Fetch conversions for an affiliate
app.get("/conversions", async (req, res) => {
  const { affiliate_id } = req.query;

  if (!affiliate_id) {
    return res.status(400).json({ error: "Missing affiliate_id" });
  }

  try {
    const result = await pool.query(`
      SELECT c.id, c.amount, c.currency, c.timestamp
      FROM conversions c
      JOIN clicks cl ON c.click_id = cl.id
      WHERE cl.affiliate_id = $1
      ORDER BY c.timestamp DESC
    `, [affiliate_id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get clicks per campaign for an affiliate
app.get("/clicks", async (req, res) => {
  const { affiliate_id } = req.query;

  if (!affiliate_id) {
    return res.status(400).json({ error: "Missing affiliate_id" });
  }

  try {
    const result = await pool.query(`
      SELECT 
        campaigns.id AS campaign_id, 
        campaigns.name AS campaign_name,
        COUNT(clicks.id) AS clicks_count
      FROM clicks
      JOIN campaigns ON clicks.campaign_id = campaigns.id
      WHERE clicks.affiliate_id = $1
      GROUP BY campaigns.id, campaigns.name
      ORDER BY campaigns.name
    `, [affiliate_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// Existing requires, app setup...

// New endpoint: Campaign clicks count per affiliate
app.get("/campaign-clicks", async (req, res) => {
  const { affiliate_id } = req.query;
  if (!affiliate_id) {
    return res.status(400).json({ error: "Missing affiliate_id" });
  }
  try {
    const result = await pool.query(`
      SELECT campaigns.id as campaign_id, campaigns.name as campaign_name, COUNT(clicks.id) as click_count
      FROM campaigns
      LEFT JOIN clicks ON campaigns.id = clicks.campaign_id AND clicks.affiliate_id = $1
      GROUP BY campaigns.id
      ORDER BY campaigns.name
    `, [affiliate_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// New endpoint: Summary for dashboard analytics
app.get("/dashboard-summary", async (req, res) => {
  const { affiliate_id } = req.query;
  if (!affiliate_id) return res.status(400).json({ error: "Missing affiliate_id" });

  try {
    const clicksResult = await pool.query(
      "SELECT COUNT(*) FROM clicks WHERE affiliate_id = $1",
      [affiliate_id]
    );
    const conversionsResult = await pool.query(
      `SELECT COUNT(*) as total_conversions, COALESCE(SUM(amount), 0) as total_revenue
       FROM conversions c
       JOIN clicks cl ON c.click_id = cl.id
       WHERE cl.affiliate_id = $1`,
      [affiliate_id]
    );

    res.json({
      total_clicks: parseInt(clicksResult.rows[0].count, 10),
      total_conversions: parseInt(conversionsResult.rows[0].total_conversions, 10),
      total_revenue: parseFloat(conversionsResult.rows[0].total_revenue),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
