const express = require('express');
const axios = require('axios');
const config = require('./config');

const app = express();
const PORT = 9877;

app.use(express.json());

async function fetchStockData(path) {
    try {
        const response = await axios.get(`${config.STOCK_API_BASE_URL}${path}`, {
            headers: {
                Authorization: `Bearer ${config.AUTH_TOKEN}`
            },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw { status: error.response.status, message: error.response.data };
        } else if (error.request) {
            throw { status: 500, message: 'External API did not respond.' };
        } else {
            throw { status: 500, message: 'Error in setting up the request to external API.' };
        }
    }
}

app.get('/stocks', async (req, res) => {
    try {
        const data = await fetchStockData('/stocks');
        return res.json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.get('/stocks/:ticker', async (req, res) => {
    const { ticker } = req.params;
    if (!ticker) {
        return res.status(400).json({ error: 'Ticker symbol is required.' });
    }

    try {
        const data = await fetchStockData(`/stocks/${ticker}`);
        return res.json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.get('/stocks/:ticker/history', async (req, res) => {
    const { ticker } = req.params;
    const { minutes } = req.query;

    if (!ticker) {
        return res.status(400).json({ error: 'Ticker symbol is required.' });
    }
    if (!minutes || isNaN(parseInt(minutes))) {
        return res.status(400).json({ error: 'Valid "minutes" query parameter is required (e.g., ?minutes=50).' });
    }

    try {
        const data = await fetchStockData(`/stocks/${ticker}?minutes=${minutes}`);
        return res.json(data);
    } catch (error) {
        return res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Stock Exchange Microservice listening on http://localhost:${PORT}`);
});