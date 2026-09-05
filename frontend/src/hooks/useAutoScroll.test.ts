import { act, renderHook } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useAutoScroll } from './useAutoScroll'

function makeScrollableDiv(scrollHeight: number, clientHeight: number) {
  const el = document.createElement('div')
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
  Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true })
  let scrollTop = 0
  Object.defineProperty(el, 'scrollTop', {
    get: () => scrollTop,
    set: (v) => {
      scrollTop = v
      el.dispatchEvent(new Event('scroll'))
    },
    configurable: true,
  })
  return el
}

describe('useAutoScroll', () => {
  it('reports 0 progress when there is nothing to scroll', () => {
    const el = makeScrollableDiv(500, 500)
    const ref = createRef<HTMLElement>()
    ref.current = el
    const { result } = renderHook(() => useAutoScroll(ref, 40, false))
    expect(result.current.progress).toBe(0)
  })

  it('tracks progress as a fraction of the scrollable distance', () => {
    const el = makeScrollableDiv(1000, 500) // 500px of scrollable distance
    const ref = createRef<HTMLElement>()
    ref.current = el
    const { result } = renderHook(() => useAutoScroll(ref, 40, false))

    act(() => {
      el.scrollTop = 250
    })
    expect(result.current.progress).toBe(0.5)
  })

  it('restart resets scrollTop to 0', () => {
    const el = makeScrollableDiv(1000, 500)
    const ref = createRef<HTMLElement>()
    ref.current = el
    const { result } = renderHook(() => useAutoScroll(ref, 40, false))

    act(() => {
      el.scrollTop = 400
    })
    expect(result.current.progress).toBe(0.8)

    act(() => {
      result.current.restart()
    })
    expect(el.scrollTop).toBe(0)
    expect(result.current.progress).toBe(0)
  })

  it('does not start the animation loop while paused', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    const el = makeScrollableDiv(1000, 500)
    const ref = createRef<HTMLElement>()
    ref.current = el
    renderHook(() => useAutoScroll(ref, 40, false))
    expect(raf).not.toHaveBeenCalled()
    raf.mockRestore()
  })

  it('starts the animation loop while playing', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    const el = makeScrollableDiv(1000, 500)
    const ref = createRef<HTMLElement>()
    ref.current = el
    renderHook(() => useAutoScroll(ref, 40, true))
    expect(raf).toHaveBeenCalled()
    raf.mockRestore()
  })
})
