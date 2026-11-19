import { Link } from 'react-router-dom'
import { ROUTES } from '../dashboard/constants'

export default function ProfileTrigger({ className, children }) {
  return (
    <Link to={ROUTES.profile} aria-label="Open profile" className={className}>
      {children}
    </Link>
  )
}