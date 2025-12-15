import { makeApiRequest, authApi } from './common'

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
  importId?: number;
  details?: {
    name: string;
    year: number;
    region: string;
    rank: string;
  };
}

export interface HistoryPoints {
  [date: string]: number;
}

export interface RatingHistory {
  source: Source;
  playType: PlayType;
  data: HistoryPoints;
}

export interface RatingSnapshot {
  position: number;
  positionChange: number;
  rating: number;
  ratingChange: number;
  updatedAt: string;
}

export interface TopPlayer {
  player: Player;
  ratingSnapshot?: RatingSnapshot;
}

export interface RatingState {
  source: Source,
  playType: PlayType,
  ratingSnapshot: RatingSnapshot;
}


function randomDelay(min: number, max: number): Promise<void> {
    // Генерируем случайное число между min (включительно) и max (исключительно)
    const randomSeconds = Math.random() * (max - min) + min;
    // Переводим секунды в миллисекунды для setTimeout
    const delayMs = randomSeconds * 1000;

    console.log(`Задержка составит примерно ${delayMs.toFixed(0)} мс`);

    return new Promise(resolve => {
        setTimeout(resolve, delayMs);
    });
}

// API-методы
export async function searchPlayers(term: string): Promise<Player[]> {
  return makeApiRequest<Player[]>('get', '/players', { term });
}

export async function playerInfo(playerId: string): Promise<Player> {
  return makeApiRequest<Player>('get', `/players/${playerId}`);
}

export async function playerBriefStat(playerId: string): Promise<RatingState[]> {
  await randomDelay(1, 2)
  return makeApiRequest<RatingState[]>('get', `/players/${playerId}/rating-state`, { topType: TopType.Actual });
}

export async function playerSimilarities(playerId: string): Promise<Player[]> {
  return makeApiRequest<Player[]>('get', `/players/${playerId}/similarities`);
}

export async function playerRatingHistory(playerId: string): Promise<RatingHistory[]> {
  return makeApiRequest<RatingHistory[]>('get', `/players/${playerId}/rating-history`);
}

export async function playersTop(topType: TopType, source: Source, playType: PlayType): Promise<TopPlayer[]> {
  return makeApiRequest<TopPlayer[]>('get', `/top/${topType}`, { source, playType });
}

export async function playerTopContext(playerId: string, topType: TopType, source: Source, playType: PlayType): Promise<TopPlayer[]> {
  return makeApiRequest<TopPlayer[]>('get', `/top/${topType}/context/${playerId}`, { source, playType });
}

export async function playerTopPositionHistory(playerId: string, topType: TopType, source: Source, playType: PlayType): Promise<HistoryPoints> {
  return makeApiRequest<HistoryPoints>('get', `/top/${topType}/position-history`, { playerId, source, playType });
}

// Группы

export interface Group {
  id: string;
  name: string;
  playersCount: number;
}

export async function groups(): Promise<Group[]> {
  return authApi.get<Group[]>('/groups');
}

export async function groupById(id: string): Promise<Group> {
  return authApi.get<Group>(`/groups/${id}`);
}

export async function groupsForPlayer(playerId: string): Promise<Group[]> {
  return authApi.get<Group[]>('/groups', { playerId });
}

export async function createGroup(name: string): Promise<Group> {
  return authApi.post<Group>('/groups', { name });
}

export async function deleteGroup(id: string): Promise<void> {
  return authApi.delete<void>(`/groups/${id}`);
}

export async function groupPlayers(groupId: string): Promise<string[]> {
  return authApi.get<string[]>(`/groups/${groupId}/players`);
}

export async function addPlayerToGroup(groupId: string, playerId: string): Promise<void> {
  return authApi.post<void>(`/groups/${groupId}/players`, { playerId });
}

export async function removePlayerFromGroup(groupId: string, playerId: string): Promise<void> {
  return authApi.delete<void>(`/groups/${groupId}/players/${playerId}`);
}