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
      <Route
        path="/design/:eventId"
        lazy={async () => {
          const { Design } = await import('@/pages/Design')
          return {
            Component: Design,
          }
        }}
      />
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
