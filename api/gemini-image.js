export const config = {
  api: {
    bodyParser: { sizeLimit: '20mb' },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'APIキーが必要です' });

  const { prompt, referenceImage } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  const parts = [];
  if (referenceImage) {
    const matches = referenceImage.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (matches) {
      parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
    }
  }
  parts.push({ text: prompt });

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
          safetySettings: [
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || `Gemini API error: ${response.status}` });
    }

    const cand = data.candidates?.[0];
    if (!cand) {
      const br = data.promptFeedback?.blockReason;
      return res.status(400).json({ error: br ? `ブロックされました: ${br}` : 'レスポンスが空です' });
    }
    if (cand.finishReason === 'SAFETY' || cand.finishReason === 'IMAGE_SAFETY') {
      return res.status(400).json({ error: '安全フィルターによりブロックされました' });
    }

    const imgPart = (cand.content?.parts || []).find(p => p.inlineData);
    if (!imgPart) {
      const txt = (cand.content?.parts || []).find(p => p.text);
      return res.status(500).json({ error: `画像が生成されませんでした${txt ? '\nAI: ' + txt.text.slice(0, 150) : ''}` });
    }

    return res.status(200).json({
      image: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`,
      mimeType: imgPart.inlineData.mimeType,
      data: imgPart.inlineData.data,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
