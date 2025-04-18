// server.js (Updated)
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const apiKey = 'sk-u9di3e6xidkwqe';

// Endpoint for Mobile Legends Prices (Existing)
app.get('/api/mobile-legends-prices', async (req, res) => {
    try {
        const apiUrl = `https://forestapi.web.id/api/h2h/price-list/games/mobile-legends?api_key=${apiKey}&profit_percent=0`;
        const response = await axios.get(apiUrl);

        if (response.data.status === 'success' && response.data.code === 200) {
            res.json(response.data.data);
        } else {
            console.error('API Error (Prices):', response.data);
            res.status(500).json({ error: 'Failed to fetch prices' });
        }
    } catch (error) {
        console.error('Error fetching prices:', error);
        res.status(500).json({ error: 'Internal server error (prices)' });
    }
});

// Endpoint for Deposit Methods (Existing)
app.get('/api/deposit-methods', async (req, res) => {
    try {
        const apiUrl = `https://forestapi.web.id/api/h2h/deposit/methods?api_key=${apiKey}`;
        const response = await axios.get(apiUrl);

        if (response.data.status === 'success' && response.data.code === 200) {
            res.json(response.data.data);
        } else {
            console.error('API Error (Deposit Methods):', response.data);
            res.status(500).json({ error: 'Failed to fetch deposit methods' });
        }
    } catch (error) {
        console.error('Error fetching deposit methods:', error);
        res.status(500).json({ error: 'Internal server error (deposit methods)' });
    }
});

// Endpoint to Create a Deposit (Existing)
app.post('/api/create-deposit', async (req, res) => {
    try {
        const { reff_id, method, phone_number, fee_by_customer, nominal } = req.body;

        if (!reff_id || !method || !nominal) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        const apiUrl = `https://forestapi.web.id/api/h2h/deposit/create?api_key=${apiKey}&reff_id=${reff_id}&method=${method}&phone_number=${phone_number || ''}&fee_by_customer=${fee_by_customer || false}&nominal=${nominal}`;

        const response = await axios.post(apiUrl);

        if (response.data.status === 'success' && response.data.code === 200) {
            res.json(response.data.data);
        } else {
            console.error('API Error (Create Deposit):', response.data);
            res.status(500).json({ error: 'Failed to create deposit' });
        }
    } catch (error) {
        console.error('Error creating deposit:', error);
        res.status(500).json({ error: 'Internal server error (create deposit)' });
    }
});

// Endpoint to Get Deposit Status (Existing)
app.get('/api/deposit-status', async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Missing required parameter: id' });
        }

        const apiUrl = `https://forestapi.web.id/api/h2h/deposit/status?api_key=${apiKey}&id=${id}`;
        const response = await axios.get(apiUrl);

        if (response.data.status === 'success' && response.data.code === 200) {
            res.json(response.data);
        } else {
            console.error('API Error (Deposit Status):', response.data);
            res.status(500).json({ error: 'Failed to get deposit status' });
        }
    } catch (error) {
        console.error('Error getting deposit status:', error);
        res.status(500).json({ error: 'Internal server error (deposit status)' });
    }
});

// Endpoint to Cancel Deposit (New)
app.get('/api/cancel-deposit', async (req, res) => { // GET because the API uses GET
    try {
        const { id } = req.query;  // Get the 'id' from query parameters

        if (!id) {
            return res.status(400).json({ error: 'Missing required parameter: id' });
        }

        const apiUrl = `https://forestapi.web.id/api/h2h/deposit/cancel?api_key=${apiKey}&id=${id}`;
        const response = await axios.get(apiUrl); // Use axios.get because the API uses GET

        if (response.data.status === 'success' && response.data.code === 200) {
            res.json(response.data); // Or just return response.data if you want the whole response
        } else {
            console.error('API Error (Cancel Deposit):', response.data);
            res.status(500).json({ error: 'Failed to cancel deposit' });
        }
    } catch (error) {
        console.error('Error canceling deposit:', error);
        res.status(500).json({ error: 'Internal server error (cancel deposit)' });
    }
});

app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
