<script setup lang="ts">
import Terminal from './components/Terminal.vue'
</script>

<template>
  <div class="main-layout">
    <h1>Tze Jiat's Termfolio</h1>
    <div class="container">
      <Terminal />
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding-top: 2rem;
}

.terminal-wrapper {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>
