import { create } from 'zustand'

import { type CanvasWorkingSize } from '@/config/types'

const DEFAULT_CANVAS_WORKING_SIZE = {
  width: 1920,
  height: 1080,
}

const useCanvasWorkingSize = create<{
  canvasWorkingSize: CanvasWorkingSize
  setCanvasWorkingWidth: (width: number) => void
  setCanvasWorkingHeight: (height: number) => void
}>((set) => ({
  canvasWorkingSize: {
    width: DEFAULT_CANVAS_WORKING_SIZE.width,
    height: DEFAULT_CANVAS_WORKING_SIZE.height,
  },
  setCanvasWorkingWidth: (width: number) =>
    set((state) => ({ ...state, canvasWorkingSize: { ...state.canvasWorkingSize, width } })),
  setCanvasWorkingHeight: (height: number) =>
    set((state) => ({ ...state, canvasWorkingSize: { ...state.canvasWorkingSize, height } })),
}))

export default useCanvasWorkingSize
