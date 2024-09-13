import axios from 'axios'

// Define la URL base para la API
const API_URL = 'https://back-certificados.vercel.app/api'
// const API_URL = 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  // headers: {
  //   Authorization: `Bearer ${localStorage.getItem('token')}`,
  // },
})

// Clase de servicios API
export class ApiServices {
  // Rutas reutilizables
  private EVENT_API = '/events'
  private CERTIFICATE_API = '/certificates'
  private ATTENDEE_API = '/attendees'

  // API para búsqueda global
  fetchFilteredGlobal = async <T extends Record<string, unknown>>(
    collection: string,
    filters: Record<string, unknown>,
  ): Promise<T[]> => {
    const response = await axiosInstance.get(`/search/${collection}`, { params: filters })

    // Si la respuesta no es un array, lo envolvemos en un array
    return Array.isArray(response.data) ? response.data : [response.data]
  }

  // API para eventos
  fetchAllEvents = async (): Promise<MyEvent[]> => {
    const response = await axiosInstance.get(this.EVENT_API)
    return response.data
  }

  fetchEventById = async (eventId: string): Promise<MyEvent> => {
    const response = await axiosInstance.get(`${this.EVENT_API}/${eventId}`)
    return response.data
  }

  createEvent = async (eventData: Event): Promise<MyEvent> => {
    const response = await axiosInstance.post(this.EVENT_API, eventData)
    return response.data
  }

  deleteEvent = async (eventId: string): Promise<void> => {
    await axiosInstance.delete(`${this.EVENT_API}/${eventId}`)
  }

  // API para certificados
  createCertificate = async (eventId: string, elements: unknown): Promise<Certificate> => {
    const response = await axiosInstance.post(this.CERTIFICATE_API, { elements, eventId })
    return response.data
  }

  updateCertificate = async (certificateId: string, elements: unknown): Promise<Certificate> => {
    const response = await axiosInstance.put(`${this.CERTIFICATE_API}/${certificateId}`, {
      elements,
    })
    return response.data
  }

  // API para asistentes
  addAttendee = async (attendeeData: Attendee): Promise<Attendee> => {
    const response = await axiosInstance.post(this.ATTENDEE_API, attendeeData)
    return response.data
  }

  updateAttendee = async (attendeeId: string, attendeeData: Attendee): Promise<Attendee> => {
    const response = await axiosInstance.put(`${this.ATTENDEE_API}/${attendeeId}`, attendeeData)
    return response.data
  }

  deleteAttendee = async (attendeeId: string): Promise<void> => {
    const response = await axiosInstance.delete(`${this.ATTENDEE_API}/${attendeeId}`)

    return response.data
  }
}
