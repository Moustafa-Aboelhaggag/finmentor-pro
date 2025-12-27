// هذا الملف يجب أن يوضع في مجلد api/ داخل مشروعك
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // استخدام مفتاح البيئة من Vercel أو البيئة المحلية
  const apiKey = process.env.GEMINI_API_KEY || ""; 
  
  try {
    const { text, fileData, fileType } = req.body;

    const systemPrompt = `أنت مستشار مالي خبير. حلل البيانات المالية وقدم تقرير JSON فقط بهذا الهيكل:
    {"title":"..","summary":"..","metrics":[{"label":"..","value":".."}],"chart":{"labels":[".."],"values":[0]}}`;

    let promptParts = [{ text: text || "حلل البيانات المالية المرفقة." }];
    
    if (fileType === 'image') {
      promptParts.push({ inlineData: { mimeType: "image/png", data: fileData } });
    } else if (fileType === 'pdf') {
      promptParts[0].text += "\n\nبيانات النص من ملف PDF:\n" + fileData;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: promptParts }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const result = await response.json();
    
    if (result.error) {
        throw new Error(result.error.message);
    }

    const analysisData = JSON.parse(result.candidates[0].content.parts[0].text);
    res.status(200).json(analysisData);

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "فشل في معالجة البيانات المالية" });
  }
}