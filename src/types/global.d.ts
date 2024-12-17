declare global {
  interface MyEvent {
    data(data: any): unknown
    _id: string
    name: string
    organization: string | { $oid: string }
    userProperties: UserProperty[]
    styles: {
      eventImage: string
    }
  }

  interface Attendee {
    eventId: string
    organization: string
    properties: Record<string, string>
  }

  interface UserProperty {
    label: string
    name: string
    type: string
    required: boolean
    show: boolean
  }

  interface Certificate {
    _id: string
    elements: unknown[]
    event: string
  }
}

export {}
