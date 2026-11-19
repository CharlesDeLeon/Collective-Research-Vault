import { Link } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { getRoleHome } from '../utils/roleHome'
import ErrorScreen, { outlineBtnCls, primaryBtnCls } from '../components/ui/ErrorScreen'

export default function Forbidden() {
  const { user, logout } = useAuth()
  const stored = JSON.parse(localStorage.getItem('user') || 'null')
  const role = (user ?? stored)?.role

  return (
    <ErrorScreen
      code="403"
      title="You don’t have access"
      message="This page is for a different role. If you think this is a mistake, contact your adviser or an administrator."
    >
      <Link to={getRoleHome(role)} className={primaryBtnCls}>
        Go to my home
      </Link>
      <button type="button" onClick={logout} className={outlineBtnCls}>
        Log out
      </button>
    </ErrorScreen>
  )
}