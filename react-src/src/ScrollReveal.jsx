import { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './ScrollReveal.css'

gsap.registerPlugin(ScrollTrigger)

const tokenPattern = /([A-Za-z0-9@._-]+|[\s]+|.)/gu
const closingPunctuationPattern = /^[，。！？；：、）】》」』,.!?;:)]$/

function splitText(text) {
  return Array.from(text.matchAll(tokenPattern), (match) => match[0]).reduce((segments, segment) => {
    if (closingPunctuationPattern.test(segment) && segments.length > 0 && !/^\s+$/.test(segments.at(-1))) {
      segments[segments.length - 1] += segment
      return segments
    }
    segments.push(segment)
    return segments
  }, [])
}

function ScrollReveal({
  as: Component = 'h2',
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.08,
  baseRotation = 0,
  blurStrength = 5,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom 54%',
  wordAnimationEnd = 'bottom 46%',
  scrub = 1.25,
  stagger = 0.02,
}) {
  const containerRef = useRef(null)

  const splitChildren = useMemo(() => {
    const text = typeof children === 'string' ? children.replace(/\s+/g, ' ').trim() : ''
    return splitText(text).map((segment, index) => {
      if (/^\s+$/.test(segment)) return segment
      return (
        <span className="scroll-reveal-word" key={`${segment}-${index}`}>
          {segment}
        </span>
      )
    })
  }, [children])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined

    const scroller = scrollContainerRef?.current || window
    const wordElements = el.querySelectorAll('.scroll-reveal-word')

    const ctx = gsap.context(() => {
      if (baseRotation) {
        gsap.fromTo(
          el,
          { transformOrigin: '0% 50%', rotate: baseRotation },
          {
            ease: 'none',
            rotate: 0,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: 'top 92%',
              end: rotationEnd,
              scrub,
            },
          },
        )
      }

      gsap.fromTo(
        wordElements,
        {
          opacity: baseOpacity,
          y: 18,
          willChange: 'opacity, transform, filter',
        },
        {
          ease: 'none',
          opacity: 1,
          y: 0,
          stagger,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top 92%',
            end: wordAnimationEnd,
            scrub,
          },
        },
      )

      if (enableBlur) {
        gsap.fromTo(
          wordElements,
          { filter: `blur(${blurStrength}px)` },
          {
            ease: 'none',
            filter: 'blur(0px)',
            stagger,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: 'top 92%',
              end: wordAnimationEnd,
              scrub,
            },
          },
        )
      }
    }, el)

    return () => ctx.revert()
  }, [
    scrollContainerRef,
    enableBlur,
    baseRotation,
    baseOpacity,
    rotationEnd,
    wordAnimationEnd,
    blurStrength,
    scrub,
    stagger,
  ])

  return (
    <Component ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
      <span className={`scroll-reveal-text ${textClassName}`}>{splitChildren}</span>
    </Component>
  )
}

export default ScrollReveal
