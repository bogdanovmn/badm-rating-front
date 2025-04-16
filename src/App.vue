<template>
  <div id="app">
    <nav class="navbar">
      <RouterLink to="/">Рейтинг</RouterLink>
      <RouterLink to="/about">О проекте</RouterLink>
    </nav>
    <div class="content">
      <router-view />
    </div>
    <footer class="footer">
      <div class="footer-content">
        <p class="copyright">© {{ new Date().getFullYear() }} Mikhail N Bogdanov</p>
        <p class="contact">Обратная связь: TG @bogdanovmn</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<style scoped>
/* Нормализация стилей */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden; /* Предотвращаем горизонтальный скролл */
}

#app {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
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
}

.navbar a {
  margin-right: 20px;
  text-decoration: none;
  color: #0066cc;
  font-weight: 600;
  transition: color 0.3s ease;
}

.navbar a:hover {
  color: #004c99;
}

.content {
  flex: 1 0 auto; /* Растягивает контент, толкает футер вниз */
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}

.footer {
  flex-shrink: 0; /* Футер не сжимается */
  padding: 10px 0;
  background-color: #f5f5f5;
  border-top: 1px solid #e5e5e5;
  width: 100%;
}

.footer-content {
  max-width: 1280px; /* Соответствует ширине контента */
  width: 100%;
  margin: 0 auto;
  padding: 0 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
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

@media (max-width: 768px) {
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