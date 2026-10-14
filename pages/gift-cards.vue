<script setup lang="ts">
useHead({
  title: 'E-Gift Cards — DashDuckies',
  meta: [
    {
      name: 'description',
      content: 'Send a DashDuckies e-gift card by email, or gift a subscription — a duck, and a map to follow it.',
    },
  ],
})

const CUSTOM = 'custom'
const MIN_GIFT = 5
const MAX_GIFT = 500

const amounts = [25, 50, 75, 100, 150]
const choice = ref<'' | number | typeof CUSTOM>('')
const custom = ref<number | null>(null)

const isCustom = computed(() => choice.value === CUSTOM)
// null until a valid amount exists, so the bar never shows a misleading $0.
const giftAmount = computed<number | null>(() => {
  if (choice.value === '') return null
  if (!isCustom.value) return choice.value as number
  const v = custom.value
  if (v == null || Number.isNaN(v)) return null
  return v >= MIN_GIFT && v <= MAX_GIFT ? Math.round(v) : null
})

// Rates match the subscription page: $18/mo for 3, $16/mo for 6, $14/mo for 12.
const terms = [
  { months: 3, total: 54, per: 18 },
  { months: 6, total: 96, per: 16 },
  { months: 12, total: 168, per: 14 },
]
const months = ref<'' | number>('')
const term = computed(() => terms.find((t) => t.months === months.value) ?? null)
</script>

<template>
  <div class="shop-page">
    <div class="shop-head">
      <h1 class="shop-title">
        <span class="shop-title-word">Shop</span>
        <DuckMark class="shop-title-duck" :size="46" color="#FFC61A" />
      </h1>
      <p class="shop-sub">Give a duck — and a map to follow it.</p>
    </div>

    <!-- Gift card amount -->
    <section class="gift-block">
      <div class="gift-block-head">
        <h2 class="gift-block-title">E-gift card</h2>
        <p class="gift-block-note">Emailed instantly · spends on anything in the shop</p>
      </div>

      <div class="gift-split">
      <div class="gift-controls">
      <div class="gift-tiles">
        <button
          v-for="a in amounts"
          :key="a"
          type="button"
          class="gift-tile"
          :class="{ 'is-on': choice === a }"
          :aria-pressed="choice === a"
          @click="choice = a"
        >
          <DuckMark v-if="choice === a" class="gift-tile-duck" :size="22" color="#FFC61A" />
          ${{ a }}
        </button>
        <button
          type="button"
          class="gift-tile"
          :class="{ 'is-on': isCustom }"
          :aria-pressed="isCustom"
          @click="choice = CUSTOM"
        >
          <DuckMark v-if="isCustom" class="gift-tile-duck" :size="22" color="#FFC61A" />
          Custom
        </button>
      </div>

      <div v-if="isCustom" class="gift-custom">
        <label class="shop-label" for="gift-custom">Amount (${{ MIN_GIFT }}–${{ MAX_GIFT }})</label>
        <input
          id="gift-custom"
          v-model.number="custom"
          class="shop-input"
          type="number"
          inputmode="numeric"
          :min="MIN_GIFT"
          :max="MAX_GIFT"
          step="1"
          placeholder="e.g. 65"
        />
      </div>

      <div class="gift-bar">
        <span class="gift-bar-price">{{ giftAmount == null ? '—' : `$${giftAmount}` }}</span>
        <p class="gift-bar-note">
          {{ giftAmount == null ? 'Select an amount' : 'Delivered by email · never expires' }}
        </p>
        <span class="shop-tag">Coming soon</span>
      </div>
      </div>
      <GiftCardArt :amount="giftAmount" />
      </div>
    </section>

    <!-- Gift subscription length -->
    <section class="gift-block">
      <div class="gift-block-head">
        <h2 class="gift-block-title">Gift subscription</h2>
        <p class="gift-block-note">Two ducks a month, then it stops on its own</p>
      </div>

      <div class="gift-split">
      <div class="gift-controls">
      <div class="gift-tiles">
        <button
          v-for="t in terms"
          :key="t.months"
          type="button"
          class="gift-tile"
          :class="{ 'is-on': months === t.months }"
          :aria-pressed="months === t.months"
          @click="months = t.months"
        >
          <DuckMark v-if="months === t.months" class="gift-tile-duck" :size="22" color="#FFC61A" />
          {{ t.months }} mo
          <small>{{ t.months * 2 }} ducks</small>
        </button>
      </div>

      <div class="gift-bar">
        <span class="gift-bar-price">{{ term ? `$${term.total}` : '—' }}</span>
        <p class="gift-bar-note">
          {{ term ? `$${term.per}/month · no auto-renewal` : 'Select a length' }}
        </p>
        <span class="shop-tag">Coming soon</span>
      </div>
      </div>
      <DuckBoxArt :ducks="term ? term.months * 2 : 0" />
      </div>
    </section>

    <p class="shop-sub" style="font-size: 14.5px">
      Checkout isn't open yet — <NuxtLink to="/contact" style="color: var(--dd-bronze); font-weight: 700">get in touch</NuxtLink>
      and we'll arrange a gift by hand.
    </p>
  </div>
</template>
