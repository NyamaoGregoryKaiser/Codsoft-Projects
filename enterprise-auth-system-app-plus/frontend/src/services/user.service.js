import api from '../api/api';

const USER_URL = '/users';

const getCurrentUser = async () => {
  try {
    const response = await api.get(`${USER_URL}/me`);
    return response.data;
  } catch (error) {
    console.error('Failed to get current user:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const getUserById = async (id) => {
  try {
    const response = await api.get(`${USER_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get user with ID ${id}:`, error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const getAllUsers = async () => {
  try {
    const response = await api.get(USER_URL);
    return response.data;
  } catch (error) {
    console.error('Failed to get all users:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const userService = {
  getCurrentUser,
  getUserById,
  getAllUsers,
};

export default userService;