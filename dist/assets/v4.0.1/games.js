export const GAME_ORDER = ['mendako-pop', 'crab-clap', 'fugu-puku', 'deep-remix'];
export const GAMES = {
    'mendako-pop': {
        id: 'mendako-pop', stage: 1, title: 'メンダコポン',
        shortDescription: '曲のノリに合わせて、ポン！',
        instruction: 'ドラムとメロディを聴いて、輪が重なる瞬間にタップ',
        bpm: 124, endBeat: 60,
        targets: [8, 10, 12, 14, 20, 21, 22, 24, 26, 28, 32, 33.5, 35, 36, 38, 40, 44, 45, 46, 47.5, 48, 50, 52, 53, 54, 55.5, 56, 58],
        cueBeats: [7, 11, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55],
        sections: [
            { startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'INTRO' },
            { startBeat: 8, label: 'VERSE' }, { startBeat: 20, label: 'GROOVE UP' },
            { startBeat: 32, label: 'CHORUS' }, { startBeat: 44, label: 'FINAL' }
        ],
        voiceCues: [{ beat: 7, sample: 'hey' }, { beat: 31, sample: 'go' }, { beat: 56, sample: 'yeah', gain: 0.8 }],
        practiceTargets: [6, 8, 10, 12], practiceCueBeats: [5, 7, 9, 11],
        character: 'mendako', accent: 'pink'
    },
    'crab-clap': {
        id: 'crab-clap', stage: 2, title: 'カニクラップ',
        shortDescription: 'お手本フレーズを、そのまま返そう！',
        instruction: 'おてほんを聴いて、そのリズムをそのままクラップ',
        bpm: 116, endBeat: 60,
        targets: [12, 13, 14, 24, 25, 26.5, 36, 37.5, 38, 48, 49, 49.5, 50.5, 54, 54.5, 55.5, 57],
        cueBeats: [8, 9, 10, 20, 21, 22.5, 32, 33.5, 34, 44, 45, 45.5, 46.5, 52, 52.5, 53.5],
        sections: [
            { startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'INTRO' },
            { startBeat: 8, label: 'CALL 1' }, { startBeat: 20, label: 'CALL 2' },
            { startBeat: 32, label: 'CALL 3' }, { startBeat: 44, label: 'FINAL CALL' }
        ],
        voiceCues: [{ beat: 7, sample: 'hey' }, { beat: 23, sample: 'go' }, { beat: 47, sample: 'go' }, { beat: 57, sample: 'yeah' }],
        practiceTargets: [8, 9, 10], practiceCueBeats: [4, 5, 6],
        character: 'crab', accent: 'coral'
    },
    'fugu-puku': {
        id: 'fugu-puku', stage: 3, title: 'フグぷくぷく',
        shortDescription: '「ぷく・ぷく」の続きを音楽で決めよう！',
        instruction: '2つの合図を聴いて、次の「パン！」を音楽の中で決める',
        bpm: 104, endBeat: 60,
        targets: [10, 16, 23, 29, 35.5, 41, 47.5, 48.5, 51, 52, 54.5, 56, 57.5],
        cueBeats: [8, 9, 14, 15, 20, 21.5, 26, 27, 32, 33.5, 38, 39, 44, 45.5, 49, 50, 53, 53.5, 55, 55.5],
        sections: [
            { startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'INTRO' },
            { startBeat: 8, label: 'PUKU 1' }, { startBeat: 20, label: 'BOUNCE' },
            { startBeat: 32, label: 'CHORUS' }, { startBeat: 44, label: 'FINAL' }
        ],
        voiceCues: [{ beat: 9, sample: 'hey' }, { beat: 34, sample: 'go' }, { beat: 57.5, sample: 'yeah' }],
        practiceTargets: [10, 14, 18], practiceCueBeats: [8, 9, 12, 13, 16, 17],
        character: 'fugu', accent: 'lime'
    },
    'deep-remix': {
        id: 'deep-remix', stage: 4, title: '深海リミックス',
        shortDescription: '3つの遊びが曲の中で次々チェンジ！',
        instruction: '画面と音の合図を見極めて、リズムを切り替えよう',
        bpm: 128, endBeat: 72,
        targets: [8, 10, 12, 14, 20, 21, 22.5, 24, 30, 36, 37.5, 38, 44, 45, 46, 47.5, 52, 53, 53.5, 54.5, 60, 61.5, 63, 64, 66, 67, 68, 69.5],
        cueBeats: [7, 11, 19, 20, 21.5, 28, 29, 34, 35.5, 43, 47, 50, 51, 51.5, 58, 59, 62, 65],
        sections: [
            { startBeat: 0, label: 'COUNT IN' }, { startBeat: 4, label: 'MIX INTRO' },
            { startBeat: 8, label: 'MENDAKO' }, { startBeat: 20, label: 'CRAB' },
            { startBeat: 32, label: 'FUGU' }, { startBeat: 44, label: 'SWITCH!' },
            { startBeat: 56, label: 'ALL IN' }, { startBeat: 64, label: 'FINAL MIX' }
        ],
        voiceCues: [{ beat: 7, sample: 'go' }, { beat: 19, sample: 'hey' }, { beat: 31, sample: 'hey' }, { beat: 43, sample: 'go' }, { beat: 56, sample: 'yeah' }, { beat: 69.5, sample: 'yeah', gain: 0.9 }],
        practiceTargets: [6, 8, 10, 12], practiceCueBeats: [5, 7, 9, 11],
        character: 'ensemble', accent: 'aqua'
    }
};
export const getGameDefinition = (gameId) => GAMES[gameId];
export const getSectionLabel = (definition, beat) => {
    let label = definition.sections[0]?.label ?? '';
    for (const section of definition.sections) {
        if (beat >= section.startBeat)
            label = section.label;
        else
            break;
    }
    return label;
};
//# sourceMappingURL=games.js.map