import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  Badge,
  Card,
  Group,
  Loader,
  Pagination,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  IconArrowsSort,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from '@tabler/icons-react'

import { AdminPage } from '@/features/admin/AdminLayout'
import { formatPersonName } from '@/features/admin/format'
import { type MemberDoc, type Paginated } from '@/features/certificates/types'
import { type MemberSort, searchOrganizationMembers } from '@/services/api/certificateAdminService'

// Clic en la columna: de mayor a menor -> de menor a mayor -> por nombre
const NEXT_SORT: Record<MemberSort, MemberSort> = {
  name: 'certificates_desc',
  certificates_desc: 'certificates_asc',
  certificates_asc: 'name',
}

export function MembersPage() {
  const { organizationId } = useParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 400)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<MemberSort>('name')
  const [data, setData] = useState<Paginated<MemberDoc> | null>(null)

  useEffect(() => setPage(1), [debouncedSearch, sort])

  useEffect(() => {
    if (!organizationId) return
    setData(null)
    searchOrganizationMembers(organizationId, { q: debouncedSearch, page, limit: 20, sort })
      .then(setData)
      .catch(() => setData({ items: [], totalItems: 0, totalPages: 0, currentPage: 1 }))
  }, [organizationId, debouncedSearch, page, sort])

  return (
    <AdminPage title="Miembros" description="Busca a una persona para ver sus datos y certificados">
      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="md">
          <TextInput
            placeholder="Nombre, correo o número de identificación"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={420}
            maw="100%"
            autoFocus
          />
          <Text size="sm" c="dimmed">
            {data ? `${data.totalItems.toLocaleString('es-CO')} miembros` : ''}
          </Text>
        </Group>
        {!data ? (
          <Loader color="brand" />
        ) : (
          <>
            <Table.ScrollContainer minWidth={700}>
              <Table highlightOnHover verticalSpacing="sm" fz="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nombre</Table.Th>
                    <Table.Th>Identificación</Table.Th>
                    <Table.Th>Correo</Table.Th>
                    <Table.Th>Celular</Table.Th>
                    <Table.Th ta="right">
                      <UnstyledButton
                        onClick={() => setSort((prev) => NEXT_SORT[prev])}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 700,
                        }}
                        title="Ordenar por número de certificados"
                      >
                        N.º de certificados
                        {sort === 'certificates_desc' ? (
                          <IconSortDescending size={16} color="#4d93d0" />
                        ) : sort === 'certificates_asc' ? (
                          <IconSortAscending size={16} color="#4d93d0" />
                        ) : (
                          <IconArrowsSort size={16} color="#9ca3af" />
                        )}
                      </UnstyledButton>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.items.map((member) => (
                    <Table.Tr
                      key={member._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/org/${organizationId}/members/${member._id}`)}
                    >
                      <Table.Td fw={600}>{formatPersonName(member.properties?.fullName)}</Table.Td>
                      <Table.Td>{member.properties?.idNumber || '—'}</Table.Td>
                      <Table.Td>{member.properties?.email || '—'}</Table.Td>
                      <Table.Td>{member.properties?.phone || '—'}</Table.Td>
                      <Table.Td ta="right">
                        <Badge variant="light" color={member.certificatesCount ? 'brand' : 'gray'}>
                          {member.certificatesCount ?? 0}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!data.items.length && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text c="dimmed" ta="center" py="lg">
                          Sin resultados
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {data.totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination total={data.totalPages} value={page} onChange={setPage} color="brand" />
              </Group>
            )}
          </>
        )}
      </Card>
    </AdminPage>
  )
}
