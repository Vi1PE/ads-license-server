const express = require('express');
const app = express();

app.use(express.json());

// CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Health check endpoint
app.get('/api/verify', (req, res) => {
    res.status(200).json({ status: "Server is running successfully!" });
});

// Verification endpoint
app.post('/api/verify', (req, res) => {
    const { serial } = req.body || {};
    const validSerials = [
        "AHMED-VIP-2026",
        "NEXA-PRO-999"
    ];

    if (serial && validSerials.includes(serial.trim())) {
        return res.status(200).json({ active: true, message: "License is active!" });
    } else {
        return res.status(200).json({ active: false, message: "Invalid serial key!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
