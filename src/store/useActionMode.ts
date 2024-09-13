import { create } from 'zustand'

import { type ActionMode, type ActionModeOption, type ActionModeType } from '@/config/types'

const useActionMode = create<{
  actionMode: ActionMode
  setActionMode: (params: null | { type: ActionModeType; option?: ActionModeOption | null }) => void
}>((set) => ({
  actionMode: null,
  setActionMode: (params) =>
    set(() => ({
      actionMode: params
        ? {
            type: params.type,
            option: params.option ?? null,
          }
        : null,
    })),
}))

export default useActionMode
