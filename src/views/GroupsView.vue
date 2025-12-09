<template>
  <div class="groups-container">
    <h1>Мои группы</h1>

    <div class="add-group-section">
      <input
        v-model="newGroupName"
        @keyup.enter="createGroup"
        placeholder="Название новой группы"
        class="group-input"
        :disabled="store.isCreating || store.isLoading"
      />
      <button
        @click="createGroup"
        :disabled="!newGroupName.trim() || store.isCreating"
        class="add-button"
      >
        {{ store.isCreating ? 'Создаём...' : 'Добавить группу' }}
      </button>
    </div>

    <div v-if="createError" class="error-message">
      {{ createError }}
    </div>

    <div v-if="store.isLoading && store.list.length === 0" class="spinner-container">
      <div class="spinner"></div>
    </div>

    <div v-else-if="store.list.length === 0" class="empty-message">
      У вас пока нет ни одной группы.<br>
      Создайте первую — и добавляйте в неё игроков!
    </div>

    <div v-else class="groups-list">
      <div
        v-for="group in store.allGroups()"
        :key="group.id"
        class="group-card"
      >
        <div class="group-details">
          <div class="group-name">{{ group.name }}</div>
          <div class="group-players">
            игроков: <strong>{{ group.playersCount }}</strong>
          </div>
        </div>

        <div class="delete-wrapper">
          <button
            @click="confirmDelete(group)"
            class="delete-button"
            :disabled="store.isDeleting.has(group.id)"
            :title="store.isDeleting.has(group.id) ? 'Удаляется...' : 'Удалить группу'"
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
import { groupsStore } from '@/stores/groups'
import type { Group } from '@/api'

const store = groupsStore()
const newGroupName = ref('')
const createError = ref('')

onMounted(() => {
  store.loadGroups()
})

const createGroup = async () => {
  const name = newGroupName.value.trim()
  if (!name) return

  createError.value = ''

  const newGroup = await store.addGroup(name)
  if (newGroup) {
    newGroupName.value = ''
  } else {
    createError.value = 'Не удалось создать группу. Попробуйте другое название или позже.'
  }
}

const confirmDelete = (group: Group) => {
  if (!confirm('Удалить группу «' + group.name + '»?\nВсе игроки будут удалены из списка.')) {
    return
  }
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
  margin-bottom: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.group-input {
  padding: 10px 14px;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  flex: 1;
  min-width: 240px;
  max-width: 420px;
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

/* Ошибка под кнопкой */
.error-message {
  color: #d32f2f;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 8px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
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
  padding: 18px 22px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  transition: all 0.25s ease;
  gap: 16px;
}

.delete-wrapper {
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.group-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.group-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-players {
  font-size: 0.95rem;
  color: #666;
}

.group-players strong {
  color: #806e0a;
}

/* Мусорный бак */
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

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #ff6b6b;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-message {
  text-align: center;
  color: #888;
  font-size: 1.15rem;
  padding: 60px 20px;
  line-height: 1.5;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .add-group-section {
    flex-direction: column;
    align-items: stretch;
  }
  .group-input {
    max-width: none;
  }
  .group-card {
    padding: 16px 18px;
  }
}
</style>