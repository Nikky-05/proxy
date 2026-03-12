-- SQL to create the table if not already created
CREATE TABLE IF NOT EXISTS proxy (
    id SERIAL PRIMARY KEY,
    proxy TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
