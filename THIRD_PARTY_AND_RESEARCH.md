# Design research and third-party references — v9

v9 studies the *mechanical grammar* of classic Rhythm Heaven / Rhythm Tengoku games while keeping this project's audiovisual content original.

## Gameplay references studied

- Hole in One — short cue / long cue leading to a one-button swing. Reference: https://rhythmheaven.fandom.com/wiki/Hole_in_One
- Screwbot Factory — grab, hold for different beat lengths, release. Reference: https://rhythmheaven.fandom.com/wiki/Screwbot_Factory
- Tambourine — copy a demonstrated two-action rhythm phrase. Reference: https://rhythmheaven.fandom.com/wiki/Tambourine
- Board Meeting — synchronize the final stop after the other members. Reference video: https://www.youtube.com/watch?v=QPXghoiKmu8
- Fork Lifter — constant travel time with changing spacing. Reference: https://rhwiki.net/wiki/Fork_Lifter
- Air Rally — normal one-beat return plus a slower special return; visuals later become misleading. Reference: https://rhythmheaven.fandom.com/wiki/Air_Rally
- Double Date — different ball types imply different arrival patterns. Reference: https://rhythmheaven.fandom.com/wiki/Double_Date
- Monkey Watch — keep a steady beat without explicit cues; special offbeat pair; zoom/obstruction encourages listening. Reference: https://rhythmheaven.fandom.com/wiki/Monkey_Watch
- Glee Club — match start/stop timing with the other singers. Reference: https://rhythmheaven.fandom.com/wiki/Glee_Club
- Karate Man — strike objects on the beat with denser combo sections. Reference: https://rhythmheaven.fandom.com/wiki/Karate_Man_Returns!
- Ringside — verbal cue selects one of multiple response patterns. Reference: https://rhythmheaven.fandom.com/wiki/Ringside
- Samurai Slice — single attacks plus a held group attack, with visual obstruction later. Reference: https://rhythmheaven.fandom.com/wiki/Samurai_Slice_%28Wii%29

The project does not copy the original stage art, characters, music, voice lines, exact dialogue, UI, logos, or source code. Stage names and visual settings are original.

## Open-source design/code research

- Rhythm Land — MIT licensed, self-described as Rhythm Heaven-esque: https://github.com/sinusoid-studios/rhythm-land
- Heaven Studio — event/remix architecture research only: https://github.com/RHeavenStudio/HeavenStudio

No Nintendo-origin asset from fan projects is copied into this repository.

## Optional CC0 music

The fetch script can download these OpenGameArt CC0 tracks:

- PM Rhythm — 120 BPM — https://opengameart.org/content/pm-rhythm
- Racing Game Title — 140 BPM — https://opengameart.org/content/racing-game-title
- Amusement Park Stage — 150 BPM — https://opengameart.org/content/amusement-park-stage

Run:

```bash
npm run fetch:music
npm run build
```

If a file is unavailable, the game automatically falls back to synchronized Web Audio music.
