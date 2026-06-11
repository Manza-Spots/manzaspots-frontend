<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/shared/components/Icon.vue'

const { t } = useI18n()

const status = ref('idle') // idle | recording | paused
const elapsedSeconds = ref(0)
const distanceKm = ref(0)
const elevationM = ref(0)

let timer = null

const startTimer = () => {
  timer = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

const stopTimer = () => {
  clearInterval(timer)
  timer = null
}

const startRecording = () => {
  status.value = 'recording'
  startTimer()
}

const togglePause = () => {
  if (status.value === 'recording') {
    status.value = 'paused'
    stopTimer()
  } else {
    status.value = 'recording'
    startTimer()
  }
}

const finishRecording = () => {
  status.value = 'idle'
  stopTimer()
  elapsedSeconds.value = 0
  distanceKm.value = 0
  elevationM.value = 0
}

onBeforeUnmount(stopTimer)

const formattedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  return { minutes: String(m), seconds: String(s).padStart(2, '0') }
})

const statusLabel = computed(() => {
  if (status.value === 'recording') return t('record.status.recording')
  if (status.value === 'paused') return t('record.status.paused')
  return t('record.status.ready')
})
</script>

<template>
  <div class="record-view">
    <div class="record-map">
      <div class="map-land map-land--a"></div>
      <div class="map-land map-land--b"></div>
      <div class="map-sea"></div>

      <svg
        v-if="status !== 'idle'"
        class="record-trace"
        viewBox="0 0 278 360"
        preserveAspectRatio="none"
      >
        <path
          d="M70 330 C 90 280, 60 230, 110 200 S 170 150, 150 110 S 120 70, 175 55"
          fill="none"
          stroke="var(--color-primary)"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.95"
        />
        <circle cx="70" cy="330" r="8" fill="var(--color-primary)" stroke="var(--color-bg)" stroke-width="3" />
        <circle cx="175" cy="55" r="9" fill="#fff" stroke="var(--color-primary)" stroke-width="4" />
      </svg>

      <div class="record-head">
        <span
          class="record-badge"
          :class="{
            'record-badge--live': status === 'recording',
            'record-badge--paused': status === 'paused',
          }"
        >
          <span v-if="status === 'recording'" class="record-badge__dot"></span>
          {{ statusLabel }}
        </span>
        <button class="record-fab">
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
          <button class="record-stop record-start" @click="startRecording">
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
          <button class="record-stop" @click="finishRecording">
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

/* Mapa estilizado (placeholder hasta integrar el mapa real con tracking) */
.record-map {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: linear-gradient(165deg, #cfe7d4 0%, #d7ead9 40%, #bfe0e6 100%);
}

:global(html.dark) .record-map {
  background: linear-gradient(165deg, #16241d 0%, #142420 45%, #102a30 100%);
}

.map-sea {
  position: absolute;
  right: -10%;
  bottom: -12%;
  width: 92%;
  height: 72%;
  background: radial-gradient(120% 120% at 80% 90%, #6fc2d4 0%, #4aa9c2 55%, #2f93b0 100%);
  border-radius: 60% 0 0 0 / 70% 0 0 0;
  transform: rotate(-8deg);
  opacity: 0.92;
}

:global(html.dark) .map-sea {
  background: radial-gradient(120% 120% at 80% 90%, #155566 0%, #0e3d4c 60%, #0a2c38 100%);
}

.map-land {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
}

.map-land--a {
  width: 180px;
  height: 150px;
  top: -40px;
  left: -50px;
  background: rgba(96, 165, 120, 0.55);
}

.map-land--b {
  width: 120px;
  height: 110px;
  top: 120px;
  left: -30px;
  background: rgba(120, 182, 140, 0.45);
}

:global(html.dark) .map-land--a {
  background: rgba(40, 90, 60, 0.5);
}

:global(html.dark) .map-land--b {
  background: rgba(48, 100, 68, 0.4);
}

.record-trace {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 6;
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
  transition: transform 0.2s ease;
}

.record-fab:active {
  transform: scale(0.9);
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
  transition: transform 0.12s var(--ease-out);
}

.record-ctrl:active {
  transform: scale(0.94);
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
  transition: transform 0.12s var(--ease-out);
}

.record-stop:active {
  transform: scale(0.94);
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
</style>
