import { useState, useCallback } from 'react';
import config from '../config/config';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getToken = () => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith(`${config.TOKEN_KEY}=`));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  };

  const request = useCallback(async (endpoint, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      };

      const response = await fetch(`${config.API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Request failed');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint) => 
    request(endpoint, { method: 'GET' }), [request]);

  const post = useCallback((endpoint, data) => 
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }), [request]);

  const put = useCallback((endpoint, data) => 
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }), [request]);

  const del = useCallback((endpoint) => 
    request(endpoint, { method: 'DELETE' }), [request]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
  };
};

export default useApi;
