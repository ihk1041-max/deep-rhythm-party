# 深海リズムパーティ v3

スマホ/PWA向けのオリジナル短時間リズムゲームです。v2の3ゲーム構成とセーブデータを引き継ぎながら、ゲーム全体を「BGMに合わせて遊ぶ」方式へ拡張しています。

## v3の主な改善

- 3ステージすべてにオリジナルBGMを追加
  - ドラム
  - ベース
  - コード
  - メロディ
- `AudioContext.currentTime` を基準に、BGM・合図・入力判定を同じ時計で同期
- 曲中に INTRO / VERSE / CHORUS / FINAL などのセクションを追加
- 後半は裏拍・0.5拍・1.5拍などの変化パターンを追加
- カニクラップは「お手本→同じフレーズを返す」コール＆レスポンスを強化
- フグぷくぷくは合図間隔が途中で変化し、終盤は連続入力を追加
- BGM音量とタップ音・合図音量を個別設定
- Android等で利用可能な短い振動フィードバックを追加
- 推定Audio出力遅延を設定画面に表示
- 結果画面に平均タイミング誤差を追加
- v1/v2の設定・スコアをv3へ自動移行
- Service Workerキャッシュをv3へ更新

## 音楽実装

外部BGMファイルや既存作品の楽曲は使用していません。Web Audio APIのOscillator/Noiseを使って、オリジナルのリズムトラックをリアルタイムにスケジュールしています。

入力判定、BGM、合図音はすべて同じ `AudioContext.currentTime` を基準にします。

```text
AudioContext.currentTime
        |
        +-- BGM
        +-- cue
        +-- hit sound
        +-- input judge
        +-- visual beat pulse
```

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

既存のv2リポジトリへv3を上書きした後、以下を実行します。

```bash
npm install
npm run typecheck
npm run build
git add .
git commit -m "Update Deep Rhythm Party to v3"
git push origin main
```

`.github/workflows/deploy-pages.yml` により `main` へのpush後にGitHub Pagesへ自動デプロイされます。

## セーブデータ

v3の保存キーは `deep-rhythm-party:v3` です。

初回起動時にv3データがない場合は、次の順で既存データを移行します。

1. `deep-rhythm-party:v2`
2. `deep-rhythm-party:v1`

v2のマスター音量は、v3のBGM音量・SFX音量へ変換して引き継ぎます。

## リズム判定

- EASY: PERFECT ±72ms / GREAT ±132ms / GOOD ±195ms
- NORMAL: PERFECT ±48ms / GREAT ±92ms / GOOD ±145ms
- HARD: PERFECT ±32ms / GREAT ±68ms / GOOD ±108ms

端末差は設定画面のタイミング補正（-250ms〜+250ms）で調整できます。
