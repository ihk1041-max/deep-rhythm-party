import { readFileSync } from 'node:fs';
import { GAME_ORDER, GAMES } from '../dist/assets/v9/games.js';
import { RhythmGame } from '../dist/assets/v9/rhythm.js';

const errors = [];
const css = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
if (!/\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/i.test(css)) errors.push('UI: missing forced [hidden] visibility rule');
if (!html.includes('id="settings-panel"') || !html.includes('id="title-panel"')) errors.push('UI: required panels missing');
for (const id of GAME_ORDER) {
  const game = GAMES[id];
  const targetBeats = game.targets.map((target) => target.beat);
  const cueBeats = game.cues.map((cue) => cue.beat);

  for (let index = 1; index < targetBeats.length; index += 1) {
    if (targetBeats[index] < targetBeats[index - 1]) errors.push(`${id}: targets are not sorted`);
  }
  for (let index = 1; index < cueBeats.length; index += 1) {
    if (cueBeats[index] < cueBeats[index - 1]) errors.push(`${id}: cues are not sorted`);
  }
  if (targetBeats.some((beat) => beat >= game.endBeat)) errors.push(`${id}: target outside endBeat`);
  if (cueBeats.some((beat) => beat >= game.endBeat)) errors.push(`${id}: cue outside endBeat`);

  const groups = new Map();
  for (const target of game.targets) {
    if (!target.group) continue;
    groups.set(target.group, [...(groups.get(target.group) ?? []), target.action]);
  }
  for (const [group, actions] of groups) {
    if (!actions.includes('press') || !actions.includes('release')) errors.push(`${id}: incomplete hold group ${group}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

for (const id of GAME_ORDER) {
  const definition = GAMES[id];
  let now = 0;
  let result = null;
  const audio = {
    now: () => now,
    stopAll() {},
    scheduleCount() {},
    scheduleSong() {},
    scheduleCue() {},
    scheduleVoice() {},
    playInput() {}
  };
  const game = new RhythmGame({
    audio,
    definition,
    difficulty: 'normal',
    audioOffsetMs: 0,
    externalMusic: false,
    onHud() {},
    onJudge() {},
    onFinish(value) { result = value; }
  });
  game.start();
  const secondsPerBeat = 60 / definition.bpm;
  const startTime = 0.7;
  for (const target of definition.targets) {
    now = startTime + target.beat * secondsPerBeat;
    game.update();
    game.input(target.action);
  }
  now = startTime + definition.endBeat * secondsPerBeat;
  game.update();
  if (!result || result.score !== 100 || result.counts.MISS !== 0) {
    console.error(`${id}: perfect-play simulation failed`, result);
    process.exit(1);
  }
}

console.log(`Validated ${GAME_ORDER.length} stages and perfect-play simulation.`);
