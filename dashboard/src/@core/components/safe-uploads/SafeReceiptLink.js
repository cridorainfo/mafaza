import { useEffect, useState } from 'react'

/**
 * Receipts may be PDF or images on /uploads. Shows "Unavailable" if the file is gone (e.g. ephemeral disk).
 */
export default function SafeReceiptLink({ href, className, children }) {
  const [state, setState] = useState('checking')

  useEffect(() => {
    if (!href) {
      setState('missing')
      return
    }

    let cancelled = false

    fetch(href, { method: 'HEAD', credentials: 'same-origin' })
      .then(res => {
        if (!cancelled) setState(res.ok ? 'ok' : 'missing')
      })
      .catch(() => {
        if (!cancelled) setState('missing')
      })

    return () => {
      cancelled = true
    }
  }, [href])

  if (!href || state === 'missing') {
    return <span className='text-muted'>Unavailable</span>
  }

  if (state === 'checking') {
    return <span className='text-muted' style={{ fontSize: '0.85em' }}>…</span>
  }

  return (
    <a target='_blank' rel='noreferrer' className={className} href={href}>
      {children}
    </a>
  )
}
