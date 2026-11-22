import api from './api'

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
}

export const updateProfile = async ({ name, email }) => {
    const response = await api.put('/auth/profile', { name, email })
    return response.data
}

export const changePassword = async ({ current, next }) => {
    const response = await api.post('/auth/change-password', { current_password: current, new_password: next })
    return response.data
}