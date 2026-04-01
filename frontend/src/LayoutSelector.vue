<script setup>
import { ref } from 'vue'

// ── Props & Emits ──────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  currentLayout: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue', 'select-layout'])

// ── Layout Options ─────────────────────────────────────────────────────────────
const LAYOUTS = [
  {
    id: 'single',
    name: 'Single Column',
    description: 'One column spanning full width',
    icon: '▓',
    preview: ['100%'],
  },
  {
    id: 'two-equal',
    name: 'Two Columns Equal',
    description: 'Two columns, 50% width each',
    icon: '▓▓',
    preview: ['50%', '50%'],
  },
  {
    id: 'two-left-small',
    name: 'Two Columns (1/3 - 2/3)',
    description: 'Left column 1/3, right column 2/3',
    icon: '▓▓▓',
    preview: ['33%', '67%'],
  },
  {
    id: 'two-left-large',
    name: 'Two Columns (2/3 - 1/3)',
    description: 'Left column 2/3, right column 1/3',
    icon: '▓▓▓',
    preview: ['67%', '33%'],
  },
  {
    id: 'three-equal',
    name: 'Three Columns Equal',
    description: 'Three columns, equal width',
    icon: '▓▓▓',
    preview: ['33%', '33%', '33%'],
  },
]

const selectedLayout = ref(props.currentLayout)

// ── Methods ────────────────────────────────────────────────────────────────────
function selectLayout(layoutId) {
  selectedLayout.value = layoutId
}

function confirmSelection() {
  if (selectedLayout.value) {
    emit('select-layout', selectedLayout.value)
    emit('update:modelValue', false)
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="backdrop" @click.self="close">
      <div class="modal-layout">
        <!-- Header -->
        <div class="modal-header">
          <h2 class="modal-title">Choose Dashboard Layout</h2>
          <p class="modal-sub">
            Select a layout structure for your dashboard. You can change it anytime.
          </p>
        </div>

        <!-- Layout Options -->
        <div class="layouts-grid">
          <button
            v-for="layout in LAYOUTS"
            :key="layout.id"
            class="layout-card"
            :class="{ selected: selectedLayout === layout.id }"
            @click="selectLayout(layout.id)"
          >
            <div class="layout-preview">
              <div
                v-for="(width, idx) in layout.preview"
                :key="idx"
                class="column-preview"
                :style="{ width }"
              />
            </div>
            <div class="layout-info">
              <h3 class="layout-name">{{ layout.name }}</h3>
              <p class="layout-desc">{{ layout.description }}</p>
            </div>
            <div v-if="selectedLayout === layout.id" class="selected-badge">✓</div>
          </button>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="close">Cancel</button>
          <button class="btn btn-primary" :disabled="!selectedLayout" @click="confirmSelection">
            Apply Layout
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-layout {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  padding: 28px 28px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.modal-sub {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.layouts-grid {
  padding: 28px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.layout-card {
  position: relative;
  background: var(--surface-2);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
  color: inherit;
}

.layout-card:hover {
  border-color: var(--border-hov);
  transform: translateY(-2px);
}

.layout-card.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.layout-preview {
  display: flex;
  gap: 6px;
  height: 80px;
  margin-bottom: 16px;
  background: var(--bg);
  border-radius: 8px;
  padding: 8px;
}

.column-preview {
  background: linear-gradient(135deg, var(--accent) 0%, rgba(245, 158, 11, 0.6) 100%);
  border-radius: 4px;
  transition: all 0.3s;
}

.layout-card:hover .column-preview {
  opacity: 0.9;
}

.layout-card.selected .column-preview {
  background: linear-gradient(135deg, var(--accent) 0%, rgba(245, 158, 11, 0.8) 100%);
}

.layout-info {
  margin-bottom: 8px;
}

.layout-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}

.layout-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
}

.selected-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background: var(--accent);
  color: var(--bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.modal-actions {
  padding: 20px 28px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-secondary {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--surface-2);
  border-color: var(--border-hov);
}

.btn-primary {
  background: var(--accent);
  color: var(--bg);
  font-weight: 600;
}

.btn-primary:hover {
  background: #ff9800;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
