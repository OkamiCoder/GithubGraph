const API_BASE = 'https://api.github.com'

const EVENT_WEIGHTS = {
  PushEvent: 1,
  PullRequestEvent: 2,
  PullRequestReviewEvent: 1,
  IssuesEvent: 1,
  CreateEvent: 1,
  ReleaseEvent: 3,
}

async function getUser(username) {
  const res = await fetch(`${API_BASE}/users/${username}`)
  if (res.status === 404) throw new Error('Такого пользователя на GitHub нет 🤔')
  if (res.status === 403) throw new Error('Лимит GitHub API исчерпан, попробуй позже (≈через час)')
  if (!res.ok) throw new Error('GitHub API вернул ошибку, попробуй ещё раз')
  return res.json()
}

async function getDailyActivity(username, days = 14) {
  const dayMs = 86400_000
  const cutoff = new Date(Date.now() - days * dayMs)

  const counts = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(cutoff.getTime() + i * dayMs)
    counts[d.toISOString().slice(0, 10)] = 0
  }

  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${API_BASE}/users/${username}/events?page=${page}&per_page=100`)
    if (res.status === 403) throw new Error('Лимит GitHub API исчерпан, попробуй позже (≈через час)')
    if (!res.ok) break

    const events = await res.json()
    let allOld = true

    for (const ev of events) {
      const day = ev.created_at.slice(0, 10)
      const weight = EVENT_WEIGHTS[ev.type] ?? 0
      if (day in counts) {
        counts[day] += weight
        allOld = false
      }
      if (new Date(ev.created_at) >= cutoff) allOld = false
    }

    if (events.length < 100) break      
    if (allOld) break                    
  }

  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
