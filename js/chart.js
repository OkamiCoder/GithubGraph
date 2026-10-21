function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`
  }
  return d
}

const ContributionChart = {
  name: 'ContributionChart',
  props: {
    daily: { type: Array, required: true }, // [{date, count}]
  },
  template: `
    <svg :viewBox="\`0 0 \${W} \${H}\`" class="w-full select-none" role="img"
         aria-label="График активности">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#39d353" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#39d353" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <line v-for="(g, i) in gridYs" :key="'grid' + i"
            :x1="PAD_X" :x2="W - PAD_X" :y1="g" :y2="g"
            stroke="#21262d" stroke-width="1"/>

      <path :d="areaD" fill="url(#areaGrad)" class="area-anim"/>

      <path ref="lineRef" :d="pathD" class="line-anim"
            fill="none" stroke="#39d353" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round"
            :style="lineStyle"/>

      <g v-for="(p, i) in points" :key="'dot' + i" class="dot"
         :style="{ animationDelay: (1.0 + i * 0.05) + 's' }">
        <circle :cx="p.x" :cy="p.y" r="9" fill="#39d353" opacity="0.12"/>
        <circle :cx="p.x" :cy="p.y" r="4" fill="#0d1117"
                stroke="#39d353" stroke-width="2"/>
        <title>{{ p.title }}</title>
      </g>

      <text v-for="(p, i) in points" v-show="i % 2 === 0"
            :key="'label' + i" :x="p.x" :y="H - 6"
            text-anchor="middle" class="axis-label">{{ p.short }}</text>
    </svg>
  `,
  setup(props) {
    const W = 560, H = 240, PAD_X = 28, PAD_Y = 26

    const { computed, onMounted, ref } = Vue
    const lineRef = ref(null)
    const lineLen = ref(1000)

    const points = computed(() => {
      const max = Math.max(...props.daily.map(d => d.count), 1)
      const stepX = props.daily.length > 1
        ? (W - PAD_X * 2) / (props.daily.length - 1)
        : 0
      return props.daily.map((d, i) => {
        const [, m, day] = d.date.split('-')
        return {
          x: Math.round(PAD_X + i * stepX),
          y: Math.round(H - PAD_Y - (d.count / max) * (H - PAD_Y * 2 - 14)),
          short: `${day}.${m}`,
          title: `${day}.${m}: ${d.count} событий`,
        }
      })
    })

    const pathD = computed(() => smoothPath(points.value))

    const areaD = computed(() => {
      const pts = points.value
      if (pts.length < 2) return ''
      return `${pathD.value} L ${pts.at(-1).x} ${H - PAD_Y} L ${pts[0].x} ${H - PAD_Y} Z`
    })

    const lineStyle = computed(() => ({
      strokeDasharray: lineLen.value,
      strokeDashoffset: lineLen.value,
    }))

    const gridYs = computed(() => {
      const n = 4
      return Array.from({ length: n + 1 },
        (_, i) => Math.round(PAD_Y + i * (H - PAD_Y * 2) / n))
    })

    onMounted(() => {
      if (lineRef.value) {
        try { lineLen.value = lineRef.value.getTotalLength() } catch (e) { /* noop */ }
      }
    })

    return { W, H, PAD_X, points, pathD, areaD, lineStyle, gridYs, lineRef }
  },
}
