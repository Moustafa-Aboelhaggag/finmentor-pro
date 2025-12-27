// Vercel Serverless Function to securely handle Gemini API calls
export default async function handler(req, res) {
    // التحقق من أن الطلب هو POST فقط
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key is not configured on the server' });
    }

    try {
        const { contents, systemInstruction, generationConfig } = req.body;

        // استدعاء Google Gemini API من السيرفر
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                systemInstruction,
                generationConfig
            })
        });

        const data = await response.json();

        // إرسال النتيجة إلى الواجهة الأمامية
        return res.status(200).json(data);
    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}