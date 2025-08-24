-- Schema for affiliates/campaigns/clicks/conversions
-- Note: For simplicity, we make click_id globally unique.


CREATE TABLE IF NOT EXISTS affiliates (
id SERIAL PRIMARY KEY,
name TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS campaigns (
id SERIAL PRIMARY KEY,
name TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS clicks (
id SERIAL PRIMARY KEY,
affiliate_id INTEGER NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
click_id TEXT NOT NULL UNIQUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS conversions (
id SERIAL PRIMARY KEY,
click_id TEXT NOT NULL REFERENCES clicks(click_id) ON DELETE CASCADE,
amount NUMERIC(12,2) NOT NULL,
currency TEXT NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);