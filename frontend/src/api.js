import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true,
});

api.interceptors.request.use(
    config => {
        console.log('Request URL:', config.url);
        console.log('Request Cookies:', document.cookie);
        return config;
    },
    error => Promise.reject(error)
);

api.interceptors.response.use(
    response => response,
    error => {
        console.error('Response error:', error.response?.status, error.config.url);
        return Promise.reject(error);
    }
);

export default api;