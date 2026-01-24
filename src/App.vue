<template>
  <div id="app">
    <nav class="navbar">
      <button class="menu-toggle" @click="toggleMenu" :title="isMenuOpen ? 'Закрыть меню' : 'Открыть меню'">
        <span class="menu-icon">{{ isMenuOpen ? '✕' : '☰' }}</span>
      </button>
      <div class="nav-links" :class="{ 'nav-links--open': isMenuOpen }">
        <RouterLink to="/player" @click="closeMenu">Игрок</RouterLink>
        <RouterLink to="/top" @click="closeMenu">ТОП</RouterLink>
        <RouterLink v-if="auth.isAuthenticated" to="/groups" @click="closeMenu">Мои списки</RouterLink>
        <RouterLink to="/about" @click="closeMenu">О проекте</RouterLink>
      </div>
      <div class="nav-auth">
        {{ auth.userName || 'Гость' }}
        <button 
          :class="authButtonConfig.class"
          :title="authButtonConfig.title"
          @click="handleAuthAction"
        >
        </button>
      </div>
    </nav>
    <div class="content">
      <router-view />
    </div>
    <footer class="footer">
      <div class="footer-content">
        <p class="copyright">© 2025-{{ currentYear }} Mikhail N Bogdanov</p>
        <p class="contact">Обратная связь: TG @bogdanovmn</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { SsoService } from '@bogdanovmn/ssofw';
import { computed, ref, inject, onMounted } from 'vue';
import { authStore } from '@/stores/auth';
import { logout } from '@/logout';

const router = useRouter();
const ssoService = inject<SsoService>('ssoService')!;
const auth = authStore();
const currentYear = ref(new Date().getFullYear());
const isMenuOpen = ref(false);

const authButtonConfig = computed(() => ({
  title: auth.isAuthenticated ? 'Выйти' : 'Войти',
  class: auth.isAuthenticated ? 'auth-btn logout-btn' : 'auth-btn login-btn'
}));

function handleAuthAction(): void {
  if (auth.isAuthenticated) {
    logout(ssoService);
    router.push('/player');
  } else {
    login();
  }
}

function login(): void {
  router.push('/login');
}

function toggleMenu(): void {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu(): void {
  isMenuOpen.value = false;
}

// Инициализация состояния при монтировании
onMounted(() => {
  auth.update();
});
</script>

<style scoped>

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #151e27;
  background-color: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.nav-links {
  display: flex;
}

.navbar a {
  margin-right: 20px;
  text-decoration: none;
  color: #0066cc;
  font-weight: 600;
  padding: 5px;
  transition: color 0.3s ease;
}

.nav-auth {
  display: flex;
  align-items: center;
}

.auth-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  transition: background-color 0.3s ease;
}

.login-btn {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%230066cc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4'/%3E%3Cpolyline points='10,17 15,12 10,7'/%3E%3Cline x1='15' y1='12' x2='3' y2='12'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 20px;
}

.logout-btn {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23d32f2f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/%3E%3Cpolyline points='16,17 21,12 16,7'/%3E%3Cline x1='21' y1='12' x2='9' y2='12'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 20px;
}

.auth-btn:hover {
  background-color: #f8f9fa;
}

.navbar .router-link-exact-active {
  color: #f2f4f5;
  background-color: #004c99;
  padding: 5px;
  border-radius: 10px;
  transition: color 0.3s ease;
}

.content {
  flex: 1 0 auto;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 10px;
}

.footer {
  flex-shrink: 0;
  padding: 10px 0;
  margin-top: 10px;
  background-color: #f5f5f5;
  border-top: 1px solid #e5e5e5;
  width: 100%;
}

.footer-content {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 0 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  color: #8fa1ac;
}

.copyright {
  margin: 5px 0;
  font-size: 14px;
}

.contact {
  margin: 5px 0;
  font-size: 14px;
  text-align: right;
}

.footer a {
  color: #0066cc;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer a:hover {
  color: #004c99;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  padding: 8px;
}

.menu-icon {
  color: #0066cc;
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }

  .content {
    padding: 0px 10px;
  }

  .nav-links {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    background-color: #ffffff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    padding: 15px;
    z-index: 1000;
  }

  .nav-links--open {
    display: flex;
  }

  .navbar a {
    margin: 10px 0;
    width: 100%;
    text-align: left;
  }

  .nav-auth {
    margin-left: auto;
  }

  .footer-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .contact {
    text-align: center;
  }
}
</style>