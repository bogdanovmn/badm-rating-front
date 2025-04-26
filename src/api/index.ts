import { makeApiRequest } from './common'

export enum TopType {
  Global = 'global',
  Actual = 'actual',
}

export enum Source {
  RNBFJunior = 'RNBFJunior',
  RNBF = 'RNBF',
}

export enum PlayType {
  MS = 'MS',
  MD = 'MD',
  WS = 'WS',
  WD = 'WD',
  XD = 'XD',
}

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

export interface RatingHistoryPoints {
  [date: string]: number;
}

export interface RatingHistory {
  source: Source;
  playType: PlayType;
  data: RatingHistoryPoints;
}

export interface TopPlayers {
  player: Player;
  position: number;
  positionChange: number;
  rating: number;
  ratingChange: number;
  updatedAt: string;
}

// API-методы
export async function searchPlayers(term: string): Promise<Player[]> {
  return makeApiRequest<Player[]>('get', '/players', { term });
}

export async function playerSimilarities(playerId: string): Promise<Player[]> {
  return makeApiRequest<Player[]>('get', `/players/${playerId}/similarities`);
}

export async function playerRatingHistory(playerId: string): Promise<RatingHistory[]> {
  return makeApiRequest<RatingHistory[]>('get', `/players/${playerId}/rating-history`);
}

export async function playersTop(topType: TopType, source: Source, playType: PlayType): Promise<TopPlayers[]> {
  return makeApiRequest<TopPlayers[]>('get', `/top/${topType}`, { source, playType });
}