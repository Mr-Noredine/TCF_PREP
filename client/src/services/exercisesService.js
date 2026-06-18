import axios from 'axios';

const API_URL = '/api/exercises';

export const exercisesService = {
  // Get all exercises with filters
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.level) params.append('level', filters.level);
      if (filters.type) params.append('type', filters.type);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await axios.get(`${API_URL}?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get individual exercises with user status (new library view)
  getList: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.level)    params.append('level', filters.level);
      if (filters.type)     params.append('type', filters.type);
      const response = await axios.get(`${API_URL}/list?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get exercises grouped by category and level
  getGrouped: async () => {
    try {
      const response = await axios.get(`${API_URL}/grouped`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single exercise by ID
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Submit exercise attempt
  submitAttempt: async (attemptData) => {
    try {
      const response = await axios.post(`${API_URL}/attempt`, attemptData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
