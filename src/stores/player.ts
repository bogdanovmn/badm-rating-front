import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { ApiError } from '@/api/common';
import { playerRatingHistory, playerSimilarities } from '@/api';
import type { Player, RatingHistory, RatingHistoryPoints, Source, PlayType } from '@/api';

export type SpecifiedRatingHistory = Map<Source, Map<PlayType, RatingHistoryPoints>>;

export const playerStore = defineStore('player', () => {
  const selectedPlayer = ref<Player | null>(null);
  const ratingHistoryByPlayer = ref<Map<string, SpecifiedRatingHistory>>(new Map());
  const similarByPlayer = ref<Map<string, Player[]>>(new Map());
  const isLoading = ref<boolean>(false);

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

  async function loadPlayerData(playerId: string): Promise<void> {
    isLoading.value = true;
    return Promise.all([
      loadSimilarPlayers(playerId),
      loadRatingHistory(playerId),
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

  async function loadRatingHistory(playerId: string): Promise<void> {
    return playerRatingHistory(playerId)
      .then(function (rh: RatingHistory[]) {
        ratingHistoryByPlayer.value.set(playerId, new Map());
        const prh = ratingHistoryByPlayer.value.get(playerId)!;
        for (const r of rh) {
          if (!prh.has(r.source)) {
            prh.set(r.source, new Map());
          }
          prh.get(r.source)!.set(r.playType, r.data);
        }
      })
      .catch(function (error: ApiError) {
        console.error(`Ошибка загрузки рейтингов игрока: ${error.message}, Статус: ${error.status}`);
        ratingHistoryByPlayer.value.set(playerId, new Map());
      });
  }

  return {
    selectedPlayer,
    ratingHistory,
    selectPlayer,
    similarPlayers,
    isLoading
  };
});