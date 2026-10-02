export interface ProgressData {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  totalDays: number;
  totalHours: number;
  cigarettesAvoided: number;
  packsNotSmoked: number;
  daysLifeSaved: number;
  moneySaved: number;
  healthImprovement: number;
  currentLevel: number;
}

export interface Challenge {
  level: number;
  title: string;
  description: string;
  icon: any; // Use `any` for SFSymbols names for now
  isUnlocked: (progress: ProgressData) => boolean;
}

export const challenges: Challenge[] = [
  { level: 1, title: '24 Hours', description: 'First day without a cigarette', icon: 'clock.fill', isUnlocked: (p) => p.totalHours >= 24 },
  { level: 2, title: '72 Hours', description: 'Nicotine is out of your system', icon: 'lungs.fill', isUnlocked: (p) => p.totalHours >= 72 },
  { level: 3, title: 'First Week', description: '7 days smoke-free', icon: 'calendar', isUnlocked: (p) => p.totalDays >= 7 },
  { level: 4, title: 'Money Saved', description: 'Saved your first $50', icon: 'dollarsign.circle.fill', isUnlocked: (p) => p.moneySaved >= 50 },
  { level: 5, title: 'Two Weeks', description: '14 days smoke-free', icon: 'calendar', isUnlocked: (p) => p.totalDays >= 14 },
  { level: 6, title: 'First Month', description: '30 days of freedom', icon: 'rosette', isUnlocked: (p) => p.totalDays >= 30 },
  { level: 7, title: 'Life Gained', description: 'You\'ve regained a full week of life', icon: 'heart.fill', isUnlocked: (p) => p.daysLifeSaved >= 7 },
  { level: 8, title: 'Health Milestone', description: 'Heart attack risk has dropped', icon: 'waveform.path.ecg', isUnlocked: (p) => p.totalDays >= 365 },
  // Add more challenges up to level 25
  { level: 25, title: 'Decade of Freedom', description: '10 years smoke-free!', icon: 'star.circle.fill', isUnlocked: (p) => p.totalDays >= 3650 },
];

export const getNextChallenge = (level: number): Challenge | null => {
  return challenges.find(c => c.level === level + 1) || null;
};

export const getCurrentLevel = (progress: ProgressData): number => {
  const unlockedChallenges = challenges.filter(c => c.isUnlocked(progress));
  return unlockedChallenges.length > 0 ? Math.max(...unlockedChallenges.map(c => c.level)) : 0;
}; 