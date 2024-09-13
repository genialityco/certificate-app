import { notifications } from '@mantine/notifications'

const notification = {
  success: ({ message }: { message: string }) => {
    notifications.show({
      color: 'green',
      title: 'Success',
      message,
    })
  },
  error: ({ message }: { message: string }) => {
    notifications.show({
      color: 'red',
      title: 'Error',
      message,
    })
  },
}

export default notification
