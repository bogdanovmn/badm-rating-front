<template>
    <svg
      viewBox="0 0 32 24"
      class="type-icon"
      :class="{ 'active': active }"
      v-bind="$attrs"
    >
      <!-- Левый человечек -->
      <circle cx="8" cy="7" r="4" />
      <path d="M2 21c0-3.31 2.69-6 6-6s6 2.69 6 6H2z" />
      <!-- Правый человечек -->
      <circle cx="24" cy="7" r="4" />
      <path d="M18 21c0-3.31 2.69-6 6-6s6 2.69 6 6H18z" />
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