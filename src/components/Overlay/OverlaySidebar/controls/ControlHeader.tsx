interface Props {
  title: string
  subtitle?: string
}

export default function ControlHeader({ title, subtitle }: Props) {
  return (
    <h4
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        marginTop: '8px',
        marginBottom: '4px',
        fontSize: '0.9rem',
      }}
    >
      {title}
      {subtitle && (
        <span
          style={{
            fontSize: '0.8rem',
            opacity: 0.3,
            transform: 'translateY(1px)',
          }}
        >
          {subtitle}
        </span>
      )}
    </h4>
  )
}
