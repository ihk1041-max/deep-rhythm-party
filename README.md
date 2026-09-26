# 深海リズムパーティ v1

スマホ/PWA向けのオリジナル短時間リズムゲームのMVPです。

## v1で実装済み

- タイトル画面
- 「メンダコポン」1ステージ
- `AudioContext.currentTime` を基準にしたリズム判定
- PERFECT / GREAT / GOOD / MISS
- EASY / NORMAL / HARD
- 入力タイミング補正（-200ms〜+200ms）
- 音量設定
- ハイスコア / ベストコンボ保存（LocalStorage）
- PWA manifest + Service Worker + オフラインキャッシュ
- PCのSpaceキー対応
- GitHub Pages用Actionsワークフロー

## 開発環境

Node.js 22系を推奨します。

```bash
npm install
npm run dev
```

`http://localhost:4173` を開いてください。

### ビルド

```bash
npm run build
```

成果物は `dist/` に生成されます。

## GitHub Pages

`.github/workflows/deploy-pages.yml` を含めています。
GitHubリポジトリの **Settings > Pages > Build and deployment > Source** を `GitHub Actions` に設定してください。
`main` ブランチへpushすると `dist/` がPagesへデプロイされます。

## タイミング補正

設定の補正値がプラスの場合、実際の入力時刻をその値だけ「早い側」へ補正します。
例えば端末や操作感の都合で平均40ms遅れてタップする場合は `+40ms` を目安にしてください。

## 設計上の方針

音声・判定ロジックは描画から分離しています。v2以降でPhaserを導入する場合も、`src/audio.ts` と `src/rhythm.ts` を基盤として再利用できる構成です。
