<template>
  <div v-if="isLoading" class="spinner-container">
    <div class="spinner"></div>
  </div>
  <div v-else-if="topPlayers.length" class="players-list">
      <div
        v-for="item in topPlayers"
        :key="item.player.id"
        class="player-row"
        :class="{
          'row-gold': item.position === 1,
          'row-silver': item.position === 2,
          'row-bronze': item.position === 3,
          'row-selected': selectedPlayer?.id === item.player.id
        }"
      >
        <div class="player-info">
          <span
            class="position-badge"
            :class="{
              'position-gold': item.position === 1,
              'position-silver': item.position === 2,
              'position-bronze': item.position === 3
            }"
          >
            {{ item.position }}
          </span>
          <span class="player-name" @click="showPlayerPage(item.player)">{{ item.player.details.name }}</span>
          <span
            v-if="item.positionChange !== 0"
            class="change-badge"
            :class="{
              'change-positive': item.positionChange > 0,
              'change-negative': item.positionChange < 0
            }"
          >
            {{ changeValueFormatted(item.positionChange) }}
          </span>
          <div class="rating-container">
            <span
              v-if="item.ratingChange !== 0"
              class="change-badge"
              :class="{
                'change-positive': item.ratingChange > 0,
                'change-negative': item.ratingChange < 0
              }"
            >
              {{ changeValueFormatted(item.ratingChange) }}
            </span>
            <span
              class="rating"
              :class="{
                'rating-gold': item.position === 1,
                'rating-silver': item.position === 2,
                'rating-bronze': item.position === 3
              }"
            >
              {{ item.rating }}
            </span>
          </div>
        </div>
        <div class="player-badges">
          <span class="badge">{{ item.player.details.year }}</span>
          <span class="badge badge-secondary">{{ item.player.details.region }}</span>
          <span v-if="item.player.details.rank !== 'NO_RANK'" class="badge badge-secondary">
            {{ item.player.details.rank }}
          </span>
          <span v-if="topType === TopType.Global" class="badge badge-secondary badge-date">
            {{ formatDate(item.updatedAt) }}
          </span>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { playerStore } from '@/stores/player';
import { type Player, type TopPlayer, TopType } from '@/api';
import { formatDate } from '@/common';

const props = defineProps<{
  topPlayers: TopPlayer[];
  topType: TopType;
  selectedPlayer: Player | null;
  isLoading: boolean;
}>();

const router = useRouter();
const pStore = playerStore();

const changeValueFormatted = (change: number): string => {
  if (change > 0) return `↑ ${change}`;
  if (change < 0) return `↓ ${Math.abs(change)}`;
  return '';
};

function showPlayerPage(player: Player) {
  pStore.selectPlayer(player); 
  router.push("/player");
}

</script>

<style scoped>
.players-list {
  max-width: 800px;
  margin: 0 auto;
}

.player-row {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.row-gold {
  background-color: #fffffb;
}

.row-silver {
  background-color: #fdfeff;
}

.row-bronze {
  background-color: #fffbf8;
}

.row-selected {
  background-color: #fffdf8;
  border: 2px solid #927a4e;
  border-radius: 14px;
}

.player-info {
  display: flex;
  align-items: center;
  width: 100%;
  flex-wrap: nowrap;
  gap: 12px;
}

.position-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: #FFFFFF;
  border: 1px solid #69747e;
  color: #151e27;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 500;
}

.position-gold {
  background-color: #FFECB3;
  color: #D4A017;
  border: none;
  font-weight: 700;
}

.position-silver {
  background-color: #E2E8F0;
  color: #64748B;
  border: none;
  font-weight: 700;
}

.position-bronze {
  background-color: #F4C7AB;
  color: #9C4B1F;
  border: none;
  font-weight: 700;
}

.player-name {
  font-size: 1.2rem;
  font-weight: 500;
  color: #151e27;
  cursor: pointer;
}

.player-name:hover {
  text-decoration: underline;
}

.rating-container {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.rating {
  font-size: 1rem;
  font-weight: 500;
  color: #151e27;
}

.rating-gold {
  color: #D4A017;
  font-weight: 700;
}

.rating-silver {
  color: #64748B;
  font-weight: 700;
}

.rating-bronze {
  color: #9C4B1F;
  font-weight: 700;
}

.change-badge {
  padding: 6px;
  border-radius: 8px;
  font-size: 0.625rem;
  font-weight: 500;
}

.change-positive {
  background-color: #f6fff9;
  color: #7db9a1;
}

.change-negative {
  background-color: #fdf7f7;
  color: #b87878;
}

.player-badges {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
  margin-left: 40px;
}

.badge {
  background-color: #F0F4F8;
  color: #151e27;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-secondary {
  background-color: #F8FAFC;
  color: #CBD5E1;
}

.badge-date {
  margin-left: auto;
}

@media (max-width: 768px) {
  .player-info {
    gap: 8px;
  }

  .position-badge {
    width: 24px;
    height: 24px;
    font-size: 0.8rem;
  }

  .player-name {
    font-size: 1.1rem;
  }

  .rating {
    font-size: 0.9rem;
  }

  .player-badges {
    margin-left: 32px;
  }
}
</style>