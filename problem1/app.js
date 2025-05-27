const express = require('express');
const axios = require('axios');
const config = require('./config');

const app = express();
const PORT = 9876;

let windowNumbers = [];

function updateWindow(newNumbers) {
    const currentWindowSet = new Set(windowNumbers);
    const addedThisFetch = [];

    for (const num of newNumbers) {
        if (typeof num === 'number' && !currentWindowSet.has(num)) {
            windowNumbers.push(num);
            currentWindowSet.add(num);
            addedThisFetch.push(num);
        }
    }

    if (windowNumbers.length > config.WINDOW_SIZE) {
        windowNumbers = windowNumbers.slice(windowNumbers.length - config.WINDOW_SIZE);
    }

    return addedThisFetch;
}

function calculateAverage(arr) {
    if (arr.length === 0) {
        return 0.00;
    }
    const sum = arr.reduce((acc, num) => acc + num, 0);
    return parseFloat((sum / arr.length).toFixed(2));
}

app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;
    const apiEndpoint = config.API_ENDPOINTS[numberid];

    if (!apiEndpoint) {
        return res.status(400).json({ error: 'Invalid number ID provided. Must be "p", "f", "e", or "r".' });
    }

    const windowPrevState = [...windowNumbers];

    let fetchedNumbers = [];
    try {
        const response = await axios.get(apiEndpoint, {
            timeout: 500,
            headers: {
                Authorization: `Bearer ${config.AUTH_TOKEN}`
            }
        });

        if (Array.isArray(response.data.numbers)) {
            fetchedNumbers = response.data.numbers;
        } else {
            fetchedNumbers = [];
        }

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error(`Request to ${apiEndpoint} timed out.`);
        } else if (error.response) {
            console.error(`Error from ${apiEndpoint} (Status: ${error.response.status}).`);
        } else if (error.request) {
            console.error(`No response received from ${apiEndpoint}.`);
        } else {
            console.error(`Error setting up request to ${apiEndpoint}.`);
        }
    }

    const actualNumbersAddedToWindow = updateWindow(fetchedNumbers);

    const windowCurrState = [...windowNumbers];

    const average = calculateAverage(windowCurrState);

    return res.json({
        windowPrevState: windowPrevState,
        windowCurrState: windowCurrState,
        numbers: fetchedNumbers,
        avg: average
    });
});

app.listen(PORT, () => {
    console.log(`Average Calculator Microservice listening on http://localhost:${PORT}`);
});