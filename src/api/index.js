import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

export const searchPlayers = (term) =>
  api.get('/players', { params: { term } });

export const getPlayerRatings = (playerId) =>
  api.get(`/players/${playerId}`);