import api from '@/services/api/api'

const SESSION_KEY = 'certificate-admin-session'
const ORG_KEY = 'certificate-admin-organization'

type AdminSession = { token: string; expiresAt: number }

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn()
  } catch {
    return fallback
  }
}

const readSession = () => {
  const session = safe<AdminSession | null>(
    () => JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null'),
    null,
  )
  return session?.token && session.expiresAt > Date.now() ? session : null
}

const loginAdmin = async (password: string) => {
  const { data } = await api.post<{ data: AdminSession }>('/certificate-admin/session', {
    password,
  })
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.data))
}

const isAdminLogged = () => Boolean(readSession())

const adminAuthorization = () => {
  const session = readSession()
  if (!session) throw new Error('La sesión del panel expiró. Vuelve a ingresar.')
  return { Authorization: `Bearer ${session.token}` }
}

const logoutAdmin = () => safe(() => sessionStorage.removeItem(SESSION_KEY), undefined)

const rememberOrganization = (organizationId: string) =>
  safe(() => localStorage.setItem(ORG_KEY, organizationId), undefined)

const lastOrganization = () => safe(() => localStorage.getItem(ORG_KEY), null)

export {
  adminAuthorization,
  isAdminLogged,
  lastOrganization,
  loginAdmin,
  logoutAdmin,
  rememberOrganization,
}
