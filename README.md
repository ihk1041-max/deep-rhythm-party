# 深海リズムパーティ v2

スマホ/PWA向けのオリジナル短時間リズムゲームです。v1のリズム判定基盤を維持しながら、3ゲーム構成とステージ選択、演出、進行保存を追加しています。

## v2の主な追加内容

- 3つのミニゲーム
  - STAGE 01: メンダコポン（一定拍）
  - STAGE 02: カニクラップ（3拍のコール＆レスポンス）
  - STAGE 03: フグぷくぷく（「ぷく・ぷく・パン！」型）
- ステージ選択画面
- 前ステージを1回遊ぶと次ステージが解放される進行
- ゲーム別ハイスコア / ベストコンボ / ★保存
- 成功時パーティクル、失敗時画面シェイク、キャラクター表情変化
- ゲームごとに異なるWeb Audio合成SE
- EASY / NORMAL / HARD
- 入力タイミング補正（-200ms〜+200ms）
- v1 LocalStorageから設定・メンダコポン記録を自動移行
- PWA manifest + Service Worker + オフラインキャッシュ
- GitHub Pages用Actionsワークフロー

## 開発環境

Node.js 22系を推奨します。

```bash
npm install
npm run typecheck
npm run dev
```

`http://localhost:4173` を開いてください。

### ビルド

```bash
npm run build
```

成果物は `dist/` に生成されます。

## GitHub Pagesへの更新

既存のv1リポジトリへこのv2を上書きした後、以下を実行します。

```bash
npm install
npm run typecheck
npm run build
git add .
git commit -m "Update Deep Rhythm Party to v2"
git push origin main
```

`.github/workflows/deploy-pages.yml` により `main` へのpush後にGitHub Pagesへ自動デプロイされます。

## セーブデータ

v2の保存キーは `deep-rhythm-party:v2` です。初回起動時にv2データが存在せず、v1の `deep-rhythm-party:v1` が存在する場合は、設定・メンダコポンのハイスコア・ベストコンボ・プレイ回数を移行します。

## リズム判定

時刻基準は `AudioContext.currentTime` です。描画フレームや `setInterval` を判定のマスタークロックには使用していません。

- EASY: PERFECT ±70ms / GREAT ±130ms / GOOD ±190ms
- NORMAL: PERFECT ±45ms / GREAT ±90ms / GOOD ±140ms
- HARD: PERFECT ±30ms / GREAT ±65ms / GOOD ±105ms
