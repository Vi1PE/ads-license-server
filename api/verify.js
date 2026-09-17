module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            status: "Server is running successfully!"
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            active: false,
            message: 'Method not allowed'
        });
    }

    let body = req.body;

    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            body = {};
        }
    }

    const serial = body && body.serial
        ? String(body.serial).trim()
        : null;

    const validSerials = (process.env.VALID_SERIALS || '')
        .split(',')
        .map(key => key.trim())
        .filter(Boolean);

    if (serial && validSerials.includes(serial)) {
        return res.status(200).json({
            active: true,
            message: "License is active!"
        });
    }

    return res.status(200).json({
        active: false,
        message: "Invalid serial key!"
    });
};
