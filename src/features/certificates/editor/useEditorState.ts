import { useCallback, useRef, useState } from 'react'

import generateUniqueId from '@/utils/generateUniqueId'

import { ELEMENT_VERSION } from '../renderCertificate'
import { type CertificateElement } from '../types'

const HISTORY_LIMIT = 60

export const newTextElement = (
  type: 'text' | 'attribute',
  text: string,
  canvas: { width: number; height: number },
): CertificateElement => {
  const width = Math.round(canvas.width * 0.6)
  const fontSize = Math.max(Math.round(canvas.height / 22), 16)
  const height = Math.round(fontSize * 1.8)
  return {
    id: generateUniqueId(),
    version: ELEMENT_VERSION,
    type,
    text,
    x: Math.round((canvas.width - width) / 2),
    y: Math.round((canvas.height - height) / 2),
    width,
    height,
    opacity: 100,
    textJustify: false,
    textAlignHorizontal: 'center',
    textAlignVertical: 'middle',
    fontColorHex: '#1f1f1f',
    fontSize,
    fontFamily: 'Montserrat',
    fontStyle: 'normal',
    fontVariant: 'normal',
    fontWeight: type === 'attribute' ? 'bold' : 'normal',
    fontLineHeightRatio: 1.2,
  }
}

// Estado del editor con deshacer / rehacer
export function useEditorState(initial: CertificateElement[]) {
  const [elements, setElementsState] = useState<CertificateElement[]>(initial)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const past = useRef<CertificateElement[][]>([])
  const future = useRef<CertificateElement[][]>([])
  const current = useRef(initial)
  current.current = elements

  const snapshot = useCallback(() => {
    past.current = [...past.current, current.current].slice(-HISTORY_LIMIT)
    future.current = []
  }, [])

  // Cambio que queda en el historial
  const commit = useCallback(
    (updater: (prev: CertificateElement[]) => CertificateElement[]) => {
      snapshot()
      setElementsState((prev) => updater(prev))
      setDirty(true)
    },
    [snapshot],
  )

  // Cambio continuo (arrastrar); el historial se toma al empezar con snapshot()
  const live = useCallback((updater: (prev: CertificateElement[]) => CertificateElement[]) => {
    setElementsState((prev) => updater(prev))
    setDirty(true)
  }, [])

  const updateElement = useCallback(
    (id: string, patch: Partial<CertificateElement>) =>
      commit((prev) => prev.map((el) => (el.id === id ? { ...el, ...patch } : el))),
    [commit],
  )

  const addElement = useCallback(
    (element: CertificateElement) => {
      commit((prev) => [...prev, element])
      setSelectedId(element.id)
    },
    [commit],
  )

  const removeElement = useCallback(
    (id: string) => {
      commit((prev) => prev.filter((el) => el.id !== id))
      setSelectedId(null)
    },
    [commit],
  )

  const duplicateElement = useCallback(
    (id: string) => {
      const source = current.current.find((el) => el.id === id)
      if (!source || source.isBackground) return
      addElement({ ...source, id: generateUniqueId(), x: source.x + 20, y: source.y + 20 })
    },
    [addElement],
  )

  const moveLayer = useCallback(
    (id: string, direction: 1 | -1) =>
      commit((prev) => {
        const index = prev.findIndex((el) => el.id === id)
        const target = index + direction
        // El fondo siempre queda de primero
        if (index < 0 || target < 0 || target >= prev.length || prev[target].isBackground)
          return prev
        const next = [...prev]
        ;[next[index], next[target]] = [next[target], next[index]]
        return next
      }),
    [commit],
  )

  const undo = useCallback(() => {
    const previous = past.current.pop()
    if (!previous) return
    future.current = [current.current, ...future.current]
    setElementsState(previous)
    setDirty(true)
  }, [])

  const redo = useCallback(() => {
    const [next, ...rest] = future.current
    if (!next) return
    future.current = rest
    past.current = [...past.current, current.current]
    setElementsState(next)
    setDirty(true)
  }, [])

  return {
    elements,
    selectedId,
    setSelectedId,
    dirty,
    setDirty,
    snapshot,
    commit,
    live,
    updateElement,
    addElement,
    removeElement,
    duplicateElement,
    moveLayer,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  }
}

export type EditorState = ReturnType<typeof useEditorState>
