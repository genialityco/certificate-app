import { FC } from 'react'
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom'

import { Spinner } from '@/components'

const RouterStack = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path="/"
        lazy={async () => {
          const { Home } = await import('@/pages/Home')
          return {
            Component: Home,
          }
        }}
      />
      <Route
        path="*"
        lazy={async () => {
          const { NotFound } = await import('@/pages/NotFound')
          return {
            Component: NotFound,
          }
        }}
      />
      <Route
        path="/dashboard/organizations"
        lazy={async () => {
          const { OrganizationsList } = await import('@/pages/Dashboard/OrganizationsList')
          return {
            Component: OrganizationsList,
          }
        }}
      />
      <Route
        path="/dashboard/organization/:organizationId/events"
        lazy={async () => {
          const { Dashboard } = await import('@/pages/Dashboard/Dashboard')
          return {
            Component: Dashboard,
          }
        }}
      />
      {/* El editor anterior creaba certificados duplicados: ahora lleva al nuevo */}
      <Route
        path="/design/:eventId"
        lazy={async () => {
          const { DesignRedirect } = await import('@/pages/Admin/DesignRedirect')
          return { Component: DesignRedirect }
        }}
      />
      <Route
        path="/design-legacy/:eventId"
        lazy={async () => {
          const { Design } = await import('@/pages/Design')
          return {
            Component: Design,
          }
        }}
      />
      <Route
        path="/consulta/:organizationId"
        lazy={async () => {
          const { ConsultPage } = await import('@/pages/Public/ConsultPage')
          return { Component: ConsultPage }
        }}
      />
      <Route
        path="/admin"
        lazy={async () => {
          const { AdminLayout } = await import('@/features/admin/AdminLayout')
          return { Component: AdminLayout }
        }}
      >
        <Route
          index
          lazy={async () => {
            const { AdminHome } = await import('@/pages/Admin/AdminHome')
            return { Component: AdminHome }
          }}
        />
        <Route path="org/:organizationId">
          <Route
            index
            lazy={async () => {
              const { OrganizationDashboard } = await import('@/pages/Admin/OrganizationDashboard')
              return { Component: OrganizationDashboard }
            }}
          />
          <Route
            path="events"
            lazy={async () => {
              const { EventsPage } = await import('@/pages/Admin/EventsPage')
              return { Component: EventsPage }
            }}
          />
          <Route
            path="events/:eventId/certificate"
            lazy={async () => {
              const { EventCertificatePage } = await import('@/pages/Admin/EventCertificatePage')
              return { Component: EventCertificatePage }
            }}
          />
          <Route
            path="events/:eventId/attendees"
            lazy={async () => {
              const { EventAttendeesPage } = await import('@/pages/Admin/EventAttendeesPage')
              return { Component: EventAttendeesPage }
            }}
          />
          <Route
            path="members"
            lazy={async () => {
              const { MembersPage } = await import('@/pages/Admin/MembersPage')
              return { Component: MembersPage }
            }}
          />
          <Route
            path="members/:memberId"
            lazy={async () => {
              const { MemberDetailPage } = await import('@/pages/Admin/MemberDetailPage')
              return { Component: MemberDetailPage }
            }}
          />
        </Route>
      </Route>
      <Route
        path="/event/users/:eventId"
        lazy={async () => {
          const { DataTable } = await import('@/pages/Dashboard/DataTable')
          return {
            Component: DataTable,
          }
        }}
      />
      <Route
        path="/event/analytics/:eventId"
        lazy={async () => {
          const { CertificateDownloadsTable } = await import(
            '@/pages/Dashboard/CertificateDownloadsTable'
          )
          return {
            Component: CertificateDownloadsTable,
          }
        }}
      />
      <Route
        path="/event/:eventId/certificate/:certificateId"
        lazy={async () => {
          const { ConsultCertificate } = await import('@/pages/Certificate')
          return {
            Component: ConsultCertificate,
          }
        }}
      />
      <Route
        path="/certificate/:certificateId/:attendeeId"
        lazy={async () => {
          const { GenerateCertificate } = await import('@/pages/Certificate')
          return {
            Component: GenerateCertificate,
          }
        }}
      />
      <Route
        path="/integracion/:organizationId/:eventId"
        lazy={async () => {
          const { EventIntegration } = await import('@/pages/Integration')
          return {
            Component: EventIntegration,
          }
        }}
      />
      <Route
        path="/organization/:organizationId"
        lazy={async () => {
          const { OrganizationLanding } = await import('@/pages/OrganizationLanding')
          return {
            Component: OrganizationLanding,
          }
        }}
      />
      <Route
        path="/user-detail/:id"
        lazy={async () => {
          const { UserDetail } = await import('@/pages/OrganizationLanding/UserDetail')
          return {
            Component: UserDetail,
          }
        }}
      />
    </>,
  ),
)

const Routes: FC = () => {
  return <RouterProvider router={RouterStack} fallbackElement={<Spinner />} />
}

export { Routes }
