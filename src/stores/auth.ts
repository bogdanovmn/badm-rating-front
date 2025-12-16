import { defineStore } from 'pinia';
import { ref } from 'vue';
import { tokenStorage } from '@bogdanovmn/ssofw';

export const authStore = defineStore('authStore', () => {
  const isAuthenticated = ref(false);
  const userName = ref<string | null>(null);

  function update() {
    isAuthenticated.value = tokenStorage.defined();
    userName.value = tokenStorage.claims?.userName || null;
  }

  return {
    isAuthenticated,
    userName,
    update
  };
});