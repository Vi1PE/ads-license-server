module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({ status: "Server is running successfully!" });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ active: false, message: 'Method not allowed' });
    }

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
};
