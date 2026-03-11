import { GameRecord } from '../types';

const API_BASE_URL = '/api';

export const apiService = {
  /**
   * Fetch the user's current balance
   */
  async getBalance(): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/balance`);
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  },

  /**
   * Fetch the user's game history
   */
  async getHistory(): Promise<GameRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/game/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      return data.history;
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  },

  /**
   * Play a game round
   * @param bets The user's bets { [number]: amount }
   * @param gridSize The size of the grid (9, 16, 32)
   */
  async playGame(bets: Record<number, number>, gridSize: number): Promise<{
    success: boolean;
    result: {
      winningNumber: number;
      isWin: boolean;
      winAmount: number;
      newBalance: number;
    };
    record: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/game/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bets, gridSize }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to play game');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error playing game:', error);
      return {
        success: false,
        result: { winningNumber: 0, isWin: false, winAmount: 0, newBalance: 0 },
        record: null,
        error: error.message || 'Network error'
      };
    }
  }
};
