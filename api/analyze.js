// Vercel Serverless Function to handle Gemini AI Analysis
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text, fileData, fileType, lang } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || ""; 

    const systemPrompt = `You are a professional financial advisor. Analyze the provided data and return a JSON response in the following language: ${lang}. 
    The response must follow this EXACT JSON structure:
    {
      "title": "Report Title",
      "summary": "Short executive summary",
      "metrics": [{"label": "Metric Name", "value": "Amount/Value"}],
      "chart_data": {"labels": ["Category A", "Category B"], "values": [60, 40]},
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    }`;

    try {
        const contents = [];
        const userParts = [{ text: text || "Analyze this financial data" }];

        if (fileData) {
            if (fileType === 'image') {
                userParts.push({ inlineData: { mimeType: "image/png", data: fileData } });
            } else if (fileType === 'pdf') {
                userParts[0].text += "\n\nExtracted PDF Text: " + fileData;
            }
        }

        contents.push({ role: "user", parts: userParts });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents,
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const result = await response.json();
        const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!analysisText) throw new Error("No response from AI");

        res.status(200).json(JSON.parse(analysisText));
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Failed to analyze data" });
    }
}