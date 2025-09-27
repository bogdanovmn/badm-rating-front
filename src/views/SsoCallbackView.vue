<template>
  <div class="sso-callback">
    <div class="loading" v-if="isLoading">
      <div class="spinner"></div>
      <p>{{ statusMessage }}</p>
    </div>
    <div class="error" v-else-if="hasError">
      <h2>{{ statusMessage }}</h2>
      <p>{{ error }}</p>
      <button @click="goHome" class="btn-primary">Вернуться на главную</button>
    </div>
    <div class="success" v-else-if="isSuccess">
      <h2>{{ statusMessage }}</h2>
      <p>Перенаправление...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { SsoService } from "@bogdanovmn/ssofw";

// Composables
const router = useRouter();
const ssoService = new SsoService(import.meta.env.VITE_SSO_SERVICE_URL);
// Реактивное состояние
const isLoading = ref(true);
const error = ref<string | null>(null);
const redirectTimer = ref<number | null>(null);

// Вычисляемые свойства
const hasError = computed(() => error.value !== null);
const isSuccess = computed(() => !isLoading.value && !hasError.value);

const statusMessage = computed(() => {
  if (isLoading.value) return 'Обработка авторизации...';
  if (hasError.value) return 'Ошибка авторизации';
  return 'Успешная авторизация!';
});

// Методы
function extractUrlParams(): { code: string | null; error: string | null } {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    code: urlParams.get('code'),
    error: urlParams.get('error')
  };
}

function handleError(errorMessage: string): void {
  error.value = errorMessage;
  isLoading.value = false;
}

function handleSuccess(): void {
  // Устанавливаем таймер для перенаправления
  redirectTimer.value = window.setTimeout(() => {
    router.push('/');
  }, 1000);
  
  isLoading.value = false;
}

async function processCallback(): Promise<void> {
  try {
    const { code, error: errorParam } = extractUrlParams();

    if (errorParam) {
      handleError(decodeURIComponent(errorParam));
      return;
    }

    if (!code) {
      handleError('Код авторизации не получен от SSO сервера');
      return;
    }

    // Обмениваем код на JWT токен
    try {
      await ssoService.exchangeCodeToJwt(code);
      handleSuccess();
    } catch (exchangeError) {
      handleError('Ошибка при обмене кода на токен');
      console.error('Token exchange error:', exchangeError);
    }
  } catch (err) {
    handleError('Произошла ошибка при обработке авторизации');
    console.error('SSO callback error:', err);
  }
}

function goHome(): void {
  if (redirectTimer.value) {
    clearTimeout(redirectTimer.value);
  }
  router.push('/');
}

// Хуки жизненного цикла
onMounted(() => {
  processCallback();
});
</script>

<style scoped>
.sso-callback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 20px;
}

.loading {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0066cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  color: #d32f2f;
}

.error h2 {
  margin-bottom: 10px;
}

.success {
  text-align: center;
  color: #2e7d32;
}

.success h2 {
  margin-bottom: 10px;
}

.btn-primary {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #004c99;
}
</style>
