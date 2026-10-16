<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import ButtonComponent from '@/shared/components/ButtonComponent.vue'
import Textarea from '@/shared/components/Textarea.vue'
import { useToast } from '@/shared/composables/useToast'
import { spotsApi } from '@/features/spots/api/spotsApi'
import { mapSpot } from '@/features/spots/utils/spotMapper'

const { t } = useI18n()
const toast = useToast()

const spots = ref([])
const loading = ref(false)
const loadError = ref(false)

// Estado por spot: id en curso y formulario de rechazo abierto.
const busyId = ref(null)
const rejectingId = ref(null)
const reason = reactive({ text: '', error: '' })

async function load() {
  loading.value = true
  try {
    const raw = await spotsApi.getPendingSpots()
    spots.value = raw.map((s) => mapSpot(s, null))
    loadError.value = false
  } catch (error) {
    console.warn('No se pudieron cargar los spots pendientes', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const removeFromList = (id) => {
  spots.value = spots.value.filter((s) => s.id !== id)
}

const mapsUrl = ({ lat, lng }) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

async function approve(spot) {
  if (busyId.value) return
  busyId.value = spot.id
  try {
    await spotsApi.authorizeSpot(spot.id)
    removeFromList(spot.id)
    toast.success(t('moderation.approved'))
  } catch (error) {
    toast.error(error.message || t('common.errors.generic'))
  } finally {
    busyId.value = null
  }
}

function startReject(spot) {
  rejectingId.value = spot.id
  reason.text = ''
  reason.error = ''
}

async function confirmReject(spot) {
  if (busyId.value) return
  const text = reason.text.trim()
  if (!text) {
    reason.error = t('moderation.reasonRequired')
    return
  }
  busyId.value = spot.id
  try {
    await spotsApi.denySpot(spot.id, text)
    removeFromList(spot.id)
    rejectingId.value = null
    toast.success(t('moderation.rejected'))
  } catch (error) {
    toast.error(error.message || t('common.errors.generic'))
  } finally {
    busyId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="moderation">
    <p v-if="loading && !spots.length" class="state">{{ t('common.buttons.loading') }}</p>

    <div v-else-if="loadError" class="state">
      <Icon name="AlertCircle" :size="28" />
      <p>{{ t('common.errors.loadFailed') }}</p>
      <ButtonComponent variant="outline" size="sm" @click="load">
        {{ t('common.buttons.retry') }}
      </ButtonComponent>
    </div>

    <div v-else-if="!spots.length" class="state">
      <Icon name="CheckCircle" :size="28" />
      <p>{{ t('moderation.empty') }}</p>
    </div>

    <article v-for="spot in spots" :key="spot.id" class="pending">
      <img :src="spot.imageUrl" :alt="spot.name" class="pending-img" loading="lazy" />

      <div class="pending-body">
        <h4 class="pending-name">{{ spot.name }}</h4>
        <p v-if="spot.userName" class="pending-by">
          {{ t('moderation.by', { name: spot.userName }) }}
        </p>
        <p class="pending-desc">{{ spot.description }}</p>
        <a
          v-if="spot.location"
          class="pending-map"
          :href="mapsUrl(spot.location)"
          target="_blank"
          rel="noopener"
        >
          <Icon name="MapPin" :size="13" />
          {{ t('moderation.openMap') }}
        </a>

        <div v-if="rejectingId === spot.id" class="reject-form">
          <Textarea
            v-model="reason.text"
            :label="t('moderation.reasonLabel')"
            :placeholder="t('moderation.reasonPlaceholder')"
            :error="reason.error"
            :rows="2"
          />
          <div class="actions">
            <ButtonComponent variant="ghost" size="sm" @click="rejectingId = null">
              {{ t('common.buttons.cancel') }}
            </ButtonComponent>
            <ButtonComponent
              variant="danger"
              size="sm"
              :loading="busyId === spot.id"
              @click="confirmReject(spot)"
            >
              {{ t('moderation.reject') }}
            </ButtonComponent>
          </div>
        </div>

        <div v-else class="actions">
          <ButtonComponent
            variant="outline"
            size="sm"
            :disabled="busyId === spot.id"
            @click="startReject(spot)"
          >
            <Icon name="X" :size="16" />
            {{ t('moderation.reject') }}
          </ButtonComponent>
          <ButtonComponent
            variant="primary"
            size="sm"
            :loading="busyId === spot.id"
            @click="approve(spot)"
          >
            <Icon name="Check" :size="16" />
            {{ t('moderation.approve') }}
          </ButtonComponent>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.moderation {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) 0;
  margin: 0;
  color: var(--color-text-tertiary);
  text-align: center;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.state p {
  margin: 0;
}

.pending {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  overflow: hidden;
}

.pending-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

.pending-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
}

.pending-name {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-extrabold);
  color: var(--color-text-primary);
}

.pending-by {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.pending-desc {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

.pending-map {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--color-primary);
  text-decoration: none;
}

.reject-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
