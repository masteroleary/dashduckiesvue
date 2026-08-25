<script setup lang="ts">
useHead({
  title: 'Jeep Talk Forum — DashDuckies',
  meta: [{ name: 'description', content: 'Discuss Jeep builds, trails, gear and duck adventures with the DashDuckies community.' }],
})

interface Comment { id: string; author: string; text: string; createdAt: string }
interface Thread {
  id: string
  title: string
  body: string | null
  author: string
  imageUrl: string | null
  likes: number
  createdAt: string
  comments: Comment[]
}

// Threads live in Postgres — load them (SSR) and keep a local copy we can
// update optimistically after posts / likes / comments.
const { data } = await useFetch<Thread[]>('/api/forum', { default: () => [] })
const threads = ref<Thread[]>(data.value ?? [])
watch(data, (v) => { threads.value = v ?? [] })

const authorName = ref('')
const composerOpen = ref(false)
const draft = reactive({ title: '', body: '' })
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const posting = ref(false)
const openThreadId = ref<string | null>(null)
const commentDraft = reactive<Record<string, string>>({})
const likedIds = ref<string[]>([])
const toast = ref('')

onMounted(() => {
  authorName.value = localStorage.getItem('dd-forum-name') || ''
  try {
    likedIds.value = JSON.parse(localStorage.getItem('dd-forum-liked') || '[]')
  } catch {
    likedIds.value = []
  }
})

const isLiked = (t: Thread) => likedIds.value.includes(t.id)

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  if (w < 5) return `${w}w ago`
  return new Date(iso).toLocaleDateString()
}
function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}
function flash(msg: string) {
  toast.value = msg
  setTimeout(() => {
    if (toast.value === msg) toast.value = ''
  }, 2200)
}

function onPhoto(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] || null
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFile.value = f
  photoPreview.value = f ? URL.createObjectURL(f) : null
}
function clearPhoto() {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFile.value = null
  photoPreview.value = null
}

async function post() {
  if (!draft.title.trim()) {
    flash('Add a headline first ✏️')
    return
  }
  posting.value = true
  const name = authorName.value.trim() || 'Anonymous Ducker'
  localStorage.setItem('dd-forum-name', name)
  const fd = new FormData()
  fd.append('title', draft.title.trim())
  fd.append('body', draft.body.trim())
  fd.append('author', name)
  if (photoFile.value) fd.append('image', photoFile.value)
  try {
    const t = await $fetch<Thread>('/api/forum', { method: 'POST', body: fd })
    threads.value.unshift(t)
    draft.title = ''
    draft.body = ''
    clearPhoto()
    composerOpen.value = false
    flash('Posted! 🎉')
  } catch {
    flash('Could not post — try again')
  } finally {
    posting.value = false
  }
}

async function toggleLike(t: Thread) {
  const like = !isLiked(t)
  t.likes += like ? 1 : -1
  if (like) likedIds.value.push(t.id)
  else likedIds.value = likedIds.value.filter((x) => x !== t.id)
  localStorage.setItem('dd-forum-liked', JSON.stringify(likedIds.value))
  try {
    const r = await $fetch<{ likes: number }>(`/api/forum/${t.id}/like`, { method: 'POST', body: { like } })
    t.likes = r.likes
  } catch {
    /* keep the optimistic count */
  }
}

function toggleComments(t: Thread) {
  openThreadId.value = openThreadId.value === t.id ? null : t.id
}

async function addComment(t: Thread) {
  const text = (commentDraft[t.id] || '').trim()
  if (!text) return
  const name = authorName.value.trim() || 'Anonymous Ducker'
  localStorage.setItem('dd-forum-name', name)
  commentDraft[t.id] = ''
  try {
    const c = await $fetch<Comment>(`/api/forum/${t.id}/comment`, { method: 'POST', body: { text, author: name } })
    t.comments.push(c)
  } catch {
    flash('Could not comment — try again')
  }
}

async function share(t: Thread) {
  const url = `${location.origin}/forum#thread-${t.id}`
  try {
    if (navigator.share) {
      await navigator.share({ title: t.title, text: t.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      flash('Link copied! 🔗')
    }
  } catch {
    /* user cancelled */
  }
}
</script>

<template>
  <div class="fm-wrap">
    <header class="fm-head">
      <span class="fm-eyebrow">🚙 Community</span>
      <h1 class="fm-title">Jeep Talk</h1>
      <p class="fm-sub">Swap builds, trails, recovery tips and duck adventures with the DashDuckies crew.</p>
      <button type="button" class="fm-new-btn" @click="composerOpen = !composerOpen">✏️ Start a discussion</button>
    </header>

    <transition name="fm-slide">
      <div v-if="composerOpen" class="fm-composer">
        <input v-model="authorName" class="fm-input" placeholder="Your name (optional)" maxlength="40" />
        <input
          v-model="draft.title"
          class="fm-input fm-input-title"
          placeholder="Headline — what's this about?"
          maxlength="120"
        />
        <textarea v-model="draft.body" class="fm-textarea" rows="4" placeholder="Share the details…" maxlength="2000" />
        <img v-if="photoPreview" :src="photoPreview" class="fm-photo-preview" alt="Selected photo preview" />
        <div class="fm-composer-foot">
          <label class="fm-photo-btn">
            📷 {{ photoFile ? 'Change photo' : 'Add photo' }}
            <input type="file" accept="image/*" hidden @change="onPhoto" />
          </label>
          <div class="fm-composer-actions">
            <button v-if="photoFile" type="button" class="fm-cancel" @click="clearPhoto">Remove photo</button>
            <button type="button" class="fm-cancel" @click="composerOpen = false">Cancel</button>
            <button type="button" class="fm-post" :disabled="posting" @click="post">{{ posting ? 'Posting…' : 'Post' }}</button>
          </div>
        </div>
      </div>
    </transition>

    <div class="fm-feed">
      <p v-if="!threads.length" class="fm-empty">No discussions yet — be the first to start one!</p>

      <article v-for="t in threads" :id="`thread-${t.id}`" :key="t.id" class="fm-thread">
        <div class="fm-thread-top">
          <span class="fm-ava">{{ initials(t.author) }}</span>
          <div class="fm-meta">
            <span class="fm-author">{{ t.author }}</span>
            <span class="fm-time">{{ timeAgo(t.createdAt) }}</span>
          </div>
        </div>

        <h2 class="fm-headline">{{ t.title }}</h2>
        <p v-if="t.body" class="fm-body">{{ t.body }}</p>
        <img v-if="t.imageUrl" :src="t.imageUrl" class="fm-thread-photo" alt="Discussion photo" />

        <div class="fm-actions">
          <button type="button" class="fm-act" :class="{ on: isLiked(t) }" @click="toggleLike(t)">
            <span>{{ isLiked(t) ? '❤️' : '🤍' }}</span> {{ t.likes }}
          </button>
          <button type="button" class="fm-act" @click="toggleComments(t)">
            <span>💬</span> {{ t.comments.length }}
          </button>
          <button type="button" class="fm-act" @click="share(t)"><span>↗️</span> Share</button>
        </div>

        <div v-if="openThreadId === t.id" class="fm-comments">
          <div v-for="c in t.comments" :key="c.id" class="fm-comment">
            <span class="fm-ava fm-ava-sm">{{ initials(c.author) }}</span>
            <div class="fm-comment-body">
              <span class="fm-comment-head"><b>{{ c.author }}</b> · {{ timeAgo(c.createdAt) }}</span>
              <p>{{ c.text }}</p>
            </div>
          </div>
          <div class="fm-comment-form">
            <input
              v-model="commentDraft[t.id]"
              class="fm-input"
              placeholder="Add a comment…"
              maxlength="500"
              @keyup.enter="addComment(t)"
            />
            <button type="button" class="fm-post fm-post-sm" @click="addComment(t)">Reply</button>
          </div>
        </div>
      </article>
    </div>

    <transition name="fm-fade">
      <div v-if="toast" class="fm-toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<style scoped>
.fm-wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 44px 20px 100px;
  font-family: var(--font-body);
  color: var(--dd-cream);
}
.fm-head { text-align: center; margin-bottom: 30px; }
.fm-eyebrow {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dd-pond-deep);
  background: var(--dd-pond-soft);
  padding: 5px 14px;
  border-radius: 999px;
}
.fm-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(34px, 6vw, 48px);
  letter-spacing: -0.01em;
  margin: 14px 0 8px;
  color: var(--dd-cream);
}
.fm-sub { color: var(--dd-muted); font-size: 16px; margin: 0 auto 22px; max-width: 520px; line-height: 1.5; }
.fm-new-btn {
  background: var(--dd-grad-gold);
  color: #16140F;
  border: none;
  border-radius: 999px;
  padding: 13px 28px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(168, 125, 44, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.fm-new-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(168, 125, 44, 0.4); }

.fm-composer {
  background: var(--dd-pitch);
  border: var(--dd-hairline);
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 28px;
  box-shadow: 0 14px 34px rgba(60, 45, 15, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fm-input,
.fm-textarea {
  width: 100%;
  background: var(--dd-panel-3);
  border: var(--dd-hairline);
  border-radius: 12px;
  padding: 12px 14px;
  color: var(--dd-cream);
  font-family: var(--font-body);
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.fm-input:focus,
.fm-textarea:focus { border-color: var(--dd-bronze); box-shadow: 0 0 0 3px rgba(168, 125, 44, 0.16); }
.fm-input-title { font-family: var(--font-display); font-weight: 600; font-size: 17px; }
.fm-textarea { resize: vertical; line-height: 1.5; }
.fm-photo-preview { width: 100%; max-height: 320px; object-fit: cover; border-radius: 12px; }
.fm-composer-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.fm-photo-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: var(--dd-bronze);
  padding: 8px 12px;
  border-radius: 10px;
}
.fm-photo-btn:hover { background: var(--dd-panel-3); }
.fm-composer-actions { display: flex; align-items: center; gap: 10px; }
.fm-cancel { background: none; border: none; color: var(--dd-muted); font-weight: 600; font-size: 14px; cursor: pointer; padding: 8px 10px; }
.fm-cancel:hover { color: var(--dd-cream); }
.fm-post {
  background: var(--dd-grad-gold);
  color: #16140F;
  border: none;
  border-radius: 999px;
  padding: 10px 22px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}
.fm-post:hover { filter: brightness(1.04); }
.fm-post:disabled { opacity: 0.6; cursor: default; }

.fm-feed { display: flex; flex-direction: column; gap: 18px; }
.fm-empty { text-align: center; color: var(--dd-muted); padding: 40px 0; }
.fm-thread {
  background: var(--dd-pitch);
  border: var(--dd-hairline);
  border-radius: 18px;
  padding: 20px 22px;
  box-shadow: 0 8px 24px rgba(60, 45, 15, 0.06);
}
.fm-thread-top { display: flex; align-items: center; gap: 11px; margin-bottom: 12px; }
.fm-ava {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--dd-grad-gold);
  color: #16140F;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
}
.fm-ava-sm { width: 30px; height: 30px; font-size: 12px; }
.fm-meta { display: flex; flex-direction: column; }
.fm-author { font-weight: 700; font-size: 14px; color: var(--dd-cream); }
.fm-time { font-size: 12px; color: var(--dd-faint); }
.fm-headline {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 22px;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--dd-cream);
  margin: 0 0 8px;
}
.fm-body { color: var(--dd-text-2); font-size: 15px; line-height: 1.6; margin: 0 0 14px; white-space: pre-wrap; }
.fm-thread-photo { width: 100%; max-height: 460px; object-fit: cover; border-radius: 14px; margin: 0 0 14px; display: block; }
.fm-actions { display: flex; gap: 8px; border-top: var(--dd-hairline-soft); padding-top: 12px; }
.fm-act {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  color: var(--dd-muted);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  padding: 7px 12px;
  border-radius: 999px;
  transition: background 0.15s ease, color 0.15s ease;
}
.fm-act:hover { background: var(--dd-panel-3); color: var(--dd-cream); }
.fm-act.on { color: #C0524A; }
.fm-act span { font-size: 16px; }

.fm-comments { margin-top: 14px; border-top: var(--dd-hairline-soft); padding-top: 14px; display: flex; flex-direction: column; gap: 14px; }
.fm-comment { display: flex; gap: 10px; }
.fm-comment-body { min-width: 0; }
.fm-comment-head { font-size: 12px; color: var(--dd-faint); }
.fm-comment-head b { color: var(--dd-cream); font-weight: 700; }
.fm-comment-body p { margin: 3px 0 0; color: var(--dd-text-2); font-size: 14px; line-height: 1.5; }
.fm-comment-form { display: flex; gap: 8px; }
.fm-comment-form .fm-input { flex: 1; }
.fm-post-sm { padding: 10px 16px; flex: none; }

.fm-toast {
  position: fixed;
  bottom: 26px;
  left: 50%;
  transform: translateX(-50%);
  background: #16140F;
  color: #F5EFDF;
  padding: 12px 22px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  z-index: 3000;
}

.fm-slide-enter-active,
.fm-slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fm-slide-enter-from,
.fm-slide-leave-to { opacity: 0; transform: translateY(-8px); }
.fm-fade-enter-active,
.fm-fade-leave-active { transition: opacity 0.2s ease; }
.fm-fade-enter-from,
.fm-fade-leave-to { opacity: 0; }
</style>
