import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import defaultCover from '@src/assets/images/default.webp'
import logo from '@src/assets/images/logo.svg'
import './style.scss'

const FALLBACK_PORTFOLIO = [
  {
    title: 'Business Center',
    description:
      'A premium destination increasing productivity near Muscat Private Hospital. 113 Units of modern workspace.',
    image:
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=800',
    category: 'Real Estate',
    location: 'Salalah Corridor',
    status: 'Active Asset'
  },
  {
    title: 'Deem Tower',
    description:
      'Offering a truly unique hotel experience with 355 units. A cornerstone of the Dhofar tourism landscape.',
    image:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800',
    category: 'Hospitality',
    location: 'Salalah, Dhofar',
    status: 'Managed Portfolio'
  },
  {
    title: 'Eileen Tower',
    description:
      'One of the most prominent modern real estate projects in Al Maabela. Leading urban development.',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    category: 'Commercial',
    location: 'Al Maabela, Muscat',
    status: 'Development'
  }
]

const CATEGORY_ROTATION = ['Real Estate', 'Hospitality', 'Commercial', 'Infrastructure']
const STATUS_ROTATION = ['Active Asset', 'Managed Portfolio', 'Development', 'Strategic Asset']
const HIDDEN_STATUS_LABELS = new Set(['development', 'strategic asset', 'stragetic asset', 'active asset'])

const shouldHideStatus = status =>
  HIDDEN_STATUS_LABELS.has(String(status || '').trim().toLowerCase())

const getVisibleCards = width => {
  if (width < 768) return 1
  if (width < 1024) return 2
  return 3
}

const truncate = (value, limit = 130) => {
  const text = String(value || '')
  if (text.length <= limit) return text
  return `${text.slice(0, limit).trim()}...`
}

const HomePage = () => {
  const [projects, setProjects] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visibleCards, setVisibleCards] = useState(getVisibleCards(window.innerWidth))
  const touchStartX = useRef(null)

  useEffect(() => {
    let mounted = true

    axios
      .get(`${window.location.origin}/api/v1.0/project/carousel`)
      .then(({ data }) => {
        if (!mounted) return
        const list = Array.isArray(data) ? data : []
        const mapped = list.map((project, index) => ({
          id: project?.id || index,
          title: project?.name || `Project ${index + 1}`,
          description: project?.description || FALLBACK_PORTFOLIO[index % FALLBACK_PORTFOLIO.length].description,
          image: project?.image || FALLBACK_PORTFOLIO[index % FALLBACK_PORTFOLIO.length].image || defaultCover,
          category: CATEGORY_ROTATION[index % CATEGORY_ROTATION.length],
          location: 'UAE Portfolio',
          status: STATUS_ROTATION[index % STATUS_ROTATION.length]
        }))

        setProjects(mapped)
      })
      .catch(() => {
        if (mounted) setProjects([])
      })

    return () => {
      mounted = false
    }
  }, [])

  const portfolio = useMemo(
    () => (projects.length > 0 ? projects : FALLBACK_PORTFOLIO),
    [projects]
  )

  const maxIndex = Math.max(0, portfolio.length - visibleCards)

  useEffect(() => {
    const onResize = () => {
      const nextVisible = getVisibleCards(window.innerWidth)
      setVisibleCards(nextVisible)
      setCurrentIndex(prev => Math.min(prev, Math.max(0, portfolio.length - nextVisible)))
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [portfolio.length])

  useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(maxIndex)
  }, [currentIndex, maxIndex])

  const moveNext = () => {
    setCurrentIndex(prev => (prev < maxIndex ? prev + 1 : 0))
  }

  const movePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : maxIndex))
  }

  const onTouchStart = event => {
    touchStartX.current = event.touches[0].clientX
  }

  const onTouchEnd = event => {
    if (touchStartX.current == null) return
    const delta = touchStartX.current - event.changedTouches[0].clientX
    if (delta > 50) moveNext()
    if (delta < -50) movePrev()
    touchStartX.current = null
  }

  const movePercent = currentIndex * (100 / visibleCards)

  return (
    <div id='home-page' className='mafaza-landing'>
      <nav className='landing-nav'>
        <div className='landing-nav-inner'>
          <a className='brand-logo' href='/landing'>
            <img src={logo} alt='Mafaza logo' />
          </a>

          <div className='nav-actions'>
            <Link className='login-btn' to='/login'>
              Login
            </Link>
            <Link className='investor-btn' to='/register'>
              Investor Portal
            </Link>
          </div>
        </div>
      </nav>

      <main className='landing-main'>
        <div className='ambient-glow' />

        <section className='hero-wrap landing-container'>
          <div className='hero-grid'>
            <div className='hero-title-col'>
              <div className='eyebrow-row'>
                <div className='eyebrow-line' />
                <span>Confidence &amp; Clarity</span>
              </div>
              <h1>
                Empowering <br />
                <span>Growth.</span>
              </h1>
            </div>

            <div className='hero-copy-col'>
              <p>
                Meticulously crafted strategies designed to maximize returns while promoting
                sustainability and innovation across the UAE landscape.
              </p>
              <div className='hero-metrics'>
                <div>
                  <span>Success Rate</span>
                  <strong>98%</strong>
                </div>
                <div>
                  <span>Ethical Focus</span>
                  <strong>Shari&apos;ah</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className='portfolio-wrap landing-container'>
          <div className='portfolio-head'>
            <h2>
              <span>Featured</span> Portfolio
            </h2>
            <div className='carousel-buttons'>
              <button type='button' id='prevBtn' onClick={movePrev} aria-label='Previous'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
                  <path d='M19 12H5m0 0l7-7m-7 7l7 7' />
                </svg>
              </button>
              <button type='button' id='nextBtn' onClick={moveNext} aria-label='Next'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
                  <path d='M5 12h14m0 0l-7-7m7 7l-7 7' />
                </svg>
              </button>
            </div>
          </div>

          <div className='carousel-viewport' onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className='carousel-track' style={{ transform: `translateX(-${movePercent}%)` }}>
              {portfolio.map((item, index) => (
                <article className='project-card' key={`${item.id || item.title}-${index}`}>
                  <div className='project-shell glass'>
                    <div className='card-image-container'>
                      <img src={item.image || defaultCover} alt={item.title} />
                      <div className='image-overlay' />
                      <div className='badge-wrap'>
                        <span>{item.category}</span>
                      </div>
                    </div>

                    <div className='card-body'>
                      <h3>{item.title}</h3>
                      <p>{truncate(item.description)}</p>
                      <div className='card-foot'>
                        <span>{item.location}</span>
                        {!shouldHideStatus(item.status) && <span>{item.status}</span>}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className='mobile-indicators'>
          {portfolio.map((_, index) => (
            <div key={`dot-${index}`} className={`indicator-dot ${index === currentIndex ? 'active' : ''}`} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default HomePage
