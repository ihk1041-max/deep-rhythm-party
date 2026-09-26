import type { GameDefinition, GameId } from './types.js';

export const GAME_ORDER: readonly GameId[] = [
  'mendako-pop', 'crab-clap', 'fugu-puku', 'robot-stamp', 'cat-dj', 'ninja-mochi', 'deep-remix'
];

export const GAMES: Record<GameId, GameDefinition> = {
  'mendako-pop': {
    id:'mendako-pop', stage:1, title:'メンダコポン', shortDescription:'曲のノリに合わせて、ポン！',
    instruction:'ドラムとメロディを聴いて、輪が重なる瞬間にタップ', bpm:124, endBeat:60,
    targets:[8,10,12,14,20,21,22,24,26,28,32,33.5,35,36,38,40,44,45,46,47.5,48,50,52,53,54,55.5,56,58],
    cueBeats:[7,11,19,23,27,31,35,39,43,47,51,55],
    sections:[{startBeat:0,label:'COUNT IN'},{startBeat:4,label:'INTRO'},{startBeat:8,label:'VERSE'},{startBeat:20,label:'GROOVE UP'},{startBeat:32,label:'CHORUS'},{startBeat:44,label:'FINAL'}],
    voiceCues:[{beat:7,sample:'hey'},{beat:31,sample:'go'},{beat:56,sample:'yeah',gain:.8}], practiceTargets:[6,8,10,12], practiceCueBeats:[5,7,9,11], character:'mendako', accent:'pink'
  },
  'crab-clap': {
    id:'crab-clap', stage:2, title:'カニクラップ', shortDescription:'お手本フレーズを、そのまま返そう！', instruction:'おてほんを聴いて、そのリズムをそのままクラップ', bpm:116, endBeat:60,
    targets:[12,13,14,24,25,26.5,36,37.5,38,48,49,49.5,50.5,54,54.5,55.5,57], cueBeats:[8,9,10,20,21,22.5,32,33.5,34,44,45,45.5,46.5,52,52.5,53.5],
    sections:[{startBeat:0,label:'COUNT IN'},{startBeat:4,label:'INTRO'},{startBeat:8,label:'CALL 1'},{startBeat:20,label:'CALL 2'},{startBeat:32,label:'CALL 3'},{startBeat:44,label:'FINAL CALL'}],
    voiceCues:[{beat:7,sample:'hey'},{beat:23,sample:'go'},{beat:47,sample:'go'},{beat:57,sample:'yeah'}], practiceTargets:[8,9,10], practiceCueBeats:[4,5,6], character:'crab', accent:'coral'
  },
  'fugu-puku': {
    id:'fugu-puku', stage:3, title:'フグぷくぷく', shortDescription:'「ぷく・ぷく」の続きを音楽で決めよう！', instruction:'2つの合図を聴いて、次の「パン！」を音楽の中で決める', bpm:104, endBeat:60,
    targets:[10,16,23,29,35.5,41,47.5,48.5,51,52,54.5,56,57.5], cueBeats:[8,9,14,15,20,21.5,26,27,32,33.5,38,39,44,45.5,49,50,53,53.5,55,55.5],
    sections:[{startBeat:0,label:'COUNT IN'},{startBeat:4,label:'INTRO'},{startBeat:8,label:'PUKU 1'},{startBeat:20,label:'BOUNCE'},{startBeat:32,label:'CHORUS'},{startBeat:44,label:'FINAL'}],
    voiceCues:[{beat:9,sample:'hey'},{beat:34,sample:'go'},{beat:57.5,sample:'yeah'}], practiceTargets:[10,14,18], practiceCueBeats:[8,9,12,13,16,17], character:'fugu', accent:'lime'
  },
  'robot-stamp': {
    id:'robot-stamp', stage:4, title:'ロボスタンプ工場', shortDescription:'流れてくる部品を、ビートでガチャン！', instruction:'「ピッ・ピッ」の予告を聞いて、次の拍でスタンプ', bpm:132, endBeat:64,
    targets:[10,14,18,22,26,27,30,34,38,39.5,42,46,47,48,50,54,55.5,57,58,60,61], cueBeats:[8,12,16,20,24,25,28,32,36,37.5,40,44,45,46,52,53.5,56,59],
    sections:[{startBeat:0,label:'BOOT'},{startBeat:4,label:'LINE START'},{startBeat:16,label:'DOUBLE'},{startBeat:32,label:'OVERDRIVE'},{startBeat:48,label:'FINAL SHIFT'}],
    voiceCues:[{beat:7,sample:'go'},{beat:31,sample:'hey'},{beat:48,sample:'go'},{beat:61,sample:'yeah'}], practiceTargets:[8,12,16], practiceCueBeats:[6,10,14], character:'robot', accent:'gold'
  },
  'cat-dj': {
    id:'cat-dj', stage:5, title:'ネコDJ', shortDescription:'DJネコのスクラッチを、そっくり返そう！', instruction:'短いフレーズを聴いて、同じ間隔で返すコール＆レスポンス', bpm:118, endBeat:64,
    targets:[12,13.5,15,24,25,25.5,27,36,37,38.5,40,48,49.5,50,51.5,56,57,57.5,59,60.5,62], cueBeats:[8,9.5,11,20,21,21.5,23,32,33,34.5,36,44,45.5,46,47.5,52,53,53.5,55,56.5,58],
    sections:[{startBeat:0,label:'COUNT IN'},{startBeat:4,label:'DJ INTRO'},{startBeat:8,label:'COPY 1'},{startBeat:20,label:'COPY 2'},{startBeat:32,label:'BREAK'},{startBeat:44,label:'DROP'},{startBeat:56,label:'FINAL CUT'}],
    voiceCues:[{beat:7,sample:'hey'},{beat:23,sample:'go'},{beat:43,sample:'hey'},{beat:55,sample:'go'},{beat:62,sample:'yeah'}], practiceTargets:[8,9.5,11], practiceCueBeats:[4,5.5,7], character:'cat', accent:'violet'
  },
  'ninja-mochi': {
    id:'ninja-mochi', stage:6, title:'忍者もちつき', shortDescription:'構えて、待って……ドン！', instruction:'早押ししない。掛け声の「間」を覚えて一撃で決める', bpm:126, endBeat:64,
    targets:[10,18,26,34,42,46,50.5,54,56,58.5,60,61,62], cueBeats:[8,16,24,32,40,44,48.5,52,54,56.5,58,59,60],
    sections:[{startBeat:0,label:'COUNT IN'},{startBeat:4,label:'DOJO'},{startBeat:16,label:'WAIT...'},{startBeat:32,label:'FAKE OUT'},{startBeat:44,label:'SPEED UP'},{startBeat:56,label:'FINAL RUSH'}],
    voiceCues:[{beat:7,sample:'hey'},{beat:25,sample:'go'},{beat:41,sample:'hey'},{beat:55,sample:'go'},{beat:62,sample:'yeah'}], practiceTargets:[10,18], practiceCueBeats:[8,16], character:'ninja', accent:'mint'
  },
  'deep-remix': {
    id:'deep-remix', stage:7, title:'ごちゃまぜリミックス', shortDescription:'6つの遊びが1曲の中で高速チェンジ！', instruction:'見た目より音を信じて、ルールを瞬時に切り替えよう', bpm:132, endBeat:80,
    targets:[8,10,12,14,20,21,22.5,24,30,36,37.5,38,44,46,48,50,56,57.5,59,60.5,64,66,68,69,72,73.5,75,76,77,78.5], cueBeats:[7,11,19,20,21.5,28,29,34,35.5,42,44,46,54,55.5,58,62,65,67,71,74],
    sections:[{startBeat:0,label:'COUNT IN'},{startBeat:4,label:'SEA'},{startBeat:20,label:'FACTORY'},{startBeat:36,label:'DJ'},{startBeat:52,label:'DOJO'},{startBeat:64,label:'ALL IN'},{startBeat:72,label:'FINAL MIX'}],
    voiceCues:[{beat:7,sample:'go'},{beat:19,sample:'hey'},{beat:35,sample:'go'},{beat:51,sample:'hey'},{beat:64,sample:'yeah'},{beat:78.5,sample:'yeah',gain:.9}], practiceTargets:[6,8,10,12], practiceCueBeats:[5,7,9,11], character:'ensemble', accent:'aqua'
  }
};

export const getGameDefinition=(gameId:GameId):GameDefinition=>GAMES[gameId];
export const getSectionLabel=(definition:GameDefinition,beat:number):string=>{let label=definition.sections[0]?.label??'';for(const section of definition.sections){if(beat>=section.startBeat)label=section.label;else break;}return label;};
