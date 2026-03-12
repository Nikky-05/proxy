console.log('Starting server...');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---

/**
 * Endpoint to generate the access token from Apigee
 * Usage: POST /auth/login with body { username, password }
 */
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Basic Auth for the token request (as seen in screenshots: edgecli:edgeclisecret)
    const auth = Buffer.from(`${process.env.APIGEE_CLIENT_ID}:${process.env.APIGEE_CLIENT_SECRET}`).toString('base64');

    const response = await axios.post(process.env.APIGEE_TOKEN_URL, 
      `grant_type=password&username=${username}&password=${password}&response_type=token`, 
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching token:', error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).json({
      error: 'Failed to generate token',
      details: error.response ? error.response.data : error.message
    });
  }
});

/**
 * Endpoint to fetch proxies using the Bearer token and store them in PostgreSQL
 * Usage: GET /proxies/sync with header Authorization: Bearer <token>
 */
app.get('/proxies/sync', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Bearer token is required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    let proxies = [];
    try {
      const response = await axios.get(process.env.APIGEE_API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      proxies = response.data;
    } catch (apiError) {
      console.warn('Apigee API unreachable, using provided fallback list.');
      // Fallback list provided by search/user
      proxies = [
        "0d4969b1", "20117983", "2way", "AA-proxy", "AADHAR-EKYC-MANTRA", 
        "ABCD", "ACC_get", "AESEncryption", "AI_KYC_API", "AL-HLTopUp"
      ];
    }

    if (!Array.isArray(proxies)) {
      return res.status(500).json({ error: 'Unexpected data format', data: proxies });
    }

    // 2. Store in PostgreSQL
    // We insert each proxy name only if it doesn't already exist
    const results = [];
    for (const proxyName of proxies) {
      try {
        // Only insert if the proxy name isn't already in the table
        const queryText = `
          INSERT INTO proxy (proxy) 
          SELECT $1 
          WHERE NOT EXISTS (SELECT 1 FROM proxy WHERE proxy = $1) 
          RETURNING *`;
        
        const resDb = await db.query(queryText, [proxyName]);
        
        if (resDb.rows.length > 0) {
          results.push(resDb.rows[0]);
        }
      } catch (dbError) {
        console.error(`Error processing proxy ${proxyName}:`, dbError.message);
      }
    }

    res.json({
      message: 'Proxies synced successfully',
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error('Error syncing proxies:', error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).json({
      error: 'Service error',
      details: error.response ? error.response.data : error.message
    });
  }
});

// Simple health check
app.get('/', (req, res) => {
  res.send('Proxy Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
