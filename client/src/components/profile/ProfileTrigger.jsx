import { Link } from 'react-router-dom'
import { ROUTES } from '../dashboard/constants'

export default function ProfileTrigger({ to = ROUTES.profile, className, children }) {
  return (
    <Link to={to} aria-label="Open profile" className={className}>
      {children}
    </Link>
  )
}