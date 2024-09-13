const xs = 0
const sm = 600
const md = 900
const lg = 1200
const xl = 1536

const extraSmall = `@media (max-width: ${sm - 1}px)`
const small = `@media (min-width: ${sm}px) and (max-width: ${md - 1}px)`
const medium = `@media (min-width: ${md}px) and (max-width: ${lg - 1}px)`
const large = `@media (min-width: ${lg}px) and (max-width: ${xl - 1}px)`
const extraLarge = `@media (min-width: ${xl}px)`

const gteSmall = `@media (min-width: ${sm}px)`
const gteMedium = `@media (min-width: ${md}px)`
const gteLarge = `@media (min-width: ${lg}px)`

const lteSmall = `@media (max-width: ${md - 1}px)`
const lteMedium = `@media (max-width: ${lg - 1}px)`
const lteLarge = `@media (max-width: ${xl - 1}px)`

export {
  xs,
  sm,
  md,
  lg,
  xl,
  extraSmall,
  small,
  medium,
  large,
  extraLarge,
  gteSmall,
  gteMedium,
  gteLarge,
  lteSmall,
  lteMedium,
  lteLarge,
}
