import config from '../config/config';

class ApiService {
  constructor() {
    this.baseURL = config.API_BASE_URL;
  }

  getHeaders() {
    const token = localStorage.getItem(config.TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  async post(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async put(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async delete(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  // POS specific endpoints
  async getProducts() {
    return this.get('/products');
  }

  async searchProducts(query) {
    return this.get(`/products/search?q=${encodeURIComponent(query)}`);
  }

  async getProductByBarcode(barcode) {
    return this.get(`/products/barcode/${barcode}`);
  }

  async createOrder(orderData) {
    return this.post('/orders', orderData);
  }

  async getOrder(orderId) {
    return this.get(`/orders/${orderId}`);
  }

  async updateOrder(orderId, orderData) {
    return this.put(`/orders/${orderId}`, orderData);
  }

  async processPayment(paymentData) {
    return this.post('/payments/process', paymentData);
  }
}

export const api = new ApiService();
