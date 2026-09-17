module.exports = async (req, res) => {
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
        try {
            // قراءة الـ Body بأمان تام سواء وصل كـ Object جاهز أو String
            let body = req.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            }
            
            // لو الـ body لسه فاضي، نقرأه من الـ stream مباشرة
            if (!body || Object.keys(body).length === 0) {
                const buffers = [];
                for await (const chunk of req) {
                    buffers.push(chunk);
                }
                const rawData = Buffer.concat(buffers).toString();
                if (rawData) {
                    body = JSON.parse(rawData);
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
                return res.status(200).json({ active: false, message: "Invalid or expired serial key!" });
            }
        } catch (error) {
            return res.status(400).json({ active: false, message: "Invalid request payload!" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
