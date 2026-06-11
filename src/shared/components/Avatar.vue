<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

defineOptions({
  name: 'AvatarComponent',
})

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(value),
  },
  shape: {
    type: String,
    default: 'circle',
    validator: (value) => ['circle', 'square', 'rounded'].includes(value),
  },
  status: {
    type: String,
    default: '',
    validator: (value) => ['', 'online', 'offline', 'away', 'busy'].includes(value),
  },
  icon: {
    type: String,
    default: '',
  },
})

const initials = computed(() => {
  if (!props.name) return ''

  const names = props.name.trim().split(' ')
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase()
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
})

const avatarClasses = computed(() => {
  return [
    'avatar',
    `avatar-${props.size}`,
    `avatar-${props.shape}`,
    {
      'avatar-with-status': props.status,
    },
  ]
})

const statusClasses = computed(() => {
  return ['avatar-status', `avatar-status-${props.status}`]
})
</script>

<template>
  <div :class="avatarClasses">
    <!-- Image -->
    <img v-if="src" :src="src" :alt="alt || name" class="avatar-image" />

    <!-- Icon -->
    <div v-else-if="icon" class="avatar-icon">
      <Icon
        :name="icon"
        :size="
          size === 'xs'
            ? 12
            : size === 'sm'
              ? 14
              : size === 'md'
                ? 18
                : size === 'lg'
                  ? 24
                  : size === 'xl'
                    ? 32
                    : 40
        "
      />
    </div>

    <!-- Initials -->
    <span v-else-if="initials" class="avatar-initials">
      {{ initials }}
    </span>

    <!-- Fallback -->
    <div v-else class="avatar-fallback">
      <Icon
        name="User"
        :size="
          size === 'xs'
            ? 12
            : size === 'sm'
              ? 14
              : size === 'md'
                ? 18
                : size === 'lg'
                  ? 24
                  : size === 'xl'
                    ? 32
                    : 40
        "
      />
    </div>

    <!-- Status indicator -->
    <span v-if="status" :class="statusClasses"></span>
  </div>
</template>

<style scoped>
.avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: white;
  font-weight: var(--font-semibold);
  user-select: none;
}

/* Sizes */
.avatar-xs {
  width: 24px;
  height: 24px;
  font-size: 10px;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  font-size: 12px;
}

.avatar-md {
  width: 40px;
  height: 40px;
  font-size: 14px;
}

.avatar-lg {
  width: 48px;
  height: 48px;
  font-size: 16px;
}

.avatar-xl {
  width: 64px;
  height: 64px;
  font-size: 20px;
}

.avatar-2xl {
  width: 96px;
  height: 96px;
  font-size: 32px;
}

/* Shapes */
.avatar-circle {
  border-radius: 50%;
}

.avatar-square {
  border-radius: 0;
}

.avatar-rounded {
  border-radius: var(--radius-lg);
}

/* Image */
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Icon and Fallback */
.avatar-icon,
.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: white;
}

/* Initials */
.avatar-initials {
  text-transform: uppercase;
}

/* Status indicator */
.avatar-status {
  position: absolute;
  bottom: 0;
  right: 0;
  border: 2px solid var(--color-bg);
  border-radius: 50%;
}

.avatar-xs .avatar-status {
  width: 8px;
  height: 8px;
  border-width: 1px;
}

.avatar-sm .avatar-status,
.avatar-md .avatar-status {
  width: 10px;
  height: 10px;
}

.avatar-lg .avatar-status,
.avatar-xl .avatar-status {
  width: 12px;
  height: 12px;
}

.avatar-2xl .avatar-status {
  width: 16px;
  height: 16px;
  border-width: 3px;
}

.avatar-status-online {
  background-color: var(--color-success);
}

.avatar-status-offline {
  background-color: var(--color-text-tertiary);
}

.avatar-status-away {
  background-color: var(--color-warning);
}

.avatar-status-busy {
  background-color: var(--color-error);
}
</style>
