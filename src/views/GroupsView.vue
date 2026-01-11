<template>
  <div class="groups-container">
    <h1>Мои списки</h1>

    <div class="add-group-section">
      <input
        v-model="newGroupName"
        @keyup.enter="createGroup"
        placeholder="Название нового списка"
        class="group-input"
        :disabled="store.isCreating || store.isLoading"
      />
      <div class="group-type-toggle">
        <button
          type="button"
          :class="{ active: newGroupType === GroupType.single }"
          @click="newGroupType = GroupType.single"
          title="Одиночный список"
        >
          <SingleGroupIcon :active="newGroupType === GroupType.single" />
        </button>
        <button
          type="button"
          :class="{ active: newGroupType === GroupType.pair }"
          @click="newGroupType = GroupType.pair"
          title="Парный список"
        >
          <PairGroupIcon :active="newGroupType === GroupType.pair" />
        </button>
      </div>

      <button
        @click="createGroup"
        :disabled="!newGroupName.trim() || store.isCreating"
        class="add-button"
      >
        {{ store.isCreating ? 'Создаём...' : 'Добавить список' }}
      </button>
    </div>

    <div v-if="createError" class="error-message">
      {{ createError }}
    </div>

    <div v-if="store.isLoading && store.list.length === 0" class="spinner-container">
      <div class="spinner"></div>
    </div>

    <div v-else-if="store.list.length === 0" class="empty-message">
      У вас пока нет ни одного списка игроков.<br/>
      Создайте первый!
    </div>

    <div v-else class="groups-list">
      <div
        v-for="group in store.allGroups()"
        :key="group.id"
        class="group-card"
      >
        <div class="group-type-icon">
          <SingleGroupIcon v-if="group.type === GroupType.single"/>
          <PairGroupIcon v-else/>
        </div>
        <div class="group-details">
          <div class="group-header">
            <div class="group-name" @click="showGroupPage(group)">
              {{ group.name }}
            </div>
          </div>
          <div class="group-players">
            игроков: <strong>{{ group.playersCount }}</strong>
          </div>
        </div>

        <div class="delete-wrapper">
          <button
            @click="confirmDelete(group)"
            class="delete-button"
            :disabled="store.isDeleting.has(group.id)"
            :title="store.isDeleting.has(group.id) ? 'Удаляется...' : 'Удалить список'"
          >
            <svg v-if="!store.isDeleting.has(group.id)" viewBox="0 0 24 24" class="close-icon">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <div v-else class="spinner-small"></div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { groupsStore } from '@/stores/groups'
import { GroupType, type Group } from '@/api'
import SingleGroupIcon from '@/components/icons/SingleGroupIcon.vue'
import PairGroupIcon from '@/components/icons/PairGroupIcon.vue'

const router = useRouter()
const store = groupsStore()

const newGroupName = ref('')
const newGroupType = ref<GroupType>(GroupType.single)
const createError = ref('')

function showGroupPage(group: Group) {
  router.push(`/groups/${group.id}`)
}

onMounted(() => {
  store.loadGroups()
})

const createGroup = async () => {
  const name = newGroupName.value.trim()
  if (!name) return

  createError.value = ''

  const newGroup = await store.addGroup(name, newGroupType.value)
  if (newGroup) {
    newGroupName.value = ''
  } else {
    createError.value = 'Не удалось создать список. Попробуйте позже.'
  }
}

const confirmDelete = (group: Group) => {
  if (!confirm(`Удалить список «${group.name}»?`)) return
  store.removeGroup(group.id)
}
</script>

<style scoped>
.groups-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}

h1 {
  text-align: center;
  margin-bottom: 28px;
  font-size: 1.8rem;
  color: #333;
}

.add-group-section {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
}

.group-input {
  padding: 10px 14px;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  flex: 1;
  min-width: 240px;
}

.add-button {
  padding: 10px 24px;
  font-size: 1rem;
  background-color: #FFE4B5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-button:hover:not(:disabled) {
  background-color: #ffcc80;
}

.add-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Переключатель типа */
.group-type-toggle {
  display: flex;
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  width: auto;
}

.group-type-toggle button {
  padding: 8px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  width: 52px;
}

.group-type-toggle button.active {
  background: #ffe082;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 15px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  transition: all 0.25s ease;
}

.group-details {
  flex: 1;
  min-width: 0;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.group-type-icon {
  flex-shrink: 0;
  padding-right: 15px;
}

.group-type-icon .type-icon {
  width: 20px;
  height: 20px;
  fill: #777;
}

.group-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.group-name:hover {
  text-decoration: underline;
}

.group-players {
  font-size: 0.95rem;
  color: #666;
}

.group-players strong {
  color: #806e0a;
}

.delete-wrapper {
  flex-shrink: 0;
}

.delete-button {
  width: 40px;
  height: 40px;
  background: white;
  border: 2px solid #ff6b6b;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.delete-button:hover:not(:disabled) {
  background: #fff5f5;
  border-color: #ff5252;
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
}

.delete-button:active:not(:disabled) {
  transform: scale(0.98);
}

.delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #ddd;
}

.close-icon {
  width: 18px;
  height: 18px;
  fill: #ff6b6b;
  transition: fill 0.2s;
}

.delete-button:hover:not(:disabled) .close-icon {
  fill: #ff5252;
}

.error-message {
  color: #d32f2f;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 8px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #ff6b6b;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .add-group-section {
    flex-direction: column;
    align-items: stretch;
  }
  .group-type-toggle {
    width: 160px;
    margin: 0 auto;
  }
  .group-type-toggle button {
    width: 80px;
    height: 40px;
  }
  .group-input,
  .add-button {
    width: 100%;
  }
}
</style>