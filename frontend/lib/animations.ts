// frontend/lib/animations.ts
// Async import ensures anime.js is never bundled for the server

async function getAnime() {
  const mod = await import('animejs/lib/anime.es.js')
  return (mod.default ?? mod) as typeof import('animejs')
}

/** Counts an element's text content from 0 to `target` */
export async function animateCounter(el: HTMLElement, target: number, duration = 1200) {
  const anime = await getAnime()
  const obj = { val: 0 }
  anime({
    targets: obj,
    val: target,
    duration,
    easing: 'easeOutExpo',
    round: 1,
    update: () => { el.textContent = String(Math.floor(obj.val)) },
  })
}

/** Animates a bar element's width from 0 to `pct`% and syncs a label element */
export async function animateProgressBar(
  barEl: HTMLElement,
  labelEl: HTMLElement,
  pct: number,
  duration = 800,
) {
  const anime = await getAnime()
  const obj = { val: 0 }
  anime({ targets: barEl, width: [`0%`, `${pct}%`], duration, easing: 'easeOutExpo' })
  anime({
    targets: obj,
    val: pct,
    duration,
    easing: 'easeOutExpo',
    round: 1,
    update: () => { labelEl.textContent = `${Math.floor(obj.val)}%` },
  })
}

/** Orchestrates case load: header slides in, IOC cards stagger in from left */
export async function orchestrateCaseLoad(
  headerEl: HTMLElement | null,
  iocGridEl: HTMLElement | null,
) {
  if (!headerEl && !iocGridEl) return
  const anime = await getAnime()
  const tl = anime.timeline({ easing: 'easeOutExpo' })

  if (headerEl) {
    headerEl.style.opacity = '0'
    headerEl.style.transform = 'translateY(-6px)'
    tl.add({ targets: headerEl, opacity: [0, 1], translateY: [-6, 0], duration: 350 })
  }

  if (iocGridEl) {
    const cards = Array.from(iocGridEl.children) as HTMLElement[]
    cards.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateX(-10px)' })
    tl.add(
      {
        targets: cards,
        opacity: [0, 1],
        translateX: [-10, 0],
        duration: 300,
        delay: anime.stagger(80),
      },
      '-=200',
    )
  }
}

/** Spring entrance for a new queue card */
export async function animateSpringEntrance(el: HTMLElement) {
  const anime = await getAnime()
  el.style.opacity = '0'
  el.style.transform = 'translateY(-20px) scale(0.95)'
  anime({
    targets: el,
    opacity: [0, 1],
    translateY: [-20, 0],
    scale: [0.95, 1],
    duration: 600,
    easing: 'spring(1, 80, 10, 0)',
  })
}

/** Draws an SVG polyline checkmark via stroke-dashoffset animation */
export async function animateCheckmark(polylineEl: SVGPolylineElement) {
  const anime = await getAnime()
  const len = (polylineEl as unknown as SVGGeometryElement).getTotalLength?.() ?? 30
  polylineEl.style.strokeDasharray = String(len)
  polylineEl.style.strokeDashoffset = String(len)
  anime({
    targets: polylineEl,
    strokeDashoffset: [len, 0],
    duration: 350,
    easing: 'easeOutCubic',
  })
}
