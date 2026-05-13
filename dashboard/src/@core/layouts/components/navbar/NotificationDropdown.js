import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Bell, CheckCircle, Clock, FileText, Info, Shield, XCircle } from 'react-feather'

// ** Reactstrap Imports
import { Button, Badge, DropdownMenu, DropdownItem, DropdownToggle, UncontrolledDropdown } from 'reactstrap'

const POLL_INTERVAL_MS = 15000

const NotificationDropdown = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/notification', { params: { page: 1, perPage: 12 } })
      setNotifications(Array.isArray(data?.data) ? data.data : [])
      setUnreadCount(Number(data?.unreadCount) || 0)
    } catch (error) {
      // Keep navbar stable even if notifications API is temporarily unavailable.
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const unreadLabel = useMemo(() => (unreadCount > 99 ? '99+' : unreadCount), [unreadCount])

  const getIconByCategory = category => {
    const key = String(category || 'info').toLowerCase()
    if (key === 'success') return { icon: <CheckCircle size={14} />, color: 'light-success' }
    if (key === 'danger') return { icon: <XCircle size={14} />, color: 'light-danger' }
    if (key === 'warning') return { icon: <Shield size={14} />, color: 'light-warning' }
    if (key === 'primary') return { icon: <FileText size={14} />, color: 'light-primary' }
    return { icon: <Info size={14} />, color: 'light-info' }
  }

  const formatRelativeTime = createdAt => {
    const date = createdAt ? new Date(createdAt) : null
    if (!date || Number.isNaN(date.getTime())) return ''

    const diffMs = Date.now() - date.getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const markOneAsRead = async item => {
    if (!item?.id || item?.isRead) return
    try {
      await axios.patch(`/notification/${item.id}/read`)
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === item.id
            ? { ...notification, isRead: true, readAt: notification.readAt || new Date().toISOString() }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(prev - 1, 0))
    } catch (error) {
      // Ignore and keep UI usable.
    }
  }

  const goToNotificationTarget = link => {
    const target = String(link || '').trim()
    if (!target) return

    if (/^https?:\/\//i.test(target)) {
      window.location.assign(target)
      return
    }

    navigate(target)
  }

  const markAllAsRead = async () => {
    try {
      await axios.patch('/notification/read-all')
      setNotifications(prev => prev.map(item => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() })))
      setUnreadCount(0)
    } catch (error) {
      // Ignore and keep UI usable.
    }
  }

  const renderNotificationItems = () => (
    <PerfectScrollbar
      component='li'
      className='media-list scrollable-container'
      options={{
        wheelPropagation: false
      }}
    >
      {notifications.map(item => {
        const presentation = getIconByCategory(item.category)

        return (
          <a
            key={item.id}
            className='d-flex'
            href={item.link || '/'}
            onClick={async event => {
              event.preventDefault()
              await markOneAsRead(item)
              goToNotificationTarget(item.link)
            }}
          >
            <div className='list-item d-flex align-items-start'>
              <div className='me-1'>
                <Avatar icon={presentation.icon} color={presentation.color} />
              </div>
              <div className='list-item-body flex-grow-1'>
                <p className='media-heading mb-25'>
                  <span className='fw-bolder'>{item.title || 'Notification'}</span>
                  {!item.isRead && <Badge color='light-danger' pill className='ms-50'>new</Badge>}
                </p>
                <small className='notification-text'>{item.message}</small>
              </div>
              <small className='text-muted ms-1 d-flex align-items-center'>
                <Clock size={12} className='me-25' />
                {formatRelativeTime(item.createdAt)}
              </small>
            </div>
          </a>
        )
      })}
    </PerfectScrollbar>
  )

  return (
    <UncontrolledDropdown
      tag='li'
      className='dropdown-notification nav-item me-25'
      onToggle={isOpen => {
        if (isOpen) fetchNotifications()
      }}
    >
      <DropdownToggle tag='a' className='nav-link' href='/' onClick={e => e.preventDefault()}>
        <Bell size={21} />
        {unreadCount > 0 && (
          <Badge pill color='danger' className='badge-up'>
            {unreadLabel}
          </Badge>
        )}
      </DropdownToggle>
      <DropdownMenu end tag='ul' className='dropdown-menu-media mt-0'>
        <li className='dropdown-menu-header'>
          <DropdownItem className='d-flex' tag='div' header>
            <h4 className='notification-title mb-0 me-auto'>Notifications</h4>
            <Badge tag='div' color='light-primary' pill>
              {unreadCount} Unread
            </Badge>
          </DropdownItem>
        </li>

        {loading ? (
          <li className='px-1 py-2 text-center text-muted'>Loading notifications...</li>
        ) : notifications.length ? (
          renderNotificationItems()
        ) : (
          <li className='px-1 py-2 text-center text-muted'>No notifications yet</li>
        )}

        <li className='dropdown-menu-footer'>
          <Button color='primary' block onClick={markAllAsRead} disabled={!unreadCount}>
            Mark all as read
          </Button>
        </li>
      </DropdownMenu>
    </UncontrolledDropdown>
  )
}

export default NotificationDropdown
