const { createApp, ref, computed } = Vue

createApp({
  components: { 'contribution-chart': ContributionChart },
  setup() {
    const username = ref('')
    const state = ref('idle')        // idle | loading | done | error
    const error = ref('')
    const user = ref(null)
    const daily = ref([])

    const total = computed(() =>
      daily.value.reduce((sum, d) => sum + d.count, 0))

    async function load() {
      const name = username.value.trim()
      if (!name || state.value === 'loading') return
      state.value = 'loading'
      error.value = ''
      try {
        const [u, d] = await Promise.all([
          getUser(name),
          getDailyActivity(name, 14),
        ])
        user.value = u
        daily.value = d
        state.value = 'done'
      } catch (e) {
        error.value = e.message || 'Что-то пошло не так'
        state.value = 'error'
      }
    }

    return { username, state, error, user, daily, total, load }
  },
}).mount('#app')
