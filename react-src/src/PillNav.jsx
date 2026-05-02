import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

import './PillNav.css'

function PillNav({
  logo,
  logoAlt = '校园匹配',
  logoLabel = '校园匹配',
  items = [],
  activeHref,
  className = '',
  ease = 'power3.out',
  baseColor = '#f5faff',
  pillColor = '#07111f',
  hoveredPillTextColor = '#07111f',
  pillTextColor,
  onNavigate,
  onMobileMenuClick,
  initialLoadAnimation = true,
}) {
  const resolvedPillTextColor = pillTextColor ?? baseColor
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const circleRefs = useRef([])
  const tlRefs = useRef([])
  const activeTweenRefs = useRef([])
  const logoImgRef = useRef(null)
  const logoTweenRef = useRef(null)
  const hamburgerRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const navItemsRef = useRef(null)
  const logoRef = useRef(null)

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle) => {
        if (!circle?.parentElement) return

        const pill = circle.parentElement
        const { width: w, height: h } = pill.getBoundingClientRect()
        const radius = (w * w / 4 + h * h) / (2 * h)
        const diameter = Math.ceil(2 * radius) + 2
        const delta = Math.ceil(radius - Math.sqrt(Math.max(0, radius * radius - w * w / 4))) + 1
        const originY = diameter - delta

        circle.style.width = `${diameter}px`
        circle.style.height = `${diameter}px`
        circle.style.bottom = `-${delta}px`

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        })

        const label = pill.querySelector('.pill-label')
        const hoverLabel = pill.querySelector('.pill-label-hover')

        if (label) gsap.set(label, { y: 0 })
        if (hoverLabel) gsap.set(hoverLabel, { y: h + 12, opacity: 0 })

        const index = circleRefs.current.indexOf(circle)
        if (index === -1) return

        tlRefs.current[index]?.kill()
        const tl = gsap.timeline({ paused: true })

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0)

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0)
        }

        if (hoverLabel) {
          gsap.set(hoverLabel, { y: Math.ceil(h + 100), opacity: 0 })
          tl.to(hoverLabel, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0)
        }

        tlRefs.current[index] = tl
      })
    }

    layout()

    const onResize = () => layout()
    window.addEventListener('resize', onResize)
    document.fonts?.ready?.then(layout).catch(() => {})

    const menu = mobileMenuRef.current
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, y: 10, scaleY: 1 })
    }

    if (initialLoadAnimation) {
      if (logoRef.current) {
        gsap.set(logoRef.current, { scale: 0.88, opacity: 0 })
        gsap.to(logoRef.current, { scale: 1, opacity: 1, duration: 0.52, ease })
      }

      if (navItemsRef.current) {
        gsap.set(navItemsRef.current, { width: 0, overflow: 'hidden' })
        gsap.to(navItemsRef.current, {
          width: 'auto',
          duration: 0.58,
          ease,
          onComplete: () => gsap.set(navItemsRef.current, { clearProps: 'width,overflow' }),
        })
      }
    }

    const timelines = tlRefs.current
    const activeTweens = activeTweenRefs.current

    return () => {
      window.removeEventListener('resize', onResize)
      timelines.forEach((tl) => tl?.kill())
      activeTweens.forEach((tween) => tween?.kill())
      logoTweenRef.current?.kill()
    }
  }, [items, ease, initialLoadAnimation])

  const handleEnter = (index) => {
    const tl = tlRefs.current[index]
    if (!tl) return
    activeTweenRefs.current[index]?.kill()
    activeTweenRefs.current[index] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto',
    })
  }

  const handleLeave = (index) => {
    const tl = tlRefs.current[index]
    if (!tl) return
    activeTweenRefs.current[index]?.kill()
    activeTweenRefs.current[index] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto',
    })
  }

  const handleLogoEnter = () => {
    const target = logoImgRef.current || logoRef.current
    if (!target) return
    logoTweenRef.current?.kill()
    gsap.set(target, { rotate: 0 })
    logoTweenRef.current = gsap.to(target, {
      rotate: 360,
      duration: 0.24,
      ease,
      overwrite: 'auto',
    })
  }

  const animateMobileMenu = (open) => {
    const hamburger = hamburgerRef.current
    const menu = mobileMenuRef.current

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line')
      gsap.to(lines[0], { rotation: open ? 45 : 0, y: open ? 3 : 0, duration: 0.3, ease })
      gsap.to(lines[1], { rotation: open ? -45 : 0, y: open ? -3 : 0, duration: 0.3, ease })
    }

    if (!menu) return

    if (open) {
      gsap.set(menu, { visibility: 'visible' })
      gsap.fromTo(
        menu,
        { opacity: 0, y: 10, scaleY: 1 },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.3, ease, transformOrigin: 'top center' },
      )
      return
    }

    gsap.to(menu, {
      opacity: 0,
      y: 10,
      scaleY: 1,
      duration: 0.2,
      ease,
      transformOrigin: 'top center',
      onComplete: () => gsap.set(menu, { visibility: 'hidden' }),
    })
  }

  const toggleMobileMenu = () => {
    const nextOpen = !isMobileMenuOpen
    setIsMobileMenuOpen(nextOpen)
    animateMobileMenu(nextOpen)
    onMobileMenuClick?.()
  }

  const closeMobileMenu = () => {
    if (!isMobileMenuOpen) return
    setIsMobileMenuOpen(false)
    animateMobileMenu(false)
  }

  const isExternalLink = (href = '') =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')

  const handleLinkClick = (event, href) => {
    if (!href || isExternalLink(href)) return
    event.preventDefault()
    closeMobileMenu()
    onNavigate?.(href)
  }

  const cssVars = {
    '--base': baseColor,
    '--pill-bg': pillColor,
    '--hover-text': hoveredPillTextColor,
    '--pill-text': resolvedPillTextColor,
  }

  return (
    <div className="pill-nav-container">
      <nav className={`pill-nav ${className}`} aria-label="主要入口" style={cssVars}>
        <a
          className="pill-logo"
          href="/"
          aria-label="回到首页"
          onMouseEnter={handleLogoEnter}
          onClick={(event) => handleLinkClick(event, '/')}
          ref={(element) => {
            logoRef.current = element
          }}
        >
          {logo ? <img src={logo} alt={logoAlt} ref={logoImgRef} /> : <span aria-hidden="true">校</span>}
          <strong>{logoLabel}</strong>
        </a>

        <div className="pill-nav-items desktop-only" ref={navItemsRef}>
          <ul className="pill-list" role="menubar">
            {items.map((item, index) => (
              <li key={item.href || `item-${index}`} role="none">
                <a
                  role="menuitem"
                  href={item.href}
                  className={`pill${activeHref === item.href ? ' is-active' : ''}`}
                  aria-label={item.ariaLabel || item.label}
                  onClick={(event) => handleLinkClick(event, item.href)}
                  onMouseEnter={() => handleEnter(index)}
                  onMouseLeave={() => handleLeave(index)}
                >
                  <span
                    className="hover-circle"
                    aria-hidden="true"
                    ref={(element) => {
                      circleRefs.current[index] = element
                    }}
                  />
                  <span className="label-stack">
                    <span className="pill-label">{item.label}</span>
                    <span className="pill-label-hover" aria-hidden="true">
                      {item.label}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <button
          className="mobile-menu-button mobile-only"
          type="button"
          onClick={toggleMobileMenu}
          aria-label="打开导航菜单"
          aria-expanded={isMobileMenuOpen}
          ref={hamburgerRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
        <ul className="mobile-menu-list">
          {items.map((item, index) => (
            <li key={item.href || `mobile-item-${index}`}>
              <a
                href={item.href}
                className={`mobile-menu-link${activeHref === item.href ? ' is-active' : ''}`}
                onClick={(event) => handleLinkClick(event, item.href)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PillNav
