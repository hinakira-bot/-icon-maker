export const config = {
  api: {
    bodyParser: { sizeLimit: '20mb' },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY が Vercel 環境変数に設定されていません' });
  }

  const { model, prompt, size, quality, mode, referenceImage } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    let response;

    if (mode === 'edit' && referenceImage) {
      const matches = referenceImage.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ error: 'Invalid reference image format' });
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const ext = mimeType.split('/')[1] || 'png';

      const form = new FormData();
      form.append('model', model || 'gpt-image-2');
      form.append('prompt', prompt);
      form.append('size', size || '1024x1024');
      if (quality) form.append('quality', quality);
      form.append('n', '1');
      const blob = new Blob([buffer], { type: mimeType });
      form.append('image', blob, `reference.${ext}`);

      response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
    } else {
      response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-image-2',
          prompt,
          size: size || '1024x1024',
          quality: quality || 'high',
          n: 1,
        }),
      });
    }

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || `OpenAI API error: ${response.status}` });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: '画像が返されませんでした' });

    return res.status(200).json({ image: `data:image/png;base64,${b64}`, mimeType: 'image/png', data: b64 });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
