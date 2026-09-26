import type { GameDefinition, GameId } from './types.js';

export const GAME_ORDER: readonly GameId[] = ['mendako-pop', 'crab-clap', 'fugu-puku'];

export const GAMES: Record<GameId, GameDefinition> = {
  'mendako-pop': {
    id: 'mendako-pop',
    stage: 1,
    title: 'メンダコポン',
    shortDescription: '輪が重なる瞬間にポン！',
    instruction: '黄色い輪が重なる瞬間にタップ',
    bpm: 120,
    endBeat: 20,
    targets: [4, 6, 8, 10, 12, 14, 16, 18],
    cueBeats: [5, 7, 9, 11, 13, 15, 17],
    character: 'mendako',
    accent: 'pink'
  },
  'crab-clap': {
    id: 'crab-clap',
    stage: 2,
    title: 'カニクラップ',
    shortDescription: 'カニのお手本をまねしてクラップ！',
    instruction: 'お手本のあと、同じ3拍をタップ',
    bpm: 112,
    endBeat: 20,
    targets: [8, 9, 10, 16, 17, 18],
    cueBeats: [4, 5, 6, 12, 13, 14],
    character: 'crab',
    accent: 'coral'
  },
  'fugu-puku': {
    id: 'fugu-puku',
    stage: 3,
    title: 'フグぷくぷく',
    shortDescription: 'ぷく・ぷく・パン！でふくらもう',
    instruction: '「ぷく・ぷく」の次の拍でタップ',
    bpm: 96,
    endBeat: 20,
    targets: [6, 9, 12, 15, 18],
    cueBeats: [4, 5, 7, 8, 10, 11, 13, 14, 16, 17],
    character: 'fugu',
    accent: 'lime'
  }
};

export const getGameDefinition = (gameId: GameId): GameDefinition => GAMES[gameId];

export const getNextGameId = (gameId: GameId): GameId | null => {
  const index = GAME_ORDER.indexOf(gameId);
  return index >= 0 && index < GAME_ORDER.length - 1 ? GAME_ORDER[index + 1] ?? null : null;
};
