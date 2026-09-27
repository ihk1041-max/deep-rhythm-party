import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const tracks = [
  {
    file: 'pm_rhythm.ogg',
    url: 'https://opengameart.org/sites/default/files/pm_rhythm.ogg',
    source: 'https://opengameart.org/content/pm-rhythm',
    license: 'CC0',
    bpm: 120
  },
  {
    file: 'racing_game_title_bpm140.ogg',
    url: 'https://opengameart.org/sites/default/files/racing_game_title_bpm140.ogg',
    source: 'https://opengameart.org/content/racing-game-title',
    license: 'CC0',
    bpm: 140
  },
  {
    file: 'amusement_park_stage_bpm150.ogg',
    url: 'https://opengameart.org/sites/default/files/amusement_park_stage_bpm150.ogg',
    source: 'https://opengameart.org/content/amusement-park-stage',
    license: 'CC0',
    bpm: 150
  }
];

const outDir = resolve('public/music');
await mkdir(outDir, { recursive: true });

for (const track of tracks) {
  process.stdout.write(`Downloading ${track.file} (${track.bpm} BPM, ${track.license})... `);
  try {
    const response = await fetch(track.url, { redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < 10_000) throw new Error(`Unexpectedly small file: ${bytes.byteLength} bytes`);
    await writeFile(resolve(outDir, track.file), bytes);
    console.log(`${Math.round(bytes.byteLength / 1024)} KiB`);
  } catch (error) {
    console.error(`FAILED (${error instanceof Error ? error.message : String(error)})`);
    console.error(`  Manual source: ${track.source}`);
  }
}

console.log('\nDone. Run npm run build after successful downloads.');
