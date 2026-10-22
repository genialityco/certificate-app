import { useEffect, useState } from 'react'

import { Group, Pagination, Select, Text } from '@mantine/core'

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100]

// Paginación en el navegador para listas que ya están cargadas completas
export function usePagedList<T>(items: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1)

  useEffect(() => setPage(1), [pageSize, items.length])

  return {
    visible: items.slice((page - 1) * pageSize, page * pageSize),
    page: Math.min(page, totalPages),
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    total: items.length,
  }
}

interface Props {
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  totalPages: number
  total: number
  noun: string
  sizes?: number[]
}

export function ListPager({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalPages,
  total,
  noun,
  sizes = PAGE_SIZE_OPTIONS,
}: Props) {
  if (!total) return null
  return (
    <Group justify="space-between" mt="md" gap="sm">
      <Group gap="xs">
        <Text size="sm" c="dimmed">
          Mostrar
        </Text>
        <Select
          size="xs"
          w={80}
          data={sizes.map(String)}
          value={String(pageSize)}
          onChange={(value) => value && setPageSize(Number(value))}
          allowDeselect={false}
          aria-label={`${noun} por página`}
        />
        <Text size="sm" c="dimmed">
          de {total.toLocaleString('es-CO')} {noun}
        </Text>
      </Group>
      {totalPages > 1 && (
        <Pagination total={totalPages} value={page} onChange={setPage} color="brand" size="sm" />
      )}
    </Group>
  )
}
