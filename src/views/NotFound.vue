<script setup>
import { useRouter } from 'vue-router'

import Button from '@/shared/components/ButtonComponent.vue'
const router = useRouter()
</script>

<template>
  <h1>404 - Pagina no encontrada</h1>
  <Button variant="outline" size="lg" @click="router.push('/')"> Home </Button>
</template>
