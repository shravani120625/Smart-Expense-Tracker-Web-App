const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
};

export const api = {
  // GET helper
  async get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // POST helper
  async post(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  // PUT helper
  async put(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  // DELETE helper
  async delete(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // UPLOAD helper (multipart form data)
  async upload(endpoint, formData) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(true), // omit Content-Type so browser sets boundary automatically
      body: formData
    });
    return handleResponse(res);
  }
};

export const authService = {
  async register(userData) {
    return api.post('/auth/register', userData);
  },
  async login(credentials) {
    return api.post('/auth/login', credentials);
  },
  async getMe() {
    return api.get('/auth/me');
  }
};

export const transactionService = {
  async getAll(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/transactions${queryString}`);
  },
  async create(data) {
    return api.post('/transactions', data);
  },
  async update(id, data) {
    return api.put(`/transactions/${id}`, data);
  },
  async delete(id) {
    return api.delete(`/transactions/${id}`);
  }
};

export const budgetService = {
  async getAll() {
    return api.get('/budgets');
  },
  async upsert(data) {
    return api.post('/budgets', data);
  },
  async delete(id) {
    return api.delete(`/budgets/${id}`);
  },
  async getStatus() {
    return api.get('/budgets/status');
  }
};

export const reportService = {
  async getDashboard() {
    return api.get('/reports/dashboard');
  }
};

export const importService = {
  async uploadCSV(file) {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload('/import/csv', formData);
  },
  async uploadOCR(image) {
    const formData = new FormData();
    formData.append('image', image);
    return api.upload('/import/ocr', formData);
  }
};
