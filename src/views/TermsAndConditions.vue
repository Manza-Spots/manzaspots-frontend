<script setup>
import { useRouter } from 'vue-router'

import Button from '@/shared/components/Button.vue'
const router = useRouter()
</script>

<template>
  <h1>Términos y Condiciones</h1>
  <Button variant="outline" size="lg" @click="router.push('/')"> Home </Button>
</template>
