INSERT INTO affiliates (id, name) VALUES
(1, 'Alpha Partners'),
(2, 'Beta Media')
ON CONFLICT DO NOTHING;


INSERT INTO campaigns (id, name) VALUES
(10, 'Summer Sale'),
(11, 'New Launch')
ON CONFLICT DO NOTHING;