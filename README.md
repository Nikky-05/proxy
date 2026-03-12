# Proxy Sync UI & Backend

A modern, glassmorphism-style dashboard to synchronize proxy data from Apigee to a PostgreSQL database.

## Features
- **Dashboard UI**: Modern dark theme with real-time status updates.
- **Token Generation**: Handles Apigee OAuth2 password grant flow.
- **Database Sync**: Fetches proxy list and stores them in PostgreSQL.
- **Duplicate Prevention**: Intelligently skips proxies that are already in the database.

## Prerequisites
- Node.js (v14+)
- PostgreSQL

## Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd proxy
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Database Setup**:
   Create a table in PostgreSQL using the provided `schema.sql`:
   ```sql
   CREATE TABLE proxy (
       id SERIAL PRIMARY KEY,
       proxy TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. **Environment Configuration**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

## Running the app

```bash
npm start
```
Access the app at: `http://localhost:8081`