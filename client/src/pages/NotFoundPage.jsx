import { Link } from 'react-router-dom'
import ErrorScreen, { primaryBtnCls } from '../components/ui/ErrorScreen'

export default function NotFoundPage() {
  return (
    <ErrorScreen
      code="404"
      title="Page not found"
      message="The page you’re looking for doesn’t exist or has moved."
    >
      <Link to="/" className={primaryBtnCls}>
        Back to home
      </Link>
    </ErrorScreen>
  )
}