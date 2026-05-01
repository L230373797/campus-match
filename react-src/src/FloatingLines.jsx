import { useEffect, useMemo, useRef } from 'react'

import './FloatingLines.css'

const DEFAULT_ENABLED_WAVES = ['top', 'middle', 'bottom']
const DEFAULT_LINE_COUNT = [4, 6, 4]
const DEFAULT_LINE_DISTANCE = [9, 7, 10]
const DEFAULT_BOTTOM_POSITION = { x: 2.0, y: -0.7, rotate: -1 }
const WAVE_BASE_Y = {
  top: 0.24,
  middle: 0.52,
  bottom: 0.76,
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(start, end, amount) {
  return start + (end - start) * amount
}

function parseHexColor(hex) {
  let value = String(hex || '').trim()
  if (value.startsWith('#')) value = value.slice(1)

  if (value.length === 3) {
    value = value
      .split('')
      .map((part) => part + part)
      .join('')
  }

  const number = Number.parseInt(value.padEnd(6, 'f').slice(0, 6), 16)
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  }
}

function mixColor(start, end, amount) {
  return {
    r: Math.round(lerp(start.r, end.r, amount)),
    g: Math.round(lerp(start.g, end.g, amount)),
    b: Math.round(lerp(start.b, end.b, amount)),
  }
}

function colorAt(stops, amount) {
  if (!stops.length) return { r: 115, g: 231, b: 255 }
  if (stops.length === 1) return stops[0]

  const scaled = clamp(amount, 0, 0.999) * (stops.length - 1)
  const index = Math.floor(scaled)
  return mixColor(stops[index], stops[index + 1], scaled - index)
}

function toRgba(color, alpha) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
}

export default function FloatingLines({
  className = '',
  linesGradient,
  gradientStart = '#e945f5',
  gradientMid = '#73e7ff',
  gradientEnd = '#ffd8e7',
  enabledWaves = DEFAULT_ENABLED_WAVES,
  lineCount = DEFAULT_LINE_COUNT,
  lineDistance = DEFAULT_LINE_DISTANCE,
  topWavePosition,
  middleWavePosition,
  bottomWavePosition = DEFAULT_BOTTOM_POSITION,
  animationSpeed = 0.7,
  interactive = true,
  bendRadius = 5.0,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.12,
  lineOpacity = 0.34,
  mixBlendMode = 'screen',
}) {
  const containerRef = useRef(null)

  const gradientStops = useMemo(() => {
    const colors = linesGradient?.length ? linesGradient : [gradientStart, gradientMid, gradientEnd]
    return colors.filter(Boolean).map(parseHexColor)
  }, [gradientEnd, gradientMid, gradientStart, linesGradient])

  const enabledWavesKey = enabledWaves.join('|')
  const lineCountKey = Array.isArray(lineCount) ? lineCount.join('|') : String(lineCount)
  const lineDistanceKey = Array.isArray(lineDistance) ? lineDistance.join('|') : String(lineDistance)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return undefined

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return undefined

    container.appendChild(canvas)

    let active = true
    let raf = 0
    let width = 1
    let height = 1
    let dpr = 1
    const startedAt = performance.now()
    const targetMouse = { x: -1000, y: -1000 }
    const currentMouse = { x: -1000, y: -1000 }
    const targetParallax = { x: 0, y: 0 }
    const currentParallax = { x: 0, y: 0 }
    let targetInfluence = 0
    let currentInfluence = 0

    const waves = {
      top: {
        count: getLineCount('top'),
        distance: getLineDistance('top'),
        position: { x: 10, y: 0.5, rotate: -0.4, ...topWavePosition },
        strength: 0.5,
        direction: -1,
      },
      middle: {
        count: getLineCount('middle'),
        distance: getLineDistance('middle'),
        position: { x: 5, y: 0, rotate: 0.2, ...middleWavePosition },
        strength: 0.96,
        direction: 1,
      },
      bottom: {
        count: getLineCount('bottom'),
        distance: getLineDistance('bottom'),
        position: { x: 2, y: -0.7, rotate: 0.4, ...bottomWavePosition },
        strength: 0.64,
        direction: 1,
      },
    }

    function getLineCount(waveType) {
      if (!enabledWaves.includes(waveType)) return 0
      if (typeof lineCount === 'number') return clamp(lineCount, 0, 24)
      const index = enabledWaves.indexOf(waveType)
      return clamp(lineCount[index] ?? 6, 0, 24)
    }

    function getLineDistance(waveType) {
      if (typeof lineDistance === 'number') return lineDistance
      const index = enabledWaves.indexOf(waveType)
      return lineDistance[index] ?? 8
    }

    function resize() {
      if (!active) return
      const rect = container.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function handlePointerMove(event) {
      const rect = container.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      targetMouse.x = x
      targetMouse.y = y
      targetInfluence = 1

      if (parallax) {
        targetParallax.x = ((x - rect.width / 2) / rect.width) * parallaxStrength
        targetParallax.y = ((y - rect.height / 2) / rect.height) * parallaxStrength
      }
    }

    function handlePointerLeave() {
      targetInfluence = 0
      targetParallax.x = 0
      targetParallax.y = 0
    }

    function drawWave(waveType, time) {
      const wave = waves[waveType]
      if (!wave?.count) return

      const count = wave.count
      const baseY = height * (WAVE_BASE_Y[waveType] + wave.position.y * 0.045)
      const samples = Math.max(38, Math.round(width / 28))
      const startX = -width * 0.12
      const endX = width * 1.12
      const span = endX - startX

      context.save()
      context.globalCompositeOperation = 'lighter'
      context.lineCap = 'round'
      context.lineJoin = 'round'

      for (let index = 0; index < count; index += 1) {
        const lineT = count <= 1 ? 0.5 : index / (count - 1)
        const color = colorAt(gradientStops, lineT)
        const alpha = lineOpacity * wave.strength * (0.48 + lineT * 0.48)
        const phase = time * (0.52 + wave.strength * 0.08) + index * wave.distance * 0.17 + wave.position.x * 0.08
        const amplitude = height * (0.044 + 0.018 * Math.sin(time * 0.5 + index * 0.72))
        const laneOffset = (index - (count - 1) / 2) * wave.distance * 2.15

        context.beginPath()
        for (let sample = 0; sample <= samples; sample += 1) {
          const amount = sample / samples
          const x = startX + span * amount
          const normalizedX = (amount - 0.5) * 2
          const curve =
            Math.sin(normalizedX * 3.2 + phase) * amplitude +
            Math.sin(normalizedX * 7.6 + phase * 0.7) * amplitude * 0.18
          const slope = normalizedX * wave.position.rotate * height * 0.08
          const parallaxX = currentParallax.x * width * wave.direction
          const parallaxY = currentParallax.y * height * 0.55
          let y = baseY + laneOffset + curve + slope + parallaxY

          if (interactive && currentInfluence > 0.01) {
            const dx = (x + parallaxX - currentMouse.x) / width
            const dy = (y - currentMouse.y) / height
            const influence = Math.exp(-(dx * dx + dy * dy) * bendRadius * 13) * currentInfluence
            y += (currentMouse.y - y) * influence * bendStrength * 0.16
          }

          if (sample === 0) {
            context.moveTo(x + parallaxX, y)
          } else {
            context.lineTo(x + parallaxX, y)
          }
        }

        context.lineWidth = 0.75 + lineT * 1.45
        context.shadowColor = toRgba(color, alpha * 0.78)
        context.shadowBlur = 10 + lineT * 18
        context.strokeStyle = toRgba(color, alpha)
        context.stroke()
      }

      context.restore()
    }

    function render() {
      if (!active) return

      const now = performance.now()
      const time = ((now - startedAt) / 1000) * animationSpeed

      currentMouse.x = lerp(currentMouse.x, targetMouse.x, mouseDamping)
      currentMouse.y = lerp(currentMouse.y, targetMouse.y, mouseDamping)
      currentInfluence = lerp(currentInfluence, targetInfluence, mouseDamping)
      currentParallax.x = lerp(currentParallax.x, targetParallax.x, mouseDamping)
      currentParallax.y = lerp(currentParallax.y, targetParallax.y, mouseDamping)

      context.clearRect(0, 0, width, height)
      drawWave('bottom', time)
      drawWave('middle', time)
      drawWave('top', time)

      raf = requestAnimationFrame(render)
    }

    resize()
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            resize()
          })
        : null
    resizeObserver?.observe(container)

    if (interactive) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true })
      window.addEventListener('pointerleave', handlePointerLeave)
    }

    render()

    return () => {
      active = false
      cancelAnimationFrame(raf)
      resizeObserver?.disconnect()

      if (interactive) {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerleave', handlePointerLeave)
      }

      canvas.remove()
    }
  }, [
    animationSpeed,
    bendRadius,
    bendStrength,
    bottomWavePosition,
    enabledWaves,
    enabledWavesKey,
    gradientStops,
    interactive,
    lineCount,
    lineCountKey,
    lineDistance,
    lineDistanceKey,
    lineOpacity,
    middleWavePosition,
    mouseDamping,
    parallax,
    parallaxStrength,
    topWavePosition,
  ])

  return (
    <div
      ref={containerRef}
      className={`floating-lines-container ${className}`}
      style={{
        mixBlendMode,
      }}
    />
  )
}
