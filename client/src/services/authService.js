import api from './api'

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
}

export const updateProfile = async ({ name, email, currentPassword }) => {
    const response = await api.patch('/auth/profile', { name, email, currentPassword })
    return response.data
}

export const changePassword = async ({ current, next }) => {
    const response = await api.post('/auth/change-password', { currentPassword: current, newPassword: next })
    return response.data
}