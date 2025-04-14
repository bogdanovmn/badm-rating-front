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
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #151e27; /* Темный текст, как у Ollama */
  background-color: #FFFFFF; /* Белый фон, как у Ollama */
  min-height: 100vh; /* Полная высота viewport */
  display: flex;
  flex-direction: column;
}

.navbar {
  padding: 15px;
}

.navbar a {
  margin-right: 20px;
  text-decoration: none;
  color: #0066CC; /* Цвет ссылок, как у Ollama */
  font-weight: 600;
  transition: color 0.3s ease;
}

.navbar a:hover {
  color: #004C99; /* Затемнение при наведении */
}

.content {
  flex: 1 0 auto; /* Контент растягивается, толкает футер вниз */
  max-width: 1280px; /* Центрирование контента */
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.footer {
  flex-shrink: 0; /* Футер не сжимается */
  padding: 20px;
  background-color: #F5F5F5; /* Светлый фон футера */
  border-top: 1px solid #E5E5E5;
  width: 100%;
}

.footer-content {
  margin: 0 auto;
  padding: 0 15px;
  display: flex;
  justify-content: space-between; /* Копирайт слева, контакты справа */
  align-items: center;
  flex-wrap: wrap; /* Адаптивность для узких экранов */
}

.copyright {
  margin: 5px 0;
  font-size: 14px;
}

.contact {
  margin: 5px 0;
  font-size: 14px;
  text-align: right; /* Для выравнивания текста внутри блока */
}

.footer a {
  color: #0066CC;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer a:hover {
  color: #004C99;
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