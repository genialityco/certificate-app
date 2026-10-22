// Sesión del administrador. Usa la misma contraseña que ya tenía la app.
const SESSION_KEY = 'certificate-admin-session'
const ORG_KEY = 'certificate-admin-organization'
export const ADMIN_PASSWORD = 'admin123'

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const loginAdmin = (password: string) => {
  if (password !== ADMIN_PASSWORD) return false
  safe(() => sessionStorage.setItem(SESSION_KEY, '1'), undefined)
  return true
}

export const isAdminLogged = () => safe(() => sessionStorage.getItem(SESSION_KEY) === '1', false)

export const logoutAdmin = () => safe(() => sessionStorage.removeItem(SESSION_KEY), undefined)

export const rememberOrganization = (organizationId: string) =>
  safe(() => localStorage.setItem(ORG_KEY, organizationId), undefined)

export const lastOrganization = () => safe(() => localStorage.getItem(ORG_KEY), null)
