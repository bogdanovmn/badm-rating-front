import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  groups,
  createGroup,
  deleteGroup,
  groupsForPlayer,
  addPlayerToGroup,
  type Group,
  GroupType,
} from '@/api'

export const groupsStore = defineStore('groups', () => {
  const list = ref<Group[]>([])
  const isLoading = ref(false)
  const isCreating = ref(false)
  const isDeleting = ref<Set<string>>(new Set())

  function loadGroups(): Promise<Group[]> {
    if (list.value.length > 0) {
      return Promise.resolve(list.value)
    }

    isLoading.value = true
    return groups()
      .then(data => {
        list.value = data
        return data
      })
      .catch(err => {
        console.error('Ошибка загрузки групп:', err)
        list.value = []
        return []
      })
      .finally(() => {
        isLoading.value = false
      })
  }

  function addGroup(name: string, type: GroupType): Promise<Group | null> {
    const trimmed = name.trim()
    if (!trimmed) return Promise.resolve(null)

    isCreating.value = true
    return createGroup(trimmed, type)
      .then(newGroup => {
        list.value.push(newGroup)
        return newGroup
      })
      .catch(err => {
        console.error('Ошибка создания группы:', err)
        return null
      })
      .finally(() => {
        isCreating.value = false
      })
  }

  function removeGroup(id: string): Promise<boolean> {
    if (isDeleting.value.has(id)) return Promise.resolve(false)

    isDeleting.value.add(id)
    return deleteGroup(id)
      .then(() => {
        list.value = list.value.filter(g => g.id !== id)
        return true
      })
      .catch(err => {
        console.error('Ошибка удаления группы:', err)
        return false
      })
      .finally(() => {
        isDeleting.value.delete(id)
      })
  }

  function loadGroupsForPlayer(playerId: string): Promise<Group[]> {
    return groupsForPlayer(playerId).catch(err => {
      console.error('Ошибка загрузки групп для игрока:', err)
      return []
    })
  }

  function addPlayerToGroupSafe(groupId: string, playerId: string): Promise<boolean> {
    return addPlayerToGroup(groupId, playerId)
      .then(() => true)
      .catch(err => {
        console.error('Не удалось добавить игрока в группу:', err)
        return false
      })
  }

  // === Геттеры ===
  const allGroups = () => list.value
  const hasGroups = () => list.value.length > 0

  return {
    list,
    isLoading,
    isCreating,
    isDeleting,

    allGroups,
    hasGroups,

    loadGroups,
    addGroup,
    removeGroup,
    loadGroupsForPlayer,
    addPlayerToGroupSafe,
  }
})