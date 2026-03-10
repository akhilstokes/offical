import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const createProductOrder = async (orderData) => {
    const res = await axios.post(`${API}/api/product-orders`, orderData, { headers: getHeaders() });
    return res.data;
};

export const getMyOrders = async () => {
    const res = await axios.get(`${API}/api/product-orders/my-orders`, { headers: getHeaders() });
    return res.data;
};

export const getAllProductOrders = async () => {
    const res = await axios.get(`${API}/api/product-orders`, { headers: getHeaders() });
    return res.data;
};

export const assignDeliveryStaff = async (orderId, staffId) => {
    const res = await axios.put(`${API}/api/product-orders/${orderId}/assign`, { staffId }, { headers: getHeaders() });
    return res.data;
};

export const updateOrderStatus = async (orderId, status) => {
    const res = await axios.put(`${API}/api/product-orders/${orderId}/status`, { status }, { headers: getHeaders() });
    return res.data;
};

export const approveProductOrder = async (orderId) => {
    const res = await axios.put(`${API}/api/product-orders/${orderId}/approve`, {}, { headers: getHeaders() });
    return res.data;
};

export const deleteProductOrder = async (orderId) => {
    const res = await axios.delete(`${API}/api/product-orders/${orderId}`, { headers: getHeaders() });
    return res.data;
};
