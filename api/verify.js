module.exports = async (req, res) => {
    // ========================================
    // CORS
    // ========================================

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS'
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
    );
    res.setHeader(
        'Access-Control-Max-Age',
        '86400'
    );

    // ========================================
    // PREFLIGHT
    // ========================================

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // ========================================
    // SERVER TEST
    // ========================================

    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'License server is running successfully!',
            endpoint: '/api/verify',
            methods: ['GET', 'POST']
        });
    }

    // ========================================
    // METHOD CHECK
    // ========================================

    if (req.method !== 'POST') {
        return res.status(405).json({
            active: false,
            message: 'Method not allowed'
        });
    }

    try {

        // ========================================
        // READ BODY
        // ========================================

        let body = req.body;

        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                body = {};
            }
        }

        if (!body || typeof body !== 'object') {
            body = {};
        }

        // ========================================
        // LICENSE KEY
        // ========================================

        const serial = body?.serial
            ? String(body.serial).trim()
            : null;

        // ========================================
        // DEVICE ID
        // ========================================

        const deviceId = body?.device_id
            ? String(body.device_id).trim()
            : null;

        // ========================================
        // REQUIRED DATA
        // ========================================

        if (!serial) {
            return res.status(400).json({
                active: false,
                message: 'License key is required.'
            });
        }

        if (!deviceId) {
            return res.status(400).json({
                active: false,
                message: 'Device ID is required.'
            });
        }

        // ========================================
        // SUPABASE
        // ========================================

        const supabaseUrl =
            'https://gixfqijvxamnfbyaxdns.supabase.co';

        const serviceKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceKey) {
            console.error(
                'SUPABASE_SERVICE_ROLE_KEY is missing.'
            );

            return res.status(500).json({
                active: false,
                message: 'Server configuration error.'
            });
        }

        const headers = {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
        };

        // ========================================
        // FIND LICENSE
        // ========================================

        const findUrl =
            `${supabaseUrl}/rest/v1/licenses` +
            `?select=*` +
            `&license_key=eq.${encodeURIComponent(serial)}` +
            `&limit=1`;

        const findResponse = await fetch(
            findUrl,
            {
                method: 'GET',
                headers
            }
        );

        if (!findResponse.ok) {

            const databaseError =
                await findResponse.text().catch(() => '');

            console.error(
                'License database error:',
                databaseError
            );

            return res.status(500).json({
                active: false,
                message:
                    'Could not connect to license database.'
            });
        }

        const licenses =
            await findResponse.json();

        // ========================================
        // LICENSE NOT FOUND
        // ========================================

        if (
            !Array.isArray(licenses) ||
            licenses.length === 0
        ) {
            return res.status(200).json({
                active: false,
                message: 'Invalid serial key!'
            });
        }

        const license = licenses[0];

        const now = new Date();

        // ========================================
        // CHECK ACTIVE
        // ========================================

        if (license.is_active !== true) {
            return res.status(200).json({
                active: false,
                message:
                    'This license has been disabled.'
            });
        }

        // ========================================
        // CHECK START DATE
        // ========================================

        if (license.starts_at) {

            const startsAt =
                new Date(license.starts_at);

            if (now < startsAt) {
                return res.status(200).json({
                    active: false,
                    message:
                        'This license has not started yet.'
                });
            }
        }

        // ========================================
        // CHECK EXPIRATION
        // ========================================

        if (license.expires_at) {

            const expiresAt =
                new Date(license.expires_at);

            if (now >= expiresAt) {
                return res.status(200).json({
                    active: false,
                    message:
                        'This license has expired.'
                });
            }
        }

        // ========================================
        // DEVICE MANAGEMENT
        // ========================================

        let deviceIds =
            Array.isArray(license.device_ids)
                ? license.device_ids
                : [];

        const maxDevices =
            Number(license.max_devices || 1);

        const existingDevice =
            deviceIds.includes(deviceId);

        // ========================================
        // REGISTER NEW DEVICE
        // ========================================

        if (!existingDevice) {

            if (deviceIds.length >= maxDevices) {

                return res.status(200).json({
                    active: false,
                    message:
                        'Maximum number of devices reached.',
                    max_devices: maxDevices,
                    device_count:
                        deviceIds.length
                });
            }

            deviceIds = [
                ...deviceIds,
                deviceId
            ];
        }

        const newDeviceCount =
            deviceIds.length;

        // ========================================
        // UPDATE USAGE
        // ========================================

        const newUsageCount =
            Number(license.usage_count || 0) + 1;

        const updateData = {
            device_ids: deviceIds,
            device_count: newDeviceCount,
            last_used_at: now.toISOString(),
            usage_count: newUsageCount
        };

        // ========================================
        // UPDATE LICENSE
        // ========================================

        const updateUrl =
            `${supabaseUrl}/rest/v1/licenses?id=eq.${license.id}`;

        const updateResponse =
            await fetch(
                updateUrl,
                {
                    method: 'PATCH',

                    headers: {
                        ...headers,
                        Prefer: 'return=minimal'
                    },

                    body:
                        JSON.stringify(updateData)
                }
            );

        if (!updateResponse.ok) {

            const updateError =
                await updateResponse.text()
                    .catch(() => '');

            console.error(
                'License update error:',
                updateError
            );

            return res.status(500).json({
                active: false,
                message:
                    'Could not update license information.'
            });
        }

        // ========================================
        // LICENSE ACTIVE
        // ========================================

        return res.status(200).json({

            active: true,

            message:
                'License is active!',

            client_name:
                license.client_name || '',

            starts_at:
                license.starts_at,

            expires_at:
                license.expires_at,

            max_devices:
                maxDevices,

            device_count:
                newDeviceCount,

            usage_count:
                newUsageCount
        });

    } catch (error) {

        console.error(
            'License verification error:',
            error
        );

        return res.status(500).json({
            active: false,
            message:
                'Internal server error.'
        });
    }
};
