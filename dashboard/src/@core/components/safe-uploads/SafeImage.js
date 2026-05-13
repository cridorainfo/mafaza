import { useEffect, useState } from 'react'

/**
 * Renders an image from uploads (or any URL); shows fallback when missing or 404.
 */
export default function SafeImage({ src, alt, className, style, fallback, imgProps }) {
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [src])

  if (!src || broken) {
    return fallback || null
  }

  return (
    <img
      alt={alt || ''}
      className={className}
      style={style}
      src={src}
      onError={() => setBroken(true)}
      {...(imgProps || {})}
    />
  )
}
