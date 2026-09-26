import type { GameDefinition, GameId } from './types.js';

export const GAME_ORDER: readonly GameId[] = ['mendako-pop', 'crab-clap', 'fugu-puku'];

export const GAMES: Record<GameId, GameDefinition> = {
  'mendako-pop': {
    id: 'mendako-pop',
    stage: 1,
    title: 'メンダコポン',
    shortDescription: '曲のノリに合わせて、ポン！',
    instruction: '音楽の拍を感じて、輪が重なる瞬間にタップ',
    bpm: 124,
    endBeat: 52,
    targets: [
      8, 10, 12, 14,
      20, 21, 22, 24, 26,
      32, 33.5, 35, 36, 38,
      44, 45, 46, 47.5, 48, 50
    ],
    cueBeats: [7, 11, 19, 23, 31, 35, 43, 47],
    sections: [
      { startBeat: 0, label: 'COUNT IN' },
      { startBeat: 4, label: 'INTRO' },
      { startBeat: 8, label: 'VERSE' },
      { startBeat: 20, label: 'GROOVE UP' },
      { startBeat: 32, label: 'CHORUS' },
      { startBeat: 44, label: 'FINAL' }
    ],
    character: 'mendako',
    accent: 'pink'
  },
  'crab-clap': {
    id: 'crab-clap',
    stage: 2,
    title: 'カニクラップ',
    shortDescription: 'お手本フレーズを、そのまま返そう！',
    instruction: '「おてほん」のあと、同じリズムをクラップ',
    bpm: 116,
    endBeat: 54,
    targets: [
      12, 13, 14,
      24, 25, 26.5,
      36, 37.5, 38,
      48, 49, 49.5, 50.5
    ],
    cueBeats: [
      8, 9, 10,
      20, 21, 22.5,
      32, 33.5, 34,
      44, 45, 45.5, 46.5
    ],
    sections: [
      { startBeat: 0, label: 'COUNT IN' },
      { startBeat: 4, label: 'INTRO' },
      { startBeat: 8, label: 'CALL 1' },
      { startBeat: 20, label: 'CALL 2' },
      { startBeat: 32, label: 'CALL 3' },
      { startBeat: 44, label: 'FINAL CALL' }
    ],
    character: 'crab',
    accent: 'coral'
  },
  'fugu-puku': {
    id: 'fugu-puku',
    stage: 3,
    title: 'フグぷくぷく',
    shortDescription: '「ぷく・ぷく」の続きを音楽で決めよう！',
    instruction: '2つの合図を聞いて、次の「パン！」でタップ',
    bpm: 104,
    endBeat: 54,
    targets: [10, 16, 23, 29, 35.5, 41, 47.5, 48.5, 51, 52],
    cueBeats: [
      8, 9,
      14, 15,
      20, 21.5,
      26, 27,
      32, 33.5,
      38, 39,
      44, 45.5,
      49, 50
    ],
    sections: [
      { startBeat: 0, label: 'COUNT IN' },
      { startBeat: 4, label: 'INTRO' },
      { startBeat: 8, label: 'PUKU 1' },
      { startBeat: 20, label: 'BOUNCE' },
      { startBeat: 32, label: 'CHORUS' },
      { startBeat: 44, label: 'FINAL' }
    ],
    character: 'fugu',
    accent: 'lime'
  }
};

export const getGameDefinition = (gameId: GameId): GameDefinition => GAMES[gameId];

export const getSectionLabel = (definition: GameDefinition, beat: number): string => {
  let label = definition.sections[0]?.label ?? '';
  for (const section of definition.sections) {
    if (beat >= section.startBeat) label = section.label;
    else break;
  }
  return label;
};
