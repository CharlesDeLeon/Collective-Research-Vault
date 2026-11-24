import axios from 'axios'

export const SESSION_EXPIRED_EVENT = 'corev:session-expired'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
})

function getStoredToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
}

api.interceptors.request.use((config) => {
    const token = getStoredToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || ''
        const isLogin = error.config?.url?.includes('/auth/login')
        const expired = error.response?.status === 401 || /token/i.test(message)
        if (!isLogin && expired && localStorage.getItem('token')) {
            window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
        }
        return Promise.reject(error)
    }
)

export const getNotifications = ()    => api.get('/notifications')
export const getUnreadCount   = ()    => api.get('/notifications/unread')
export const markOneRead      = (id)  => api.patch(`/notifications/${id}/read`)
export const markAllRead      = ()    => api.patch('/notifications/read-all')

export default api