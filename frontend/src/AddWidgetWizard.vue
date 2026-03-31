<script setup>
import { ref, reactive, computed, watch } from 'vue'

// ── Props & Emits ──────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: { type: Boolean, default: false }, // controls open/close
  domains: { type: Array, required: true },
  datasetsByDomain: { type: Object, required: true },
  vizTypes: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'add-widget'])

// ── Constants ──────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Choose Domain' },
  { id: 2, label: 'Select Dataset' },
  { id: 3, label: 'Pick Visualization' },
]

// ── State ──────────────────────────────────────────────────────────────────────
const step = ref(1)

const wizard = reactive({
  domainId: null,
  datasetId: null,
  vizType: null,
})

// ── Computed ───────────────────────────────────────────────────────────────────
const selectedDomain = computed(() => props.domains.find((d) => d.id === wizard.domainId))

const availableDatasets = computed(() => props.datasetsByDomain[wizard.domainId] ?? [])

const selectedDataset = computed(() =>
  availableDatasets.value.find((d) => d.id === wizard.datasetId),
)

const canProceed = computed(() => {
  if (step.value === 1) return !!wizard.domainId
  if (step.value === 2) return !!wizard.datasetId
  if (step.value === 3) return !!wizard.vizType
  return false
})

// ── Methods ────────────────────────────────────────────────────────────────────
function selectDomain(id) {
  wizard.domainId = id
  wizard.datasetId = null // reset dataset when domain changes
}

function handleBack() {
  if (step.value > 1) {
    step.value--
  } else {
    close()
  }
}

function close() {
  emit('update:modelValue', false)
}

function handleSubmit() {
  emit('add-widget', {
    domainId: wizard.domainId,
    datasetId: wizard.datasetId,
    vizType: wizard.vizType,
  })
  close()
}

// Reset wizard state when modal opens
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      step.value = 1
      Object.assign(wizard, { domainId: null, datasetId: null, vizType: null })
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="backdrop" @click.self="$emit('update:modelValue', false)">
      <div class="modal">
        <!-- Header -->
        <div class="modal-header">
          <h2 class="modal-title">Add Dashboard Widget</h2>
          <p class="modal-sub">Pick a domain, choose a dataset, then select how to display it.</p>
        </div>

        <!-- Step Progress -->
        <div class="steps">
          <template v-for="(s, i) in STEPS" :key="s.id">
            <div class="step" :class="{ active: step === i + 1, done: step > i + 1 }">
              <div class="step-circle" :class="{ active: step === i + 1, done: step > i + 1 }">
                <span v-if="step > i + 1">✓</span>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span class="step-label">{{ s.label }}</span>
            </div>
            <div v-if="i < STEPS.length - 1" class="step-line" :class="{ done: step > i + 1 }" />
          </template>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- STEP 1: Domain -->
          <Transition name="slide-fade" mode="out-in">
            <div v-if="step === 1" key="step1">
              <p class="step-hint">
                Select the application area this widget should draw data from.
              </p>
              <div class="domain-grid">
                <button
                  v-for="d in domains"
                  :key="d.id"
                  class="domain-card"
                  :class="{ selected: wizard.domainId === d.id }"
                  @click="selectDomain(d.id)"
                >
                  <span class="domain-icon">{{ d.icon }}</span>
                  <span class="domain-name">{{ d.name }}</span>
                  <span class="domain-desc">{{ d.description }}</span>
                </button>
              </div>
            </div>

            <!-- STEP 2: Dataset -->
            <div v-else-if="step === 2" key="step2">
              <p class="step-hint">
                Choose a dataset from the
                <strong>{{ selectedDomain?.name }}</strong> domain.
              </p>
              <div class="dataset-list">
                <button
                  v-for="ds in availableDatasets"
                  :key="ds.id"
                  class="dataset-item"
                  :class="{ selected: wizard.datasetId === ds.id }"
                  @click="wizard.datasetId = ds.id"
                >
                  <div class="radio-dot" />
                  <div class="dataset-info">
                    <span class="dataset-name">{{ ds.name }}</span>
                    <span class="dataset-desc">{{ ds.description }}</span>
                    <div class="tag-list">
                      <span v-for="t in ds.tags" :key="t" class="tag">{{ t }}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- STEP 3: Visualization -->
            <div v-else-if="step === 3" key="step3">
              <p class="step-hint">
                Choose how to visualize
                <strong>{{ selectedDataset?.name }}</strong
                >.
              </p>
              <p class="compat-notice">
                💡 All visualization types are compatible with this dataset.
              </p>
              <div class="viz-grid">
                <button
                  v-for="vt in vizTypes"
                  :key="vt.id"
                  class="viz-card"
                  :class="{ selected: wizard.vizType === vt.id }"
                  @click="wizard.vizType = vt.id"
                >
                  <span class="viz-icon">{{ vt.icon }}</span>
                  <span class="viz-name">{{ vt.name }}</span>
                  <span class="viz-desc">{{ vt.desc }}</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="handleBack">
            {{ step === 1 ? 'Cancel' : '← Back' }}
          </button>
          <div class="footer-right">
            <span class="step-counter">Step {{ step }} of {{ STEPS.length }}</span>
            <button
              v-if="step < STEPS.length"
              class="btn btn-primary"
              :disabled="!canProceed"
              @click="step++"
            >
              Next →
            </button>
            <button v-else class="btn btn-primary" :disabled="!canProceed" @click="handleSubmit">
              ✦ Add to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Backdrop */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 660px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  animation: modalIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(24px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.modal-header {
  padding: 24px 28px 0;
}
.modal-title {
  font-family: 'Syne', sans-serif;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--text);
}
.modal-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
  line-height: 1.5;
}

/* Steps */
.steps {
  display: flex;
  align-items: center;
  padding: 20px 28px 0;
}
.step {
  display: flex;
  align-items: center;
  gap: 8px;
}
.step-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  transition: all 0.3s;
  border: 2px solid var(--border);
  color: var(--text-dim);
  background: var(--surface-2);
}
.step-circle.active {
  border-color: var(--accent);
  background: var(--accent-dim);
  color: var(--accent);
}
.step-circle.done {
  border-color: var(--green);
  background: rgba(16, 185, 129, 0.14);
  color: var(--green);
}
.step-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-dim);
  white-space: nowrap;
  transition: color 0.3s;
}
.step.active .step-label {
  color: var(--text);
}
.step.done .step-label {
  color: var(--text-muted);
}
.step-line {
  flex: 1;
  height: 1px;
  background: var(--border);
  margin: 0 8px;
  transition: background 0.3s;
}
.step-line.done {
  background: var(--green);
}

/* Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.step-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 14px;
  line-height: 1.5;
}
.step-hint strong {
  color: var(--accent);
  font-weight: 600;
}
.compat-notice {
  padding: 8px 12px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  font-size: 12px;
  color: #a5b4fc;
  margin-bottom: 14px;
}

/* Domain Cards */
.domain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
}
.domain-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 14px;
  border-radius: 8px;
  border: 2px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface-2);
  width: 100%;
}
.domain-card:hover {
  border-color: var(--border-hov);
  background: var(--surface-3);
}
.domain-card.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}
.domain-icon {
  font-size: 26px;
  margin-bottom: 8px;
}
.domain-name {
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.domain-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 3px;
  line-height: 1.4;
}

/* Dataset List */
.dataset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dataset-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 2px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface-2);
  width: 100%;
  text-align: left;
}
.dataset-item:hover {
  border-color: var(--border-hov);
}
.dataset-item.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}
.radio-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--border);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.dataset-item.selected .radio-dot {
  border-color: var(--accent);
  background: var(--accent);
}
.dataset-item.selected .radio-dot::after {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--bg);
}
.dataset-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dataset-name {
  font-weight: 500;
  font-size: 13px;
  color: var(--text);
}
.dataset-desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
}
.tag-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.tag {
  padding: 2px 7px;
  border-radius: 20px;
  font-size: 10px;
  background: var(--surface-3);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

/* Viz Cards */
.viz-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.viz-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 14px;
  border-radius: 8px;
  border: 2px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface-2);
  width: 100%;
}
.viz-card:hover {
  border-color: var(--border-hov);
}
.viz-card.selected {
  border-color: var(--accent);
  background: var(--accent-dim);
}
.viz-icon {
  font-size: 28px;
  margin-bottom: 7px;
}
.viz-name {
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}
.viz-desc {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 3px;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 28px 20px;
  border-top: 1px solid var(--border);
}
.footer-right {
  display: flex;
  gap: 10px;
  align-items: center;
}
.step-counter {
  font-size: 12px;
  color: var(--text-dim);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.btn:disabled {
  opacity: 0.4;
  pointer-events: none;
}
.btn-primary {
  background: var(--accent);
  color: var(--bg);
}
.btn-primary:hover {
  background: #fbbf24;
  transform: translateY(-1px);
}
.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.btn-ghost:hover {
  border-color: var(--border-hov);
  color: var(--text);
}

/* Slide transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
