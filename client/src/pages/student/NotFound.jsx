import { Link } from 'react-router-dom'
import StatePanel from '../../components/public/StatePanel'
import { ROUTES } from '../../components/dashboard/constants'

export default function NotFound() {
  return (
    <StatePanel title="Page not found">
      <p>The page you’re looking for doesn’t exist or has moved.</p>
      <Link to={ROUTES.forum} className="mt-4 inline-block font-semibold text-gold">
        Go to Forum
      </Link>
    </StatePanel>
  )
}