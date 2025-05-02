import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { ApiError } from '@/api/common';
import { playerRatingHistory, playerSimilarities, playerTopContext, playerTopPositionHistory } from '@/api';
import { type Player, type RatingHistory, type HistoryPoints, Source, TopType, type PlayType, type TopPlayer } from '@/api';
import { TopKey } from '@/common';

export type SpecifiedRatingHistory = Map<Source, Map<PlayType, DataPoint[]>>;
export interface DataPoint {
  date: string;
  value: number;
}

export const playerStore = defineStore('player', () => {
  const selectedPlayer = ref<Player | null>(null);
  const selectedSource = ref<Source | null>(null);
  const selectedPlayType = ref<PlayType | null>(null);
  const ratingHistoryByPlayer = ref<Map<string, SpecifiedRatingHistory>>(new Map());
  const topPositionHistoryByPlayer = ref<Map<string, Map<string, DataPoint[]>>>(new Map());
  const similarByPlayer = ref<Map<string, Player[]>>(new Map());
  const topContextByPlayer = ref<Map<string, Map<string, TopPlayer[]>>>(new Map());
  const isLoading = ref<boolean>(false);
  const isTopContextLoading = ref<boolean>(false);
  const isTopPositionHistoryLoading = ref<boolean>(false);

  function selectPlayer(player: Player) {
    selectedPlayer.value = player;
    loadPlayerData(player.id)
  };

  function similarPlayers(): Player[] {
    return selectedPlayer.value == null
      ? []
      : similarByPlayer.value.get(selectedPlayer.value.id) || []
  }

  function ratingHistory(): SpecifiedRatingHistory {
    return selectedPlayer.value == null
      ? new Map()
      : ratingHistoryByPlayer.value.get(selectedPlayer.value.id) || new Map()
  }

  function topContext(topType: TopType): TopPlayer[] {
    if (selectedPlayer.value == null || selectedSource.value == null || selectedPlayType.value == null) {
      return [];
    } else {
      return topContextByPlayer.value.get(selectedPlayer.value.id)
        ?.get(
          new TopKey(topType, selectedSource.value, selectedPlayType.value).value()
        ) || []
    }
  }

  function topPositionHistory(topType: TopType): DataPoint[] {
    if (selectedPlayer.value == null || selectedSource.value == null || selectedPlayType.value == null) {
      return [];
    } else {
      return topPositionHistoryByPlayer.value.get(selectedPlayer.value.id)
        ?.get(
          new TopKey(topType, selectedSource.value, selectedPlayType.value).value()
        ) || []
    }
  }

  function setSourceFilter(source: Source | null, playType: PlayType | null) {
    selectedSource.value = source;
    selectedPlayType.value = playType;
  }

  function clearSourceFilter() {
    setSourceFilter(null, null);
  }

  async function loadPlayerData(playerId: string): Promise<void> {
    isLoading.value = true;
    return Promise.all([
      loadSimilarPlayers(playerId),
      loadRatingHistory(playerId)
    ]).then(() => {
      isLoading.value = false;
      return undefined;
    });
  }

  async function loadSimilarPlayers(playerId: string): Promise<void> {
    return similarByPlayer.value.has(playerId)
      ? Promise.resolve()
      : playerSimilarities(playerId)
        .then(function (players: Player[]) {
          similarByPlayer.value.set(playerId, players);
        })
        .catch(function (error: ApiError) {
          console.error(`Ошибка загрузки похожих игроков: ${error.message}, Статус: ${error.status}`);
          similarByPlayer.value.set(playerId, []);
        });
  }

  async function loadPlayerTopContext(): Promise<void> {
    isTopContextLoading.value = true;
    return Promise.all([
      loadPlayerTopContextByType(TopType.Actual),
      loadPlayerTopContextByType(TopType.Global)
    ]).then(() => {
      isTopContextLoading.value = false;
      return undefined;
    });
  }

  async function loadTopPositionHistory(): Promise<void> {
    isTopPositionHistoryLoading.value = true;
    return Promise.all([
      loadPlayerTopPositionHistory(TopType.Actual),
      loadPlayerTopPositionHistory(TopType.Global)
    ]).then(() => {
      isTopPositionHistoryLoading.value = false;
      return undefined;
    });
  }

  async function loadPlayerTopContextByType(topType: TopType): Promise<void> {
    if (selectedSource.value == null || selectedPlayType == null) {
      return Promise.resolve();
    }
    const key = new TopKey(topType, selectedSource.value, selectedPlayType.value!).value();
    const playerId = selectedPlayer.value!.id;
    if (!topContextByPlayer.value.has(playerId)) {
      topContextByPlayer.value.set(playerId, new Map());
    }
    return topContextByPlayer.value.get(playerId)!.has(key)
      ? Promise.resolve()
      : playerTopContext(playerId, topType, selectedSource.value, selectedPlayType.value!)
        .then(function (top: TopPlayer[]) {
          topContextByPlayer.value.get(playerId)!.set(key, top);
        })
        .catch(function (error: ApiError) {
          console.error(`Ошибка загрузки топ контекста игрока: ${error.message}, Статус: ${error.status}`);
          topContextByPlayer.value.get(playerId)!.set(key, []);
        });
  }

  async function loadPlayerTopPositionHistory(topType: TopType): Promise<void> {
    if (selectedSource.value == null || selectedPlayType == null) {
      return Promise.resolve();
    }
    const key = new TopKey(topType, selectedSource.value, selectedPlayType.value!).value();
    const playerId = selectedPlayer.value!.id;
    if (!topPositionHistoryByPlayer.value.has(playerId)) {
      topPositionHistoryByPlayer.value.set(playerId, new Map());
    }
    return topPositionHistoryByPlayer.value.get(playerId)!.has(key)
      ? Promise.resolve()
      : playerTopPositionHistory(playerId, topType, selectedSource.value, selectedPlayType.value!)
        .then(function (history: HistoryPoints) {
          topPositionHistoryByPlayer.value.get(playerId)!.set(key, sortedDataPoints(history));
        })
        .catch(function (error: ApiError) {
          topPositionHistoryByPlayer.value.get(playerId)!.delete(key);
        });
  }

  async function loadRatingHistory(playerId: string): Promise<void> {
    return playerRatingHistory(playerId)
      .then(function (rh: RatingHistory[]) {
        ratingHistoryByPlayer.value.set(playerId, new Map());
        const prh = ratingHistoryByPlayer.value.get(playerId)!;
        for (const r of rh) {
          if (!prh.has(r.source)) {
            prh.set(r.source, new Map());
          }
          prh.get(r.source)!.set(r.playType, sortedDataPoints(r.data));
        }
      })
      .catch(function (error: ApiError) {
        console.error(`Ошибка загрузки рейтингов игрока: ${error.message}, Статус: ${error.status}`);
        ratingHistoryByPlayer.value.set(playerId, new Map());
      });
  }

  function sortedDataPoints(points: HistoryPoints | null): DataPoint[] {
    return points === null
      ? []
      : Object.entries(points)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  return {
    selectedPlayer,
    ratingHistory,
    selectPlayer,
    similarPlayers,
    topContext,
    loadPlayerTopContext,
    topPositionHistory,
    loadTopPositionHistory,
    isLoading,
    isTopContextLoading,
    setSourceFilter,
    clearSourceFilter,
    selectedSource,
    selectedPlayType
  };
});