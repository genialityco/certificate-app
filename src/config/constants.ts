import { type ColorPickerType } from '@/config/types'

const TRANSPARENT_BACKGROUND_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAABlBMVEUAAADY2NjnFMi2AAAAAXRSTlMAQObYZgAAABVJREFUGNNjYIQDBgQY0oLDxBsIQQCltADJNa/7sQAAAABJRU5ErkJggg=='

const COLOR_PICKERS: ColorPickerType[] = [
  'SketchPicker',
  'ChromePicker',
  'SwatchesPicker',
  'TwitterPicker',
  'BlockPicker',
  'CompactPicker',
  'GithubPicker',
  'CirclePicker',
  'PhotoshopPicker',
  'HuePicker',
]

export { TRANSPARENT_BACKGROUND_IMAGE, COLOR_PICKERS }
