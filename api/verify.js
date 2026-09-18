module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            status: "License server is running successfully!"
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            active: false,
            message: 'Method not allowed'
        });
    }

    try {
        let body = req.body;

        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                body = {};
            }
        }

        const serial = body?.serial
            ? String(body.serial).trim()
            : null;

        const deviceId = body?.device_id
            ? String(body.device_id).trim()
            : null;

        if (!serial) {
            return res.status(400).json({
                active: false,
                message: 'License key is required.'
            });
        }

        const supabaseUrl = 'https://gixfqijvxamnfbyaxdns.supabase.co';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceKey) {
            return res.status(500).json({
                active: false,
                message: 'Server configuration error.'
            });
        }

        const headers = {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
        };

        // Find license
        const findUrl =
            `${supabaseUrl}/rest/v1/licenses` +
            `?select=*` +
            `&license_key=eq.${encodeURIComponent(serial)}` +
            `&limit=1`;

        const findResponse = await fetch(findUrl, {
            method: 'GET',
            headers
        });

        if (!findResponse.ok) {
            return res.status(500).json({
                active: false,
                message: 'Could not connect to license database.'
            });
        }

        const licenses = await findResponse.json();

        if (!Array.isArray(licenses) || licenses.length === 0) {
            return res.status(200).json({
                active: false,
                message: 'Invalid serial key!'
            });
        }

        const license = licenses[0];
        const now = new Date();

        // Disabled license
        if (license.is_active !== true) {
            return res.status(200).json({
                active: false,
                message: 'This license has been disabled.'
            });
        }

        // Not started yet
        if (license.starts_at) {
            const startsAt = new Date(license.starts_at);

            if (now < startsAt) {
                return res.status(200).json({
                    active: false,
                    message: 'This license has not started yet.'
                });
            }
        }

        // Expired license
        if (license.expires_at) {
            const expiresAt = new Date(license.expires_at);

            if (now >= expiresAt) {
                return res.status(200).json({
                    active: false,
                    message: 'This license has expired.'
                });
            }
        }

        // Update usage information
        const newUsageCount = Number(license.usage_count || 0) + 1;

        const updateData = {
            last_used_at: now.toISOString(),
            usage_count: newUsageCount
        };

        const updateUrl =
            `${supabaseUrl}/rest/v1/licenses?id=eq.${license.id}`;

        const updateResponse = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
                ...headers,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
            return res.status(500).json({
                active: false,
                message: 'Could not update license usage.'
            });
        }

        return res.status(200).json({
            active: true,
            message: 'License is active!',
            client_name: license.client_name || '',
            starts_at: license.starts_at,
            expires_at: license.expires_at,
            max_devices: license.max_devices,
            device_count: license.device_count,
            usage_count: newUsageCount
        });

    } catch (error) {
        console.error('License verification error:', error);

        return res.status(500).json({
            active: false,
            message: 'Internal server error.'
        });
    }
};
