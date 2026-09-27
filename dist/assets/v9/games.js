const T = (beat, action = 'press', label, group) => ({
    beat,
    action,
    ...(label ? { label } : {}),
    ...(group ? { group } : {})
});
const C = (beat, kind, label, durationBeats, lane, pitch) => ({
    beat,
    kind,
    ...(label ? { label } : {}),
    ...(durationBeats !== undefined ? { durationBeats } : {}),
    ...(lane ? { lane } : {}),
    ...(pitch !== undefined ? { pitch } : {})
});
export const GAME_ORDER = [
    'bread-factory',
    'space-delivery',
    'frog-radio',
    'nap-alarm',
    'remix-1',
    'penguin-waiter',
    'robot-maintenance',
    'moon-volley',
    'chorus-trio',
    'remix-2',
    'mole-mail',
    'dance-coach',
    'press-conference',
    'ninja-camera',
    'remix-3'
];
export const GAMES = {
    'bread-factory': {
        id: 'bread-factory', stage: 1, world: 1, isRemix: false,
        title: 'スカイゴルフ', icon: '⛳', accent: '#79d9ff',
        shortDescription: '短い合図と長い合図。最後の拍でスイング！',
        instruction: '小鳥の「ピッ・ポッ」は次の拍。大きな鳥の長い合図は最後の一声と同時に打とう。',
        controlHint: 'タイミングよくタップ', bpm: 115, endBeat: 72, inputMode: 'tap', scene: 'bakery', musicStyle: 'bakery', penalizeStray: false,
        targets: [
            T(10), T(14), T(19), T(24), T(29), T(34), T(38), T(43),
            T(48), T(52), T(57), T(62), T(66), T(70)
        ],
        cues: [
            C(8, 'serve', 'ピッ'), C(9, 'serve', 'ポッ'),
            C(12, 'serve', 'ピッ'), C(13, 'serve', 'ポッ'),
            C(16, 'lob', 'オー…', 3), C(17, 'serve', 'オー'), C(18, 'serve', 'イ！'),
            C(22, 'serve', 'ピッ'), C(23, 'serve', 'ポッ'),
            C(26, 'lob', 'オー…', 3), C(27, 'serve', 'オー'), C(28, 'serve', 'イ！'),
            C(32, 'serve', 'ピッ'), C(33, 'serve', 'ポッ'),
            C(36, 'serve', 'ピッ'), C(37, 'serve', 'ポッ'),
            C(40, 'lob', 'オー…', 3), C(41, 'serve', 'オー'), C(42, 'serve', 'イ！'),
            C(46, 'serve', 'ピッ'), C(47, 'serve', 'ポッ'),
            C(50, 'serve', 'ピッ'), C(51, 'serve', 'ポッ'),
            C(54, 'lob', 'オー…', 3), C(55, 'serve', 'オー'), C(56, 'serve', 'イ！'),
            C(60, 'serve', 'ピッ'), C(61, 'serve', 'ポッ'),
            C(64, 'serve', 'ピッ'), C(65, 'serve', 'ポッ'),
            C(67, 'lob', 'オー…', 3), C(68, 'serve', 'オー'), C(69, 'serve', 'イ！')
        ],
        sections: [
            { startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'TEE OFF' },
            { startBeat: 16, label: 'BIG BIRD' }, { startBeat: 32, label: 'RHYTHM SWING' },
            { startBeat: 46, label: 'CAMERA OUT' }, { startBeat: 60, label: 'LAST HOLES' }
        ],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 31, sample: 'hey' }, { beat: 60, sample: 'yeah' }],
        practiceTargets: [T(10), T(15)],
        practiceCues: [C(8, 'serve', 'ピッ'), C(9, 'serve', 'ポッ'), C(12, 'lob', '長い合図', 3), C(13, 'serve', 'オー'), C(14, 'serve', 'イ！')],
        practiceEndBeat: 19
    },
    'space-delivery': {
        id: 'space-delivery', stage: 2, world: 1, isRemix: false,
        title: 'ロボねじ工場', icon: '🤖', accent: '#ffd86b',
        shortDescription: 'ロボをつかんで、2拍か3拍だけ締める。',
        instruction: 'ロボが来たら押しっぱなし。短いロボは2拍、長いロボは3拍で離して完成させよう。',
        controlHint: '長押し → 離す', bpm: 105, endBeat: 72, inputMode: 'hold', scene: 'space', musicStyle: 'robot', penalizeStray: true,
        targets: [
            T(8, 'press', 'つかむ', 'a'), T(10, 'release', '離す', 'a'),
            T(14, 'press', 'つかむ', 'b'), T(17, 'release', '離す', 'b'),
            T(22, 'press', 'つかむ', 'c'), T(24, 'release', '離す', 'c'),
            T(28, 'press', 'つかむ', 'd'), T(31, 'release', '離す', 'd'),
            T(36, 'press', 'つかむ', 'e'), T(38, 'release', '離す', 'e'),
            T(41, 'press', 'つかむ', 'f'), T(44, 'release', '離す', 'f'),
            T(49, 'press', 'つかむ', 'g'), T(51, 'release', '離す', 'g'),
            T(54, 'press', 'つかむ', 'h'), T(57, 'release', '離す', 'h'),
            T(61, 'press', 'つかむ', 'i'), T(63, 'release', '離す', 'i'),
            T(66, 'press', 'つかむ', 'j'), T(69, 'release', '離す', 'j')
        ],
        cues: [
            C(8, 'bolt-short', 'SHORT', 2), C(14, 'bolt-long', 'LONG', 3), C(22, 'bolt-short', 'SHORT', 2), C(28, 'bolt-long', 'LONG', 3),
            C(36, 'bolt-short', 'SHORT', 2), C(41, 'bolt-long', 'LONG', 3), C(49, 'bolt-short', 'SHORT', 2), C(54, 'bolt-long', 'LONG', 3),
            C(61, 'bolt-short', 'SHORT', 2), C(66, 'bolt-long', 'LONG', 3)
        ],
        sections: [
            { startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'ASSEMBLY LINE' }, { startBeat: 20, label: 'SHORT / LONG' },
            { startBeat: 34, label: 'LIGHTS DOWN' }, { startBeat: 48, label: 'FAST LINE' }, { startBeat: 60, label: 'FINAL ORDER' }
        ],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 34, sample: 'hey' }, { beat: 60, sample: 'yeah' }],
        practiceTargets: [T(8, 'press', '押す', 'p'), T(10, 'release', '離す', 'p'), T(14, 'press', '押す', 'q'), T(17, 'release', '離す', 'q')],
        practiceCues: [C(8, 'bolt-short', '2拍', 2), C(14, 'bolt-long', '3拍', 3)], practiceEndBeat: 20
    },
    'frog-radio': {
        id: 'frog-radio', stage: 3, world: 1, isRemix: false,
        title: 'リスのタンバリン', icon: '🪇', accent: '#9bf077',
        shortDescription: 'お手本を聞いて、振る・たたくをそのまま返す！',
        instruction: '左タップはシャカ、右タップはパン。リスのお手本を次の小節でまねしよう。',
        controlHint: '左=シャカ / 右=パン', bpm: 149, endBeat: 72, inputMode: 'split', scene: 'frog', musicStyle: 'frog', penalizeStray: true,
        targets: [
            T(12, 'left'), T(13, 'right'), T(14, 'left'),
            T(24, 'right'), T(24.5, 'right'), T(26, 'left'), T(27, 'right'),
            T(36, 'left'), T(37.5, 'right'), T(38, 'left'), T(39.5, 'right'),
            T(48, 'right'), T(49, 'left'), T(49.5, 'right'), T(51, 'left'),
            T(60, 'left'), T(60.5, 'right'), T(61, 'left'), T(62.5, 'right'), T(64, 'right'), T(65, 'left'), T(66.5, 'right')
        ],
        cues: [
            C(8, 'dance-left', 'シャカ', undefined, 'left'), C(9, 'dance-right', 'パン', undefined, 'right'), C(10, 'dance-left', 'シャカ', undefined, 'left'),
            C(20, 'dance-right', 'パン', undefined, 'right'), C(20.5, 'dance-right', 'パン', undefined, 'right'), C(22, 'dance-left', 'シャカ', undefined, 'left'), C(23, 'dance-right', 'パン', undefined, 'right'),
            C(32, 'dance-left', 'シャカ', undefined, 'left'), C(33.5, 'dance-right', 'パン', undefined, 'right'), C(34, 'dance-left', 'シャカ', undefined, 'left'), C(35.5, 'dance-right', 'パン', undefined, 'right'),
            C(44, 'dance-right', 'パン', undefined, 'right'), C(45, 'dance-left', 'シャカ', undefined, 'left'), C(45.5, 'dance-right', 'パン', undefined, 'right'), C(47, 'dance-left', 'シャカ', undefined, 'left'),
            C(56, 'dance-left', 'シャカ', undefined, 'left'), C(56.5, 'dance-right', 'パン', undefined, 'right'), C(57, 'dance-left', 'シャカ', undefined, 'left'), C(58.5, 'dance-right', 'パン', undefined, 'right'), C(60, 'dance-right', 'パン', undefined, 'right'), C(61, 'dance-left', 'シャカ', undefined, 'left'), C(62.5, 'dance-right', 'パン', undefined, 'right')
        ],
        sections: [{ startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'COPY 1' }, { startBeat: 20, label: 'COPY 2' }, { startBeat: 32, label: 'HALF BEAT' }, { startBeat: 44, label: 'TRICK PATTERN' }, { startBeat: 56, label: 'FINAL COPY' }],
        voiceCues: [{ beat: 7, sample: 'hey' }, { beat: 31, sample: 'go' }, { beat: 55, sample: 'yeah' }],
        practiceTargets: [T(12, 'left'), T(13, 'right'), T(14, 'left')],
        practiceCues: [C(8, 'dance-left', '左でシャカ', undefined, 'left'), C(9, 'dance-right', '右でパン', undefined, 'right'), C(10, 'dance-left', '左でシャカ', undefined, 'left')], practiceEndBeat: 18
    },
    'nap-alarm': {
        id: 'nap-alarm', stage: 4, world: 1, isRemix: false,
        title: 'くるくる会議', icon: '🪑', accent: '#c5a8ff',
        shortDescription: 'みんなが止まった、その次で自分もピタッ！',
        instruction: '3人のイスが順番に止まる音を聞き、自分は4人目として次の拍で止まろう。',
        controlHint: '自分の番でタップ', bpm: 140, endBeat: 68, inputMode: 'tap', scene: 'bedroom', musicStyle: 'conference', penalizeStray: false,
        targets: [T(11), T(19), T(27), T(35), T(43), T(51), T(59), T(65)],
        cues: [
            C(8, 'knock', 'ピタ'), C(9, 'knock', 'ピタ'), C(10, 'knock', 'ピタ'),
            C(16, 'knock', 'ピタ'), C(17, 'knock', 'ピタ'), C(18, 'knock', 'ピタ'),
            C(24, 'knock', 'ピタ'), C(25, 'knock', 'ピタ'), C(26, 'knock', 'ピタ'),
            C(32, 'knock', 'ピタ'), C(33, 'knock', 'ピタ'), C(34, 'knock', 'ピタ'),
            C(40, 'knock', 'ピタ'), C(41, 'knock', 'ピタ'), C(42, 'knock', 'ピタ'),
            C(48, 'knock', 'ピタ'), C(49, 'knock', 'ピタ'), C(50, 'knock', 'ピタ'),
            C(56, 'knock', 'ピタ'), C(57, 'knock', 'ピタ'), C(58, 'knock', 'ピタ'),
            C(62, 'knock', 'ピタ'), C(63, 'knock', 'ピタ'), C(64, 'knock', 'ピタ')
        ],
        sections: [{ startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'MEETING START' }, { startBeat: 24, label: 'FAST AGENDA' }, { startBeat: 40, label: 'BOSS WATCHING' }, { startBeat: 56, label: 'LAST ITEM' }],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 39, sample: 'hey' }, { beat: 56, sample: 'yeah' }],
        practiceTargets: [T(11), T(19)], practiceCues: [C(8, 'knock', '1人目'), C(9, 'knock', '2人目'), C(10, 'knock', '3人目'), C(16, 'knock', '1人目'), C(17, 'knock', '2人目'), C(18, 'knock', '3人目')], practiceEndBeat: 22
    },
    'remix-1': {
        id: 'remix-1', stage: 5, world: 1, isRemix: true,
        title: 'リミックス 1', icon: '🎛️', accent: '#ff6fa9',
        shortDescription: 'ゴルフ・ねじ・タンバリン・会議を一気に切替！',
        instruction: '画面が変わった瞬間に、各ゲームの合図と入力のしかたを思い出そう。',
        controlHint: 'タップ / 左右 / 長押し', bpm: 140, endBeat: 72, inputMode: 'mixed', scene: 'bakery', musicStyle: 'remix-a', penalizeStray: true,
        externalMusic: { file: 'music/racing_game_title_bpm140.ogg', bpm: 140, offsetSec: 0, gain: .55 },
        targets: [
            T(10), T(14),
            T(20, 'press', '締め', 'r1'), T(22, 'release', '離す', 'r1'), T(24, 'press', '締め', 'r2'), T(27, 'release', '離す', 'r2'),
            T(36, 'left'), T(37, 'right'), T(38, 'left'), T(44, 'right'), T(44.5, 'right'), T(46, 'left'),
            T(55), T(63),
            T(67), T(68, 'left'), T(69, 'right'), T(70)
        ],
        cues: [
            C(8, 'serve', 'ピッ'), C(9, 'serve', 'ポッ'), C(12, 'serve', 'ピッ'), C(13, 'serve', 'ポッ'),
            C(20, 'bolt-short', 'SHORT', 2), C(24, 'bolt-long', 'LONG', 3),
            C(32, 'dance-left', 'シャカ', undefined, 'left'), C(33, 'dance-right', 'パン', undefined, 'right'), C(34, 'dance-left', 'シャカ', undefined, 'left'), C(40, 'dance-right', 'パン', undefined, 'right'), C(40.5, 'dance-right', 'パン', undefined, 'right'), C(42, 'dance-left', 'シャカ', undefined, 'left'),
            C(52, 'knock', 'ピタ'), C(53, 'knock', 'ピタ'), C(54, 'knock', 'ピタ'), C(60, 'knock', 'ピタ'), C(61, 'knock', 'ピタ'), C(62, 'knock', 'ピタ'),
            C(66, 'switch', 'FINAL!')
        ],
        sections: [{ startBeat: 0, label: 'COUNT IN', scene: 'bakery' }, { startBeat: 4, label: 'SKY GOLF', scene: 'bakery' }, { startBeat: 18, label: 'SCREWBOT', scene: 'space' }, { startBeat: 30, label: 'TAMBOURINE', scene: 'frog' }, { startBeat: 50, label: 'BOARD ROOM', scene: 'bedroom' }, { startBeat: 66, label: 'ALL IN', scene: 'bakery' }],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 18, sample: 'hey' }, { beat: 30, sample: 'go' }, { beat: 50, sample: 'hey' }, { beat: 66, sample: 'yeah' }],
        practiceTargets: [T(10), T(14)], practiceCues: [C(8, 'serve', 'ピッ'), C(9, 'serve', 'ポッ'), C(12, 'serve', 'ピッ'), C(13, 'serve', 'ポッ')], practiceEndBeat: 18
    },
    'penguin-waiter': {
        id: 'penguin-waiter', stage: 6, world: 2, isRemix: false,
        title: 'スピード串刺し', icon: '🍡', accent: '#ffbd73',
        shortDescription: '遠くから飛んでくる食べ物を、同じ速さで串刺し！',
        instruction: '飛ばす音から到着までの長さはいつも同じ。間隔が変わっても焦らず刺そう。',
        controlHint: '食べ物が来た瞬間タップ', bpm: 130, endBeat: 72, inputMode: 'tap', scene: 'penguin', musicStyle: 'penguin', penalizeStray: false,
        targets: [T(10), T(14), T(18), T(22), T(26), T(28), T(31), T(35), T(39), T(41), T(43), T(47), T(51), T(53.5), T(56), T(60), T(61.5), T(64), T(66), T(68)],
        cues: [8, 12, 16, 20, 24, 26, 29, 33, 37, 39, 41, 45, 49, 51.5, 54, 58, 59.5, 62, 64, 66].map((b, i) => C(b, 'ding', i >= 15 ? 'ミニバーガー!' : 'ポン', undefined, undefined, 76 + (i % 4) * 2)),
        sections: [{ startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'SNACK TIME' }, { startBeat: 24, label: 'CLOSE TOGETHER' }, { startBeat: 40, label: 'TRIPLE' }, { startBeat: 56, label: 'BURGER RUSH' }],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 39, sample: 'hey' }, { beat: 56, sample: 'yeah' }],
        practiceTargets: [T(10), T(14), T(18)], practiceCues: [C(8, 'ding', '飛ばす'), C(12, 'ding', '飛ばす'), C(16, 'ding', '飛ばす')], practiceEndBeat: 22
    },
    'robot-maintenance': {
        id: 'robot-maintenance', stage: 7, world: 2, isRemix: false,
        title: '雲上ラリー', icon: '🏸', accent: '#8fc8ff',
        shortDescription: '普通は次の拍。長い掛け声だけ2拍待つ！',
        instruction: '相手が打ったら次の拍で返球。長い掛け声が来たときだけ、もう1拍待って返そう。',
        controlHint: '返球の瞬間にタップ', bpm: 121, endBeat: 76, inputMode: 'tap', scene: 'robot', musicStyle: 'moon', penalizeStray: false,
        targets: [T(9), T(13), T(17), T(22), T(26), T(30), T(35), T(39), T(43), T(48), T(52), T(56), T(61), T(65), T(69), T(73)],
        cues: [
            C(8, 'serve', 'パン!'), C(12, 'serve', 'パン!'), C(16, 'serve', 'パン!'), C(20, 'lob', 'タ・タ・ターン', 2),
            C(25, 'serve', 'パン!'), C(29, 'serve', 'パン!'), C(33, 'lob', 'タ・タ・ターン', 2), C(38, 'serve', 'パン!'), C(42, 'serve', 'パン!'),
            C(46, 'lob', 'タ・タ・ターン', 2), C(51, 'serve', 'パン!'), C(55, 'serve', 'パン!'), C(59, 'lob', 'タ・タ・ターン', 2), C(64, 'serve', 'パン!'), C(68, 'serve', 'パン!'), C(71, 'lob', 'タ・タ・ターン', 2)
        ],
        sections: [{ startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'RALLY' }, { startBeat: 20, label: 'SLOW RETURN' }, { startBeat: 36, label: 'FAR AWAY' }, { startBeat: 52, label: 'SUNSET' }, { startBeat: 68, label: 'MATCH POINT' }],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 36, sample: 'hey' }, { beat: 68, sample: 'yeah' }],
        practiceTargets: [T(9), T(14)], practiceCues: [C(8, 'serve', '次の拍'), C(12, 'lob', '2拍待つ', 2)], practiceEndBeat: 18
    },
    'moon-volley': {
        id: 'moon-volley', stage: 8, world: 2, isRemix: false,
        title: '公園デート', icon: '💞', accent: '#ff9cb2',
        shortDescription: 'ボールの種類で「何拍後に蹴るか」が変わる。',
        instruction: '軽いボールは2拍後、跳ねるボールは2.5拍後、重いボールは4拍後。音で種類を見分けよう。',
        controlHint: 'ボールを蹴る瞬間タップ', bpm: 75, endBeat: 64, inputMode: 'tap', scene: 'moon', musicStyle: 'dream', penalizeStray: false,
        targets: [T(10), T(17.5), T(24), T(30), T(37.5), T(44), T(50), T(57.5), T(62)],
        cues: [
            C(8, 'serve', 'サッカー', 2), C(15, 'dish-left', 'バスケ', 2.5), C(20, 'lob', 'ラグビー', 4),
            C(28, 'serve', 'サッカー', 2), C(35, 'dish-left', 'バスケ', 2.5), C(40, 'lob', 'ラグビー', 4),
            C(48, 'serve', 'サッカー', 2), C(55, 'dish-left', 'バスケ', 2.5), C(58, 'lob', 'ラグビー', 4)
        ],
        sections: [{ startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'PICNIC' }, { startBeat: 20, label: 'HEAVY BALL' }, { startBeat: 34, label: 'DOG RUNS BY' }, { startBeat: 48, label: 'SUNSET DATE' }],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 34, sample: 'hey' }, { beat: 48, sample: 'yeah' }],
        practiceTargets: [T(10), T(17.5)], practiceCues: [C(8, 'serve', '2拍後', 2), C(15, 'dish-left', '2.5拍後', 2.5)], practiceEndBeat: 21
    },
    'chorus-trio': {
        id: 'chorus-trio', stage: 9, world: 2, isRemix: false,
        title: 'ビート時計', icon: '⌚', accent: '#ffe176',
        shortDescription: '合図がなくても1拍ずつ刻む。紫だけ裏拍！',
        instruction: '通常は毎拍タップ。キラッと鳴る紫のペアだけ「0.75拍→1.25拍」の裏拍で入ろう。',
        controlHint: 'ずっと拍をキープ', bpm: 160, endBeat: 72, inputMode: 'tap', scene: 'chorus', musicStyle: 'dance', penalizeStray: true,
        targets: [
            ...[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(b => T(b)),
            T(20.75), T(21.25), T(22),
            ...[23, 24, 25, 26, 27, 28, 29, 30, 31].map(b => T(b)),
            T(32.75), T(33.25), T(34),
            ...[35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46].map(b => T(b)),
            T(47.75), T(48.25), T(49),
            ...[50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61].map(b => T(b)),
            T(62.75), T(63.25), T(64),
            ...[65, 66, 67, 68, 69, 70].map(b => T(b))
        ],
        cues: [C(20.75, 'dance-left', 'キラ', undefined, 'left'), C(21.25, 'dance-right', 'キラ', undefined, 'right'), C(32.75, 'dance-left', 'キラ', undefined, 'left'), C(33.25, 'dance-right', 'キラ', undefined, 'right'), C(47.75, 'dance-left', 'キラ', undefined, 'left'), C(48.25, 'dance-right', 'キラ', undefined, 'right'), C(62.75, 'dance-left', 'キラ', undefined, 'left'), C(63.25, 'dance-right', 'キラ', undefined, 'right')],
        sections: [{ startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'KEEP THE BEAT' }, { startBeat: 20, label: 'OFFBEAT PAIR' }, { startBeat: 34, label: 'ZOOM OUT' }, { startBeat: 50, label: 'CLOUD COVER' }, { startBeat: 62, label: 'LAST MINUTE' }],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 34, sample: 'hey' }, { beat: 62, sample: 'yeah' }],
        practiceTargets: [T(8), T(9), T(10), T(11), T(12.75), T(13.25), T(14)], practiceCues: [C(12.75, 'dance-left', '裏'), C(13.25, 'dance-right', '裏')], practiceEndBeat: 17
    },
    'remix-2': {
        id: 'remix-2', stage: 10, world: 2, isRemix: true,
        title: 'リミックス 2', icon: '🪩', accent: '#7df0da',
        shortDescription: '串刺し・ラリー・デート・時計が切り替わる！',
        instruction: '「何拍後に押すか」と「ずっと刻む」を短い区間で切り替えよう。',
        controlHint: 'タップ中心', bpm: 120, endBeat: 80, inputMode: 'tap', scene: 'penguin', musicStyle: 'remix-b', penalizeStray: true,
        externalMusic: { file: 'music/pm_rhythm.ogg', bpm: 120, offsetSec: 0, gain: .56 },
        targets: [
            T(10), T(14), T(18),
            T(25), T(29), T(34),
            T(42), T(49.5),
            ...[54, 55, 56, 57, 58, 59].map(b => T(b)), T(60.75), T(61.25), T(62),
            T(66), T(68), T(70), T(72), T(74), T(76), T(78)
        ],
        cues: [
            C(8, 'ding'), C(12, 'ding'), C(16, 'ding'),
            C(24, 'serve', 'パン!'), C(28, 'serve', 'パン!'), C(32, 'lob', 'タ・タ・ターン', 2),
            C(40, 'serve', 'サッカー', 2), C(47, 'dish-left', 'バスケ', 2.5),
            C(60.75, 'dance-left', '裏'), C(61.25, 'dance-right', '裏'),
            C(65, 'switch', 'LAST!')
        ],
        sections: [{ startBeat: 0, label: 'COUNT IN', scene: 'penguin' }, { startBeat: 4, label: 'FORK', scene: 'penguin' }, { startBeat: 22, label: 'AIR RALLY', scene: 'robot' }, { startBeat: 38, label: 'DATE', scene: 'moon' }, { startBeat: 52, label: 'BEAT WATCH', scene: 'chorus' }, { startBeat: 65, label: 'ALL IN', scene: 'penguin' }],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 22, sample: 'hey' }, { beat: 38, sample: 'go' }, { beat: 52, sample: 'hey' }, { beat: 65, sample: 'yeah' }],
        practiceTargets: [T(10), T(14)], practiceCues: [C(8, 'ding', '飛ばす'), C(12, 'ding', '飛ばす')], practiceEndBeat: 18
    },
    'mole-mail': {
        id: 'mole-mail', stage: 11, world: 3, isRemix: false,
        title: 'コーラス隊', icon: '🎤', accent: '#ff9ad2',
        shortDescription: '前の2人と同じタイミングで歌い、指揮でピタッと止める。',
        instruction: '合図で押して歌い始め、指揮者が止める拍で離そう。長さの違うフレーズが続く。',
        controlHint: '長押しで歌う → 離す', bpm: 120, endBeat: 72, inputMode: 'hold', scene: 'mole', musicStyle: 'chorus', penalizeStray: true,
        targets: [
            T(12, 'press', '歌う', 'a'), T(14, 'release', '止め', 'a'),
            T(22, 'press', '歌う', 'b'), T(25, 'release', '止め', 'b'),
            T(32, 'press', '歌う', 'c'), T(33.5, 'release', '止め', 'c'),
            T(40, 'press', '歌う', 'd'), T(44, 'release', '止め', 'd'),
            T(50, 'press', '歌う', 'e'), T(52, 'release', '止め', 'e'),
            T(58, 'press', '歌う', 'f'), T(61, 'release', '止め', 'f'),
            T(65, 'press', 'みんなで', 'g'), T(69, 'release', '止め', 'g')
        ],
        cues: [C(8, 'sing-short', 'ラ〜', 2), C(18, 'sing-long', 'ラ〜〜', 3), C(28, 'sing-short', 'ラ〜', 1.5), C(36, 'sing-long', 'ラ〜〜〜', 4), C(46, 'sing-short', 'ラ〜', 2), C(54, 'sing-long', 'ラ〜〜', 3), C(63, 'switch', 'みんなで!')],
        sections: [{ startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'CHOIR 1' }, { startBeat: 18, label: 'CHOIR 2' }, { startBeat: 36, label: 'LONG NOTE' }, { startBeat: 54, label: 'CONDUCTOR' }, { startBeat: 63, label: 'TOGETHER NOW' }],
        voiceCues: [{ beat: 11, sample: 'hey', gain: .45 }, { beat: 54, sample: 'go', gain: .5 }, { beat: 63, sample: 'yeah' }],
        practiceTargets: [T(12, 'press', '歌う', 'p'), T(14, 'release', '止め', 'p')], practiceCues: [C(8, 'sing-short', '2拍歌う', 2)], practiceEndBeat: 18
    },
    'dance-coach': {
        id: 'dance-coach', stage: 12, world: 3, isRemix: false,
        title: 'カラテ屋台', icon: '🥋', accent: '#ff7f6b',
        shortDescription: '飛んでくる物をパンチ。連続コンボは一気に！',
        instruction: '基本は物が来た拍でタップ。掛け声が入ったら細かい連打コンボに切り替えよう。',
        controlHint: 'パンチ = タップ', bpm: 120, endBeat: 76, inputMode: 'tap', scene: 'dance', musicStyle: 'ninja', penalizeStray: false,
        targets: [T(8), T(12), T(16), T(20), T(24), T(28), T(32), T(36), T(40), T(40.5), T(41), T(41.5), T(46), T(50), T(54), T(58), T(62), T(62.5), T(63), T(63.5), T(68), T(72), T(74)],
        cues: [C(7, 'knock', 'PUNCH'), C(11, 'knock', 'PUNCH'), C(15, 'knock', 'PUNCH'), C(19, 'knock', 'PUNCH'), C(23, 'knock', 'PUNCH'), C(27, 'knock', 'PUNCH'), C(31, 'knock', 'PUNCH'), C(35, 'knock', 'PUNCH'), C(39, 'question-three', 'COMBO!'), C(45, 'knock', 'PUNCH'), C(49, 'knock', 'PUNCH'), C(53, 'knock', 'PUNCH'), C(57, 'knock', 'PUNCH'), C(61, 'question-three', 'COMBO!'), C(67, 'knock', 'PUNCH'), C(71, 'knock', 'PUNCH'), C(73, 'knock', 'LAST')],
        sections: [{ startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'TRAINING' }, { startBeat: 24, label: 'POTS & PANS' }, { startBeat: 38, label: 'COMBO' }, { startBeat: 46, label: 'NIGHT TRAINING' }, { startBeat: 60, label: 'SUPER COMBO' }, { startBeat: 68, label: 'LAST ONE' }],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 38, sample: 'hey' }, { beat: 60, sample: 'yeah' }],
        practiceTargets: [T(8), T(12), T(16)], practiceCues: [C(7, 'knock', '来たらパンチ'), C(11, 'knock', '来たらパンチ'), C(15, 'knock', '来たらパンチ')], practiceEndBeat: 20
    },
    'press-conference': {
        id: 'press-conference', stage: 13, world: 3, isRemix: false,
        title: 'チャンピオン会見', icon: '🎙️', accent: '#ffca64',
        shortDescription: '質問ごとに、うなずく・2回返事・長いポーズ！',
        instruction: '短い質問は1回、盛り上がる質問は2回、カメラ合図は長押しポーズで答えよう。',
        controlHint: 'タップ / 2回 / 長押し', bpm: 118, endBeat: 76, inputMode: 'mixed', scene: 'conference', musicStyle: 'conference', penalizeStray: true,
        targets: [
            T(10), T(18), T(18.5), T(26, 'press', 'ポーズ', 'p1'), T(28, 'release', '戻す', 'p1'),
            T(34), T(42), T(42.5), T(50, 'press', 'ポーズ', 'p2'), T(53, 'release', '戻す', 'p2'),
            T(58), T(64), T(64.5), T(70, 'press', 'ポーズ', 'p3'), T(73, 'release', '戻す', 'p3')
        ],
        cues: [C(8, 'question-one', '本当ですか?'), C(16, 'question-two', 'すごいですね!'), C(24, 'question-hold', 'カメラにポーズ!', 2), C(32, 'question-one', '調子は?'), C(40, 'question-two', 'もう一度!'), C(48, 'question-hold', 'ファンへポーズ!', 3), C(56, 'question-one', '最後の質問!'), C(62, 'question-two', '二回お願いします!'), C(68, 'question-hold', 'ラストポーズ!', 3)],
        sections: [{ startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'LIVE INTERVIEW' }, { startBeat: 24, label: 'POSE!' }, { startBeat: 40, label: 'CAMERA FLASH' }, { startBeat: 56, label: 'LAST QUESTIONS' }],
        voiceCues: [{ beat: 7, sample: 'hey' }, { beat: 24, sample: 'go' }, { beat: 48, sample: 'hey' }, { beat: 68, sample: 'yeah' }],
        practiceTargets: [T(10), T(18), T(18.5)], practiceCues: [C(8, 'question-one', '1回'), C(16, 'question-two', '2回')], practiceEndBeat: 22
    },
    'ninja-camera': {
        id: 'ninja-camera', stage: 14, world: 3, isRemix: false,
        title: '影斬り道場', icon: '⚔️', accent: '#7ef0b1',
        shortDescription: '1体は斬る。大群は構えて、まとめて一閃！',
        instruction: '普通の敵はタップで一太刀。大群の気配が来たら長押しで構え、合図の終わりで離そう。',
        controlHint: 'タップ / 長押し', bpm: 119, endBeat: 80, inputMode: 'mixed', scene: 'ninja', musicStyle: 'ninja', penalizeStray: false,
        targets: [
            T(10), T(16), T(22),
            T(28, 'press', '構え', 'w1'), T(31, 'release', '一閃', 'w1'),
            T(36), T(42), T(48),
            T(54, 'press', '構え', 'w2'), T(57, 'release', '一閃', 'w2'),
            T(62), T(66),
            T(70, 'press', '構え', 'w3'), T(74, 'release', '一閃', 'w3'), T(77)
        ],
        cues: [C(8, 'camera-ready', 'サッ…', 2), C(14, 'camera-ready', 'サッ…', 2), C(20, 'camera-ready', 'サッ…', 2), C(28, 'charge', '大群!', 3), C(34, 'camera-ready', 'サッ…', 2), C(40, 'camera-ready', 'サッ…', 2), C(46, 'camera-ready', 'サッ…', 2), C(54, 'charge', '大群!', 3), C(60, 'camera-ready', 'サッ…', 2), C(64, 'camera-ready', 'サッ…', 2), C(70, 'charge', '大群!', 4), C(75, 'camera-ready', '最後!', 2)],
        sections: [{ startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'ROAD' }, { startBeat: 26, label: 'SWARM' }, { startBeat: 34, label: 'FOG' }, { startBeat: 52, label: 'STORM' }, { startBeat: 68, label: 'FINAL WAVE' }],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 26, sample: 'hey' }, { beat: 52, sample: 'go' }, { beat: 68, sample: 'yeah' }],
        practiceTargets: [T(10), T(16), T(22, 'press', '構え', 'p'), T(25, 'release', '一閃', 'p')], practiceCues: [C(8, 'camera-ready', '2拍後に斬る', 2), C(14, 'camera-ready', '2拍後に斬る', 2), C(22, 'charge', '長押し3拍', 3)], practiceEndBeat: 28
    },
    'remix-3': {
        id: 'remix-3', stage: 15, world: 3, isRemix: true,
        title: 'ファイナル・リミックス', icon: '🌈', accent: '#ffe66d',
        shortDescription: '12種類のルールを1曲で高速に切り替える最終戦！',
        instruction: '見た目は次々変わる。音を聞いた瞬間に「どのゲームのルールか」を思い出そう。',
        controlHint: '全部！', bpm: 150, endBeat: 104, inputMode: 'mixed', scene: 'bakery', musicStyle: 'remix-c', penalizeStray: true,
        externalMusic: { file: 'music/amusement_park_stage_bpm150.ogg', bpm: 150, offsetSec: 0, gain: .5 },
        targets: [
            T(10), T(14),
            T(20, 'press', '締め', 'a'), T(22, 'release', '離す', 'a'),
            T(28, 'left'), T(29, 'right'), T(30, 'left'),
            T(35),
            T(42), T(45), T(48),
            T(54), T(58),
            T(64), T(68.5),
            T(72), T(73), T(74), T(75),
            T(80, 'press', '歌う', 'b'), T(82, 'release', '止め', 'b'),
            T(86), T(87), T(87.5),
            T(92), T(94), T(94.5),
            T(98, 'press', '構え', 'c'), T(101, 'release', '一閃', 'c'), T(102.5)
        ],
        cues: [
            C(8, 'serve', 'ピッ'), C(9, 'serve', 'ポッ'), C(12, 'serve', 'ピッ'), C(13, 'serve', 'ポッ'),
            C(20, 'bolt-short', 'SHORT', 2),
            C(24, 'dance-left', 'シャカ', undefined, 'left'), C(25, 'dance-right', 'パン', undefined, 'right'), C(26, 'dance-left', 'シャカ', undefined, 'left'),
            C(32, 'knock', 'ピタ'), C(33, 'knock', 'ピタ'), C(34, 'knock', 'ピタ'),
            C(40, 'ding'), C(43, 'ding'), C(46, 'ding'),
            C(53, 'serve', 'パン!'), C(56, 'lob', 'タ・タ・ターン', 2),
            C(62, 'serve', 'サッカー', 2), C(66, 'dish-left', 'バスケ', 2.5),
            C(76, 'switch', 'CHOIR!'), C(76, 'sing-short', 'ラ〜', 2),
            C(84, 'knock', 'PUNCH'), C(85, 'question-two', 'COMBO!'),
            C(90, 'question-one', '本当ですか?'), C(92, 'question-two', '二回!'),
            C(98, 'charge', '大群!', 3)
        ],
        sections: [
            { startBeat: 0, label: 'COUNT IN', scene: 'bakery' }, { startBeat: 4, label: 'SKY GOLF', scene: 'bakery' }, { startBeat: 18, label: 'SCREWBOT', scene: 'space' },
            { startBeat: 24, label: 'TAMBOURINE', scene: 'frog' }, { startBeat: 32, label: 'BOARD', scene: 'bedroom' }, { startBeat: 40, label: 'FORK', scene: 'penguin' },
            { startBeat: 52, label: 'AIR RALLY', scene: 'robot' }, { startBeat: 62, label: 'DATE', scene: 'moon' }, { startBeat: 70, label: 'BEAT WATCH', scene: 'chorus' },
            { startBeat: 78, label: 'CHOIR', scene: 'mole' }, { startBeat: 84, label: 'KARATE', scene: 'dance' }, { startBeat: 90, label: 'INTERVIEW', scene: 'conference' },
            { startBeat: 97, label: 'SHADOW SLICE', scene: 'ninja' }
        ],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 18, sample: 'hey' }, { beat: 40, sample: 'go' }, { beat: 70, sample: 'hey' }, { beat: 90, sample: 'go' }, { beat: 97, sample: 'yeah' }],
        practiceTargets: [T(10), T(14)], practiceCues: [C(8, 'serve', 'ピッ'), C(9, 'serve', 'ポッ'), C(12, 'serve', 'ピッ'), C(13, 'serve', 'ポッ')], practiceEndBeat: 18
    }
};
export const getGameDefinition = (gameId) => GAMES[gameId];
export const getSection = (definition, beat) => {
    let section = definition.sections[0] ?? { startBeat: 0, label: '' };
    for (const candidate of definition.sections) {
        if (beat >= candidate.startBeat)
            section = candidate;
        else
            break;
    }
    return section;
};
export const getSectionLabel = (definition, beat) => getSection(definition, beat).label;
export const getSceneForBeat = (definition, beat) => getSection(definition, beat).scene ?? definition.scene;
const REVIEWS = {
    'bread-factory': { strong: ['短い合図も長い合図も、スイングの拍がきれいだった！', 'カメラが引いても音だけで打てていた！'], okay: ['基本の「合図→スイング」はつかめている！', '長い合図で少しだけ待ち時間が揺れたみたい。'], retry: ['小鳥の2音のあと、次の拍で打つ感覚を覚えよう。', '大きい合図は最後の一声まで待とう。'], stray: 'ボールが来る前にクラブを振った場面があったみたい。' },
    'space-delivery': { strong: ['2拍と3拍のロボをきれいに締め分けた！', '暗くなっても音の長さを信じられた！'], okay: ['短いロボは安定している！', '長いロボで少し締めすぎたみたい。'], retry: ['押し始めより「何拍で離すか」を意識しよう。', 'SHORT=2拍、LONG=3拍を体で覚えよう。'], stray: 'つかむ前や途中で手を離したロボがあったみたい。' },
    'frog-radio': { strong: ['シャカとパンの並びをそのまま返せた！', '細かい半拍もきれいにコピーできた！'], okay: ['左右の基本はつかめている！', '後半の細かいパターンでもう少し落ち着けそう。'], retry: ['音の種類と間隔をセットで覚えよう。', 'お手本が終わるまで手を出さずに聞こう。'], stray: 'お手本中にタンバリンを鳴らした場面があったみたい。' },
    'nap-alarm': { strong: ['4人目の止まる拍が気持ちよくそろった！', '会議が速くなってもピタッと合わせられた！'], okay: ['基本の順番は分かっている！', '後半の速い議題で少し先走ったみたい。'], retry: ['3人の「ピタ」を聞いて、その次を自分の番にしよう。', '見るより音の順番を数えると安定する。'], stray: '自分の番より早くイスを止めた場面があったみたい。' },
    'remix-1': { strong: ['4つの入力ルールを迷わず切り替えられた！', '短い区間でも合図をすぐ思い出せていた！'], okay: ['切替にはかなりついていけている！', '左右と長押しの境目で少し迷ったみたい。'], retry: ['画面転換より、最初の合図音を聞こう。', '各ゲームの最初の1パターンを思い出すと落ち着く。'], stray: '切替直後に前のゲームの操作が残った場面があったみたい。' },
    'penguin-waiter': { strong: ['飛んでくる間隔が変わっても串の位置は正確！', 'ミニバーガーラッシュも食べ残しなし！'], okay: ['一定の飛行時間はつかめている！', '詰まった並びで少し忙しかったみたい。'], retry: ['発射音から到着までの長さは同じ。そこだけ信じよう。', '食べ物同士の間隔が変わっても焦らないで。'], stray: 'まだ飛んでいないのに串を出した場面があったみたい。' },
    'robot-maintenance': { strong: ['通常返球も遅い返球もリズムどおり！', '遠く離れても拍を見失わなかった！'], okay: ['普通の返球はかなり安定！', '長い掛け声だけもう1拍待つと完璧。'], retry: ['普通は次の拍、長い掛け声は2拍後。', '距離が変わっても音の間隔は変わらない。'], stray: '相手が打つ前にラケットを振った場面があったみたい。' },
    'moon-volley': { strong: ['3種類のボールを音だけで見分けられた！', '重いボールの長い待ち時間も我慢できた！'], okay: ['軽いボールはいい感じ！', '重いボールで少し早く蹴ったみたい。'], retry: ['ボールの種類ごとの「何拍後」を先に覚えよう。', '遅いボールほど急がないこと。'], stray: 'ボールが届く前に蹴り出した場面があったみたい。' },
    'chorus-trio': { strong: ['合図なしの拍キープが安定していた！', '裏拍ペアも時計どおりに入れた！'], okay: ['基本の毎拍は安定！', '紫の裏拍だけ少し崩れたみたい。'], retry: ['画面を追わず、まず足で1拍ずつ刻もう。', '紫だけ「少し早い→少し遅い」のペア。'], stray: '拍と拍の間で余計に押した場面があったみたい。' },
    'remix-2': { strong: ['待ち時間の違う4ゲームを音だけで切り替えた！', '時計区間でもテンポを保てていた！'], okay: ['基本の切替はできている！', 'デートから時計への切替で少し揺れたみたい。'], retry: ['各ゲームの「何拍待つか」を短く思い出そう。', '時計区間に入ったら考えず毎拍を刻もう。'], stray: '切替直後に先走った入力があったみたい。' },
    'mole-mail': { strong: ['歌い始めと止める拍が3人そろった！', '最後の全員コーラスもぴったり！'], okay: ['短いフレーズは安定している！', '長いフレーズの終わりが少し揺れたみたい。'], retry: ['歌い始めだけでなく「離す拍」まで聞こう。', '前の2人の長さをそのままコピーしよう。'], stray: '指揮者の合図より早く歌い出した場面があったみたい。' },
    'dance-coach': { strong: ['単発も連続コンボも気持ちよく決まった！', '最後の一発までリズムが落ちなかった！'], okay: ['単発パンチはかなり安定！', '細かいコンボで少し手数が乱れたみたい。'], retry: ['飛んでくる物を追うより、曲の拍でパンチしよう。', 'COMBOの声が来たら半拍の連打へ切り替えよう。'], stray: '何も飛んでいないところでパンチした場面があったみたい。' },
    'press-conference': { strong: ['質問の種類ごとに返事を切り替えられた！', 'ポーズの長さまでカメラにぴったり！'], okay: ['1回と2回の返事は安定！', '長いポーズで少し戻るのが早かったみたい。'], retry: ['質問の文章より、最後のリズムを聞こう。', 'ポーズは押すだけでなく離す瞬間も大事。'], stray: '記者がまだ話している途中で答えた場面があったみたい。' },
    'ninja-camera': { strong: ['一太刀と大群の一閃をきれいに使い分けた！', '霧の中でも敵の気配を聞き逃さなかった！'], okay: ['一体ずつの敵は安定！', '大群の構えを少し早く解いたみたい。'], retry: ['普通は2拍後に一太刀。大群は最後まで構えよう。', '見えなくなったら気配の音を信じよう。'], stray: '敵がいないところで刀を振った場面があったみたい。' },
    'remix-3': { strong: ['12ゲーム分のルールを1曲の中で切り替えきった！', '最後まで画面より音を信じられた！'], okay: ['かなりついていけている！', '長押し系の切替だけ少し迷ったみたい。'], retry: ['切替の最初の合図でゲームを判別しよう。', '操作を考えるより、覚えた音のルールを反射で返そう。'], stray: '場面転換に釣られて前のゲームの入力が残ったみたい。' }
};
export const getReviewLines = (gameId, score, strayMisses, averageAbsOffsetMs, earlyInputs, lateInputs) => {
    const pack = REVIEWS[gameId];
    const base = score >= 86 ? pack.strong : score >= 62 ? pack.okay : pack.retry;
    const timing = earlyInputs > lateInputs + 2
        ? '全体的に少し先走り気味。合図の最後まで聞いてから次の拍へ乗ろう。'
        : lateInputs > earlyInputs + 2
            ? '全体的に少し遅れ気味。合図を聞いた瞬間から次の拍を数えてみよう。'
            : averageAbsOffsetMs <= 65
                ? 'タイミングの中心はかなり安定していた！'
                : 'タイミングの中心が少し揺れている。足や指で拍を刻むと安定しそう。';
    return strayMisses > 0 ? [base[0] ?? '', pack.stray, timing] : [base[0] ?? '', base[1] ?? timing, timing];
};
//# sourceMappingURL=games.js.map