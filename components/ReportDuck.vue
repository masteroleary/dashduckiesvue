<script setup lang="ts">
// Flag a duck from a scan result. Two cases: `duckId` for a real duck that was
// never registered, `identifier` for a code that isn't in the system at all.
const props = defineProps<{
  duckId?: string | null
  identifier?: string | null
  prompt?: string
  notePlaceholder?: string
}>()

const open = ref(false)
const note = ref('')
const contact = ref('')
const sending = ref(false)
const done = ref(false)
const error = ref('')

async function send() {
  if (sending.value || (!props.duckId && !props.identifier)) return
  sending.value = true
  error.value = ''
  try {
    await $fetch('/api/duck/report', {
      method: 'POST',
      body: props.duckId
        ? { duckId: props.duckId, note: note.value, contact: contact.value }
        : { identifier: props.identifier, note: note.value, contact: contact.value },
    })
    done.value = true
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Something went wrong. Please try again.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="rd">
    <p v-if="done" class="rd-done">Thanks — we've been notified and will look into this.</p>
    <template v-else>
      <button v-if="!open" type="button" class="rd-open" @click="open = true">
        🚩 {{ prompt || 'Something wrong with this duck? Report it' }}
      </button>
      <div v-else class="rd-form">
        <label class="rd-label" for="rd-note">What's wrong? (optional)</label>
        <textarea
          id="rd-note"
          v-model="note"
          rows="3"
          maxlength="1000"
          :placeholder="notePlaceholder || 'e.g. someone is selling this duck, or the sticker looks copied'"
        ></textarea>
        <label class="rd-label" for="rd-contact">Your email or phone (optional)</label>
        <input id="rd-contact" v-model="contact" maxlength="200" placeholder="If you're happy for us to follow up" />
        <p v-if="error" class="rd-error">{{ error }}</p>
        <div class="rd-actions">
          <button type="button" class="rd-cancel" @click="open = false">Cancel</button>
          <button type="button" class="dd-btn-primary" :disabled="sending" @click="send">
            {{ sending ? 'Sending…' : 'Send report' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Deliberately quiet so it never competes with the CTA above it. */
.rd { margin-top: 22px; border-top: var(--dd-hairline); padding-top: 18px; text-align: left; }
.rd-open {
  background: none;
  border: 0;
  padding: 0;
  color: var(--dd-text-2);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
  width: 100%;
  text-align: center;
}
.rd-open:hover { color: var(--dd-cream); }
.rd-form { display: flex; flex-direction: column; gap: 8px; }
.rd-label { font-size: 13px; color: var(--dd-text-2); }
.rd-form textarea,
.rd-form input {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: var(--dd-hairline);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--dd-cream);
  font: inherit;
  font-size: 14px;
  resize: vertical;
}
.rd-form textarea:focus,
.rd-form input:focus { outline: 2px solid var(--dd-bronze); outline-offset: 1px; }
.rd-error { color: #F1856F; font-size: 13px; margin: 0; }
.rd-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 4px; }
.rd-cancel {
  background: none;
  border: 0;
  padding: 0;
  color: var(--dd-text-2);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.rd-cancel:hover { color: var(--dd-cream); }
.rd-done { color: var(--dd-cream); font-size: 14px; margin: 0; text-align: center; }
</style>
