<template>
  <div id="app">
    <header>
      <h1>Player Rating App</h1>
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <p>&copy; 2025 Your Name</p>
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

header {
  background-color: #42a5f5;
  color: white;
  padding: 1rem;
}

main {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

footer {
  padding: 1rem;
  text-align: center;
  background-color: #f8f9fa;
  position: fixed;
  bottom: 0;
  width: 100%;
}
</style>