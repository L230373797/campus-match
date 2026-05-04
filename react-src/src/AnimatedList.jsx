import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

import './AnimatedList.css'

function AnimatedItem({ children, delay = 0, index, onMouseEnter, onClick, selected }) {
  const ref = useRef(null)

  return (
    <motion.div
      ref={ref}
      className={`animated-list-motion ${selected ? 'selected' : ''}`}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.96, opacity: 0, y: 22, filter: 'blur(10px)' }}
      animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.46, delay, ease: [0.2, 0.78, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedList({
  items = [],
  renderItem,
  getItemKey,
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
}) {
  const listRef = useRef(null)
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex)
  const [keyboardNav, setKeyboardNav] = useState(false)
  const [topGradientOpacity, setTopGradientOpacity] = useState(0)
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1)

  const handleItemMouseEnter = useCallback((index) => {
    setSelectedIndex(index)
  }, [])

  const handleItemClick = useCallback(
    (item, index) => {
      setSelectedIndex(index)
      onItemSelect?.(item, index)
    },
    [onItemSelect],
  )

  const handleScroll = useCallback((event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target
    const bottomDistance = scrollHeight - (scrollTop + clientHeight)

    setTopGradientOpacity(Math.min(scrollTop / 50, 1))
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1))
  }, [])

  useEffect(() => {
    if (!enableArrowNavigation) return undefined

    const handleKeyDown = (event) => {
      if (!listRef.current?.contains(document.activeElement)) return

      if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
        event.preventDefault()
        setKeyboardNav(true)
        setSelectedIndex((current) => Math.min(current + 1, items.length - 1))
      } else if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
        event.preventDefault()
        setKeyboardNav(true)
        setSelectedIndex((current) => Math.max(current - 1, 0))
      } else if (event.key === 'Enter' && selectedIndex >= 0 && selectedIndex < items.length) {
        event.preventDefault()
        onItemSelect?.(items[selectedIndex], selectedIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableArrowNavigation, items, onItemSelect, selectedIndex])

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return

    const container = listRef.current
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`)
    if (selectedItem) {
      const extraMargin = 42
      const itemTop = selectedItem.offsetTop
      const itemBottom = itemTop + selectedItem.offsetHeight
      const visibleTop = container.scrollTop + extraMargin
      const visibleBottom = container.scrollTop + container.clientHeight - extraMargin

      if (itemTop < visibleTop) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' })
      } else if (itemBottom > visibleBottom) {
        container.scrollTo({ top: itemBottom - container.clientHeight + extraMargin, behavior: 'smooth' })
      }
    }

    setKeyboardNav(false)
  }, [keyboardNav, selectedIndex])

  return (
    <div className={`scroll-list-container ${className}`}>
      <div
        ref={listRef}
        className={`scroll-list ${!displayScrollbar ? 'no-scrollbar' : ''}`}
        onScroll={handleScroll}
        tabIndex={0}
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={getItemKey ? getItemKey(item, index) : index}
            delay={Math.min(index * 0.04, 0.2)}
            index={index}
            selected={selectedIndex === index}
            onMouseEnter={() => handleItemMouseEnter(index)}
            onClick={() => handleItemClick(item, index)}
          >
            <div className={`animated-list-item ${selectedIndex === index ? 'selected' : ''} ${itemClassName}`}>
              {renderItem ? renderItem(item, index, selectedIndex === index) : <p className="item-text">{item}</p>}
            </div>
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div className="top-gradient" style={{ opacity: topGradientOpacity }} />
          <div className="bottom-gradient" style={{ opacity: bottomGradientOpacity }} />
        </>
      )}
    </div>
  )
}

export default AnimatedList
