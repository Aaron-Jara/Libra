export const voiceMap = {
    professor: {
      id: 'zNsotODqUhvbJ5wMG7Ei',
      name: 'professor',
      displayName: 'Wise Professor',
    },
    librarian: {
      id: '0mLOQqwA3kovxF1ID7z6',
      name: 'librarian',
      displayName: 'Cozy Librarian',
    },
    brutalCritic: {
      id: '6u6JbqKdaQy89ENzLSju',
      name: 'brutalCritic',
      displayName: 'The Gen Z',
    },
  } as const;
  
  export type CriticType = keyof typeof voiceMap;