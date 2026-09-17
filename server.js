const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

//قاعدة بيانات مؤقتة للمفاتيح (تقدر تعدلها أو تضيف مفاتيح براحتك)
const validKeys = {
    "VIP-AHMED-2026": { active: true, expires: "2026-12-31" },
    "TEST-KEY-123": { active: true, expires: "2026-10-01" }
};

app.post('/api/verify', (req, res) => {
    const { key } = req.body;
    
    if (validKeys[key] && validKeys[key].active) {
        return res.json({ valid: true, message: "Key is active" });
    } else {
        return res.json({ valid: false, message: "Invalid or expired key" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});