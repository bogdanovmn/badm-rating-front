<template>
    <svg
      viewBox="0 0 24 24"
      class="type-icon"
      :class="{ 'active': active }"
      v-bind="$attrs"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21c0-4.97 4.03-9 9-9s9 4.03 9 9H4z" />
    </svg>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    active?: boolean
  }>()
  </script>
  
  <style scoped>
  .type-icon {
    width: 28px;
    height: 28px;
    fill: #555;
    transition: fill 0.2s;
  }
  
  .type-icon.active {
    fill: #d68900;
  }
  </style>