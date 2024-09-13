import React from 'react'

import OverlayNavbar from '@/components/Overlay/OverlayNavbar'
import OverlaySidebar from '@/components/Overlay/OverlaySidebar'
import OverlayZoom from '@/components/Overlay/OverlayZoom'

import OverlayMenu from './OverlayMenu'

export default function Overlay({ eventId }: { eventId: string }) {
  const fixedDivStyle: React.CSSProperties = {
    pointerEvents: 'none',
    position: 'fixed',
    top: '16px',
    bottom: '16px',
    left: '16px',
    right: '16px',
    zIndex: 200,
    userSelect: 'none',
  }

  const topDivStyle: React.CSSProperties = {
    position: undefined,
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px', // Ajusta según el tema que tenías
  }

  const leftDivStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '250px', // Ajusta el ancho de la barra lateral
    top: '60px', // Ajusta según la altura del navbar
  }

  const bottomRightDivStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    right: 0,
  }

  return (
    <div style={fixedDivStyle}>
      <div style={topDivStyle}>
        <OverlayNavbar />
        <OverlayMenu />
      </div>
      <div style={bottomRightDivStyle}>
        <OverlayZoom />
      </div>
      <div style={leftDivStyle}>
        <OverlaySidebar eventId={eventId} />
      </div>
    </div>
  )
}
