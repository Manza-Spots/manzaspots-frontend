<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'
import RecordMap from '@/features/map/components/RecordMap.vue'
import { useRouteRecorder } from '@/features/tracking/composables/useRouteRecorder'

const { t } = useI18n()

const mapRef = ref(null)
const {
  status,
  points,
  distanceKm,
  elevationM,
  formattedTime,
  lastTrack,
  isSim,
  start,
  pause,
  resume,
  finish,
  downloadTrack,
} = useRouteRecorder()

const statusLabel = () => {
  if (status.value === 'recording') return t('record.status.recording')
  if (status.value === 'paused') return t('record.status.paused')
  return t('record.status.ready')
}

const togglePause = () => {
  if (status.value === 'recording') pause()
  else resume()
}

const recenter = () => mapRef.value?.recenter()
</script>

<template>
  <div class="record-view">
    <div class="record-map">
      <RecordMap ref="mapRef" :points="points" />

      <div class="record-head">
        <span
          class="record-badge"
          :class="{
            'record-badge--live': status === 'recording',
            'record-badge--paused': status === 'paused',
          }"
        >
          <span v-if="status === 'recording'" class="record-badge__dot"></span>
          {{ statusLabel() }}
        </span>
        <span v-if="isSim" class="record-badge record-badge--sim">SIM</span>
        <button class="record-fab" @click="recenter">
          <Icon name="LocateFixed" :size="22" />
        </button>
      </div>
    </div>

    <div class="record-sheet">
      <div class="record-grabber"></div>

      <div class="record-stats">
        <div class="record-stat">
          <div class="record-stat__value">
            {{ distanceKm.toFixed(1) }}<small>km</small>
          </div>
          <div class="record-stat__key">
            <Icon name="Ruler" :size="13" />
            {{ t('record.stats.distance') }}
          </div>
        </div>
        <div class="record-stat">
          <div class="record-stat__value">
            {{ formattedTime.minutes }}<small>:{{ formattedTime.seconds }}</small>
          </div>
          <div class="record-stat__key">
            <Icon name="Clock" :size="13" />
            {{ t('record.stats.time') }}
          </div>
        </div>
        <div class="record-stat">
          <div class="record-stat__value">
            {{ elevationM }}<small>m</small>
          </div>
          <div class="record-stat__key">
            <Icon name="TrendingUp" :size="13" />
            {{ t('record.stats.elevation') }}
          </div>
        </div>
      </div>

      <div v-if="status === 'idle'" class="record-controls">
        <div class="record-ctrlwrap">
          <button class="record-stop record-start" @click="start">
            <Icon name="Play" :size="30" />
          </button>
          <div class="record-ctrl-label">{{ t('record.controls.start') }}</div>
        </div>
      </div>

      <div v-else class="record-controls">
        <div class="record-ctrlwrap">
          <button class="record-ctrl">
            <Icon name="Camera" :size="24" />
          </button>
          <div class="record-ctrl-label">{{ t('record.controls.photo') }}</div>
        </div>
        <div class="record-ctrlwrap">
          <button class="record-stop" @click="finish">
            <Icon name="Square" :size="28" />
          </button>
          <div class="record-ctrl-label">{{ t('record.controls.finish') }}</div>
        </div>
        <div class="record-ctrlwrap">
          <button class="record-ctrl" @click="togglePause">
            <Icon :name="status === 'paused' ? 'Play' : 'Pause'" :size="24" />
          </button>
          <div class="record-ctrl-label">
            {{ status === 'paused' ? t('record.controls.resume') : t('record.controls.pause') }}
          </div>
        </div>
      </div>

      <div v-if="status === 'idle' && lastTrack" class="record-export">
        <button class="record-export__btn" @click="downloadTrack('geojson')">
          <Icon name="Download" :size="15" />
          GeoJSON
        </button>
        <button class="record-export__btn" @click="downloadTrack('gpx')">
          <Icon name="Download" :size="15" />
          GPX
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.record-view {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  overflow: hidden;
}

.record-map {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.record-head {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: calc(var(--safe-area-inset-top) + var(--space-4)) var(--space-4) 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.record-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: var(--font-extrabold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

.record-badge--live {
  background: var(--color-coral);
  color: #fff;
}

.record-badge--paused {
  background: var(--color-arena);
  color: #fff;
}

.record-badge--sim {
  background: var(--color-primary);
  color: var(--color-on-primary);
  margin-right: auto;
  margin-left: var(--space-2);
}

.record-badge__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #fff;
  animation: blink 1.2s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.record-fab {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  border: 1px solid var(--hairline);
  box-shadow: var(--shadow-md);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--press-transition);
}

.record-fab:active {
  transform: scale(var(--press-scale-strong));
}

/* Sheet inferior con métricas y controles */
.record-sheet {
  position: relative;
  z-index: 30;
  margin-top: calc(var(--radius-2xl) * -1);
  background: var(--color-surface);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.1);
  padding: var(--space-2) var(--space-6) calc(110px + var(--safe-area-inset-bottom));
}

.record-grabber {
  width: 38px;
  height: 5px;
  border-radius: 3px;
  background: var(--color-border-hover);
  margin: var(--space-2) auto var(--space-1);
}

.record-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-2);
  padding: var(--space-4) 0;
}

.record-stat {
  text-align: center;
}

.record-stat__value {
  font-size: var(--text-3xl);
  font-weight: var(--font-extrabold);
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.record-stat__value small {
  font-size: 15px;
  font-weight: var(--font-bold);
  color: var(--color-text-secondary);
  margin-left: 2px;
}

.record-stat__key {
  font-size: 11px;
  font-weight: var(--font-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.record-controls {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-6);
  padding-top: var(--space-1);
}

.record-ctrlwrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.record-ctrl {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: var(--press-transition);
}

.record-ctrl:active {
  transform: scale(var(--press-scale));
}

.record-stop {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background: var(--color-coral);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 26px rgba(217, 84, 77, 0.4);
  cursor: pointer;
  transition: var(--press-transition);
}

.record-stop:active {
  transform: scale(var(--press-scale));
}

.record-start {
  background: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: 0 10px 26px rgba(31, 125, 79, 0.4);
}

.record-ctrl-label {
  font-size: 11px;
  font-weight: var(--font-bold);
  color: var(--color-text-tertiary);
  text-align: center;
  margin-top: 7px;
}

.record-export {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.record-export__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: var(--font-bold);
  color: var(--color-text-secondary);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 8px 16px;
  cursor: pointer;
  transition: var(--press-transition);
}

.record-export__btn:active {
  transform: scale(var(--press-scale));
}
</style>
