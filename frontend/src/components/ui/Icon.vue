<!--
  Universal Icon Component with Heroicons Integration
  Provides consistent icon rendering with proper accessibility
-->
<template>
  <component
    :is="tag"
    :class="iconClasses"
    :style="sizeStyles"
    :aria-hidden="!ariaLabel"
    :aria-label="ariaLabel"
    role="img"
    v-html="iconSvg"
  />
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'

interface Props {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  variant?: 'outline' | 'solid' | 'mini'
  color?: string
  tag?: string
  ariaLabel?: string
  class?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'outline',
  tag: 'span',
  ariaLabel: undefined,
  class: undefined
})

// Icon size mapping
const sizeMap = {
  xs: 12,
  sm: 16, 
  md: 20,
  lg: 24,
  xl: 32
}

// SVG icon store (simplified for key icons used in the redesign)
const iconLibrary: Record<string, string> = {
  'chevron-down': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>`,
  'chevron-up': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>`,
  'chevron-right': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>`,
  'check': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>`,
  'check-circle': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>`,
  'user': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>`,
  'shopping-bag': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119.007Z" />
  </svg>`,
  'currency-dollar': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.268-.268-1.543-.748-.275-.48-.133-1.085.395-1.52.528-.436 1.26-.644 2.148-.644 1.16 0 2.197.37 3 1m-3-7v2" />
  </svg>`,
  'document-text': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>`,
  'pencil': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>`,
  'eye': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>`,
  'x-mark': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>`,
  'arrow-left': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>`,
  'arrow-right': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>`,
  'receipt-percent': `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>`
}

const iconSvg = ref('')

// Computed properties
const iconClasses = computed(() => {
  const classes = ['icon', `icon--${props.variant}`]
  if (props.class) {
    if (Array.isArray(props.class)) {
      classes.push(...props.class)
    } else {
      classes.push(props.class)
    }
  }
  return classes
})

const sizeStyles = computed(() => {
  const size = typeof props.size === 'number' 
    ? props.size 
    : sizeMap[props.size]
  
  const styles: Record<string, string> = {
    width: `${size}px`,
    height: `${size}px`
  }
  
  if (props.color) {
    styles.color = props.color
  }
  
  return styles
})

// Load icon SVG
watchEffect(() => {
  const svg = iconLibrary[props.name]
  if (svg) {
    iconSvg.value = svg
  } else {
    console.warn(`Icon "${props.name}" not found in icon library`)
    iconSvg.value = iconLibrary['x-mark'] // Fallback
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.icon {
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
  color: currentColor;
  flex-shrink: 0;
  transition: $transition-base;
  
  &--outline {
    fill: none;
    stroke: currentColor;
  }
  
  &--solid {
    fill: currentColor;
    stroke: none;
  }
  
  &--mini {
    fill: currentColor;
    stroke: none;
  }
}

// Rotation utility class for chevrons
.icon--rotated {
  transform: rotate(180deg);
}

// Interactive states
.icon:hover {
  opacity: 0.8;
}

// Size variants for special use cases
.icon-xs {
  width: 12px;
  height: 12px;
}

.icon-sm {
  width: 16px; 
  height: 16px;
}

.icon-md {
  width: 20px;
  height: 20px;
}

.icon-lg {
  width: 24px;
  height: 24px;
}

.icon-xl {
  width: 32px;
  height: 32px;
}
</style>