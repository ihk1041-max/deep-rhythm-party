# 深海リズムパーティ v4

スマホ/PWA向けのオリジナル短時間リズムゲームです。v3のAudioContext同期エンジンを維持しつつ、初回練習、拍同期の掛け声、曲展開強化、4曲目「深海リミックス」を追加しています。

## v4の主な改善

- 初回プレイ時に短い「れんしゅう」→そのまま本番へ移行
- 設定で初回練習をON/OFF可能
- `Hey! / Go! / Yeah!` のオリジナル生成ボイスサンプルをAudioContextで拍同期再生
- 3曲のターゲット数・終盤フレーズを増加
- 4曲目「深海リミックス」を追加
  - メンダコ / カニ / フグのリズムを曲中で切り替え
  - 128 BPM / 72 beat
- リミックス専用BGM、背景、判定音、キャラクター切替演出
- v1〜v3の保存データをv4へ自動移行
- Service Workerに音声サンプルを含め、オフラインPWAを維持

## 開発

Node.js 22系推奨。

```bash
npm install
npm run typecheck
npm run dev
```

`http://localhost:4173` を開きます。

## GitHub Pages更新

```bash
npm install
npm run typecheck
npm run build
git add .
git commit -m "Update Deep Rhythm Party to v4"
git push origin main
```

## セーブデータ

v4保存キー: `deep-rhythm-party:v4`

既存v3/v2/v1がある場合は初回起動時に自動移行します。

## リズム判定

- EASY: PERFECT ±72ms / GREAT ±132ms / GOOD ±195ms
- NORMAL: PERFECT ±48ms / GREAT ±92ms / GOOD ±145ms
- HARD: PERFECT ±32ms / GREAT ±68ms / GOOD ±108ms

端末差は設定画面のタイミング補正（-250ms〜+250ms）で調整できます。


## v4.0.1 hotfix

- 未解放ステージをタップした際に解放条件を表示
- PWA更新時に旧JavaScriptが混在しないよう、バージョン別アセットパスを採用
- script/styleはオンライン時network-first、オフライン時cache fallback
