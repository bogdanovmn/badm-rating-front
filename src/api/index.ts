import { makeApiRequest, authApi } from './common'

export enum TopType {
  Global = 'global',
  Actual = 'actual',
}

export enum YearGroup {
  U19 = 'U19',
  U17 = 'U17',
  U15 = 'U15',
  U13 = 'U13',
  All = 'ALL'
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

// API-методы
export async function searchPlayers(term: string): Promise<Player[]> {
  return makeApiRequest<Player[]>('get', '/players', { term });
}

export async function playerInfo(playerId: string): Promise<Player> {
  return makeApiRequest<Player>('get', `/players/${playerId}`);
}

export async function playerBriefStat(playerId: string): Promise<RatingState[]> {
  return makeApiRequest<RatingState[]>('get', `/players/${playerId}/rating-state`, { topType: TopType.Global });
}

export async function playerSimilarities(playerId: string): Promise<Player[]> {
  return makeApiRequest<Player[]>('get', `/players/${playerId}/similarities`);
}

export async function playerRatingHistory(playerId: string): Promise<RatingHistory[]> {
  return makeApiRequest<RatingHistory[]>('get', `/players/${playerId}/rating-history`);
}

export async function playersTop(topType: TopType, source: Source, playType: PlayType, yearGroup: YearGroup): Promise<TopPlayer[]> {
  return makeApiRequest<TopPlayer[]>('get', `/top/${topType}`, { source, playType, yearGroup });
}

export async function playerTopContext(playerId: string, topType: TopType, source: Source, playType: PlayType): Promise<TopPlayer[]> {
  return makeApiRequest<TopPlayer[]>('get', `/top/${topType}/context/${playerId}`, { source, playType });
}

export async function playerJuniorTopContext(playerId: string, playType: PlayType): Promise<TopPlayer[]> {
  return makeApiRequest<TopPlayer[]>('get', `/top/junior/context/${playerId}`, { playType });
}

export async function playerTopPositionHistory(playerId: string, topType: TopType, source: Source, playType: PlayType): Promise<HistoryPoints> {
  return makeApiRequest<HistoryPoints>('get', `/top/${topType}/position-history`, { playerId, source, playType });
}

// Группы

export enum GroupType {
  single = 'SINGLE',
  pair = 'PAIR'
}

export interface Group {
  id: string;
  name: string;
  type: GroupType;
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

export async function createGroup(name: string, type: GroupType): Promise<Group> {
  return authApi.post<Group>('/groups', { name, type });
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

// Pairs

export type PlayerPair = [string, string];

export async function groupPairs(id: string): Promise<PlayerPair[]> {
  return authApi.get<PlayerPair[]>(`/groups/${id}/pairs`);
}

export async function addPairToGroup(groupId: string, pair: PlayerPair): Promise<void> {
  return authApi.post<void>(`/groups/${groupId}/pairs`, { pair });
}

export async function removePairFromGroup(groupId: string, playerId: string): Promise<void> {
  return authApi.delete<void>(`/groups/${groupId}/pairs`, { playerId });
}