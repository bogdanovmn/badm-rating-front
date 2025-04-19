import axios from 'axios';

export interface Player {
  id: string;
  importId: number;
  details: {
    name: string;
    year: number;
    region: string;
    rank: string;
  };
}

export interface Rating {
  source: string;
  playType: string;
  data: {
    [date: string]: number;
  };
}

export interface TopPlayerData {
  player: Player;
  position: number;
  rating: number;
  updatedAt: string;
}

export interface TopPlayerGroup {
  type: string;
  source: string;
  data: TopPlayerData[];
}

const apiUrl = import.meta.env.VITE_API_URL;
console.log('API URL:', apiUrl);

const api = axios.create({
  baseURL: apiUrl,
});

export const searchPlayers = (term: string) =>
  api.get('/players', { params: { term } });

export const getPlayerRatings = (playerId: string) =>
  api.get(`/players/${playerId}`);

export const getTopPlayers = () =>
  api.get('/players/statistic/top');

export const getTopActualPlayers = () =>
  api.get('/players/statistic/actual-top');