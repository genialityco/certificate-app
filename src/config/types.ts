type ActionModeType =
  | 'isDrawing'
  | 'isPanning'
  | 'isMoving'
  | 'isResizing'
  | 'isRotating'
  | 'isWriting'
type ActionModeOption =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'middleLeft'
  | 'middleRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'

type ActionMode = null | {
  type: ActionModeType
  option: ActionModeOption | null
}

type CanvasObjectType =
  | 'rectangle'
  | 'ellipse'
  | 'free-draw'
  | 'line'
  | 'arrow'
  | 'text'
  | 'icon'
  | 'image'
  | 'attribute'

type UserMode = 'select' | CanvasObjectType

interface CanvasObject {
  // Common
  type: CanvasObjectType
  id: string
  x: number
  y: number
  width: number
  height: number
  opacity: number
  // Type specific
  backgroundColorHex: string
  strokeColorHex: string
  strokeWidth: number
  borderRadius: number
  freeDrawPoints: { x: number; y: number }[] // 'free-draw' only
  text: string // 'text' only
  textJustify: boolean // 'text' only
  textAlignHorizontal: 'left' | 'center' | 'right' // 'text' only
  textAlignVertical: 'top' | 'middle' | 'bottom' // 'text' only
  fontColorHex: string // 'text' only
  fontSize: number // 'text' only
  fontFamily: string // 'text' only
  fontStyle: 'normal' | 'italic' | 'oblique' // 'text' only
  fontVariant: 'normal' | 'small-caps' // 'text' only
  fontWeight:
    | 'normal'
    | 'bold'
    | 'bolder'
    | 'lighter'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900' // 'text' only
  fontLineHeightRatio: number // 'text' only
  svgPath: string // 'icon' only
  imageUrl: string // 'image' only
  imageElement: HTMLImageElement | null // 'image' only
}

type ObjectCommonProperties = Pick<CanvasObject, 'x' | 'y' | 'width' | 'height' | 'opacity'> & {
  id?: string
}

type RectangleObject = ObjectCommonProperties & {
  type: 'rectangle'
} & Pick<CanvasObject, 'backgroundColorHex' | 'strokeColorHex' | 'strokeWidth' | 'borderRadius'>

type EllipseObject = ObjectCommonProperties & {
  type: 'ellipse'
} & Pick<CanvasObject, 'backgroundColorHex' | 'strokeColorHex' | 'strokeWidth' | 'borderRadius'>

type FreeDrawObject = ObjectCommonProperties & {
  type: 'free-draw'
} & Pick<CanvasObject, 'strokeColorHex' | 'strokeWidth' | 'freeDrawPoints'>

type TextObject = ObjectCommonProperties & {
  type: 'text'
} & Pick<
    CanvasObject,
    | 'text'
    | 'textJustify'
    | 'textAlignHorizontal'
    | 'textAlignVertical'
    | 'fontColorHex'
    | 'fontSize'
    | 'fontFamily'
    | 'fontStyle'
    | 'fontVariant'
    | 'fontWeight'
    | 'fontLineHeightRatio'
  >

type IconObject = ObjectCommonProperties & {
  type: 'icon'
} & Pick<CanvasObject, 'backgroundColorHex' | 'svgPath'>

type ImageObject = ObjectCommonProperties & {
  type: 'image'
} & Pick<CanvasObject, 'imageUrl' | 'imageElement'>

type AttributeObject = ObjectCommonProperties & {
  type: 'attribute'
} & Pick<
    CanvasObject,
    | 'text'
    | 'fontColorHex'
    | 'fontSize'
    | 'fontFamily'
    | 'fontStyle'
    | 'fontVariant'
    | 'fontWeight'
    | 'fontLineHeightRatio'
  >

interface UnsplashImage {
  id: string
  width: number
  height: number
  description: string
  unsplashUrl: string
  urls: {
    large: string
    medium: string
    small: string
  }
  author: {
    name: string
    url: string
  }
  query: string
  fetchedAt: string
}

interface ScrollPosition {
  x: number
  y: number
}

interface CanvasWorkingSize {
  width: number
  height: number
}

interface ObjectDimensions {
  x: number
  y: number
  width: number
  height: number
}

type ColorPickerType =
  | 'AlphaPicker'
  | 'BlockPicker'
  | 'ChromePicker'
  | 'CirclePicker'
  | 'CompactPicker'
  | 'GithubPicker'
  | 'HuePicker'
  | 'MaterialPicker'
  | 'PhotoshopPicker'
  | 'SketchPicker'
  | 'SliderPicker'
  | 'SwatchesPicker'
  | 'TwitterPicker'

export type {
  ActionModeType,
  ActionModeOption,
  ActionMode,
  UserMode,
  CanvasObject,
  RectangleObject,
  EllipseObject,
  FreeDrawObject,
  TextObject,
  IconObject,
  ImageObject,
  AttributeObject,
  UnsplashImage,
  ScrollPosition,
  CanvasWorkingSize,
  ObjectDimensions,
  ColorPickerType,
}
