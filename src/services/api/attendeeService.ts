import api from './api'

export interface Attendee {
  userId: string
  firebaseUid: string | null
  organization: string | null
  properties: {
    fullName: string
    specialty: string
    idNumber: string
    phone: string
    profilePhoto: string
  } | null
}

// Obtener todos los attendees
export const fetchAttendees = async () => {
  try {
    const response = await api.get('/attendees')
    return response.data
  } catch (error) {
    console.error('Error fetching attendees:', error)
    throw error
  }
}

// Obtener un attendee por ID
export const fetchAttendeeById = async (id: any) => {
  try {
    const response = await api.get(`/attendees/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching attendee with ID ${id}:`, error)
    throw error
  }
}

// Crear un nuevo attendee
export const createAttendee = async (attendeeData: any) => {
  try {
    const response = await api.post('/attendees', attendeeData)
    return response.data
  } catch (error) {
    console.error('Error creating attendee:', error)
    throw error
  }
}

// Actualizar un attendee por ID
export const updateAttendee = async (id: any, attendeeData: any) => {
  try {
    const response = await api.put(`/attendees/${id}`, attendeeData)
    return response.data
  } catch (error) {
    console.error(`Error updating attendee with ID ${id}:`, error)
    throw error
  }
}

// Eliminar un attendee por ID
export const deleteAttendee = async (id: any) => {
  try {
    const response = await api.delete(`/attendees/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error deleting attendee with ID ${id}:`, error)
    throw error
  }
}

// Buscar attendees con filtros
export const searchAttendees = async (filters: any) => {
  try {
    const response = await api.get('/attendees/search', { params: filters })
    return response.data
  } catch (error) {
    console.error('Error searching attendees with filters:', error)
    throw error
  }
}

export const registerAttendee = async (attendeeData: Partial<Attendee>) => {
  try {
    const response = await api.post('/attendees/register', attendeeData)
    return response.data
  } catch (error) {
    console.error('Error registering attendee:', error)
    throw error
  }
}

// Incrementar certificateDownloads por userId o memberId
export const incrementCertificateDownload = async (payload: { attendeeId?: string }) => {
  try {
    console.log('Incrementing certificateDownloads with payload:', payload)
    const response = await api.put('/attendees/certificate-download', payload)
    console.log('Response from incrementCertificateDownload:', response.data)
    return response.data
  } catch (error) {
    console.error('Error incrementing certificateDownloads:', error)
    throw error
  }
}
export const addOrCreateAttendee = async (payload: any) => {
  try {
    const response = await api.post('/users/attendees', payload)
    return response.data
  } catch (error) {
    console.error('Error adding or creating attendee:', error)
    throw error
  }
}
