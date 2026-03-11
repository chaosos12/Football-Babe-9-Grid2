export enum GameState {
  IDLE = 'IDLE',
  BETTING = 'BETTING',
  PRE_SPIN = 'PRE_SPIN',
  FOOTBALL_FLY = 'FOOTBALL_FLY',
  SPINNING = 'SPINNING',
  RESULT = 'RESULT'
}

export enum RewardTier {
  NONE = 'NONE',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  BIG = 'BIG'
}

export interface GridItem {
  id: number;
  number: number;
  weight: number;
  tier: RewardTier;
}

export interface GameResult {
  item: GridItem;
  multiplier: number;
  winAmount: number;
  winningTiers?: Record<number, RewardTier>;
  wonIds?: number[];
}

export interface GameRecord {
  id: string;
  timestamp: number;
  gridSize: number;
  winningNumber: number;
  bets: Record<number, number>;
  totalBet: number;
  winAmount: number;
  isWin: boolean;
  videoUrl: string;
}
