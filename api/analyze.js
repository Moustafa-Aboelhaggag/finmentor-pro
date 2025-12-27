// هذا الملف يجب أن يكون في المسار /api/analyze.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { prompt, fileData, pdfText, lang } = req.body;
  
  // مفتاح الـ API يتم جلبه من إعدادات Vercel (Environment Variables)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const systemPrompt = `You are an expert financial consultant. 
  Provide a detailed analysis in JSON format only. 
  Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
  JSON structure: { "title": string, "summary": string, "metrics": [{label, value}], "chart": {labels: [], values: []}, "recommendations": [] }`;

  const payload = {
    contents: [{
      parts: [
        { text: `${prompt} \n Document Context: ${pdfText || ''}` },
        ...(fileData ? [{ inlineData: { mimeType: "image/png", data: fileData } }] : [])
      ]
    }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { responseMimeType: "application/json" }
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(resultText));
  } catch (error) {
    res.status(500).json({ error: "AI Analysis Failed" });
  }
}