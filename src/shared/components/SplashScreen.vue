<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['done'])

const isHiding = ref(false)

onMounted(() => {
  setTimeout(() => { isHiding.value = true }, 2400)
  setTimeout(() => { emit('done') }, 2950)
})
</script>

<template>
  <div class="splash" :class="{ 'splash--out': isHiding }">
    <div class="splash__bg" />
    <div class="splash__overlay" />
    <div class="splash__content">
      <span class="splash__title">ManzaSpots</span>
    </div>
  </div>
</template>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 550ms cubic-bezier(0.4, 0, 1, 1),
    transform 550ms cubic-bezier(0.4, 0, 1, 1);
}

.splash--out {
  opacity: 0;
  transform: scale(1.14);
  pointer-events: none;
}

.splash__bg {
  position: absolute;
  inset: 0;
  background-image: url('@/assets/img/img2.jpeg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.splash__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.28) 0%,
    rgba(0, 0, 0, 0.18) 50%,
    rgba(0, 0, 0, 0.52) 100%
  );
}

.splash__content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash__title {
  font-family: var(--font-sans);
  font-size: 3rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.03em;
  text-shadow:
    0 2px 20px rgba(0, 0, 0, 0.55),
    0 1px 4px rgba(0, 0, 0, 0.35);
}
</style>
