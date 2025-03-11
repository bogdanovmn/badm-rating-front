<template>
  <div id="app">
    <header>
      <h1>Player Rating</h1>
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <p>&copy; 2025 Mikhail N Bogdanov</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Ничего не нужно в <script>, если нет дополнительной логики
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>