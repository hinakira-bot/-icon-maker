# SNSアイコンメーカー Pro

Gemini / GPT-Image-2 でアイコン画像を生成するツール。

## Vercel 環境変数の設定

Vercel ダッシュボード → Project Settings → Environment Variables で以下を設定：

| 変数名 | 用途 | 取得元 |
| --- | --- | --- |
| `GEMINI_API_KEY` | Gemini 画像生成 | https://aistudio.google.com/app/apikey |
| `OPENAI_API_KEY` | GPT-Image-2 画像生成 | https://platform.openai.com/api-keys |

設定後に **Redeploy** すると反映される。

## セキュリティ

- APIキーはサーバー側（Vercel環境変数）にのみ保存。ブラウザには一切送信・保存されない
- クライアント → `/api/gemini-image` または `/api/openai-image` → 各サービス、というプロキシ構成

## ローカル開発

```bash
vercel dev
```

ローカルでは `.env.local` に `GEMINI_API_KEY` と `OPENAI_API_KEY` を書く。
