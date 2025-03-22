import axios from 'axios';

export interface Player {
  id: string;
  details: {
      name: string;
      year: number;
      region: string;
      rank: string;
  }
}

export interface Rating {
  playType: string;
  date: string;
  value: number;
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