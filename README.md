# SNSアイコンメーカー Pro

Gemini / GPT-Image-2 でアイコン画像を生成するWebアプリ。

## 使い方

1. アプリにアクセス（Vercelデプロイ済URL）
2. ヘッダーの「Gemini」または「GPT-Image-2」を選択
3. 「その他」タブを開いて、使うサービスのAPIキーを入力
   - **Gemini**: https://aistudio.google.com/app/apikey で取得（無料枠あり）
   - **OpenAI**: https://platform.openai.com/api-keys で取得（有料）
4. 各タブで好みの設定を選んで「画像を生成」

## セキュリティ

- **APIキーはユーザー各自のブラウザのみに保存**（localStorage）
- サーバー側にはキーを保存しない（Vercelプロキシは中継のみ）
- HTTPSで暗号化通信
- プロキシは各リクエストごとにヘッダー `X-Api-Key` で受け取り、即座にOpenAI/Geminiへ転送

## アーキテクチャ

```
ブラウザ (APIキー保管)
  ↓ HTTPS + X-Api-Keyヘッダー
Vercel Proxy (api/*)
  ↓ HTTPS
Gemini API / OpenAI API
```

OpenAI APIはCORSによりブラウザ直接呼び出し不可のため、プロキシ経由が必須。

## ローカル開発

```bash
vercel dev
```
