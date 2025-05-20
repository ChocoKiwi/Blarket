import axios from 'axios';

// Централизованная конфигурация API
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true,
});

export default api;