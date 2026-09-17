module.exports = (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({ status: "Server is running successfully!" });
    }

    if (req.method === 'POST') {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                body = {};
            }
        }
        
        const serial = body && body.serial ? body.serial : null;
        const validSerials = [
            "AHMED-VIP-2026",
            "NEXA-PRO-999"
        ];

        if (serial && validSerials.includes(serial.trim())) {
            return res.status(200).json({ active: true, message: "License is active!" });
        } else {
            return res.status(200).json({ active: false, message: "Invalid serial key!" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
