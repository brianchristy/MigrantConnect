import axios from 'axios';

const API_URL = `${process.env.API_BASE_URL}/api/auth`;
const USERS_URL = `${process.env.API_BASE_URL}/api/users`;

export const registerUser = async (data: { name: string; phone: string; password: string }) => {
  return axios.post(`${API_URL}/register`, data);
};

export const getUserByPhone = async (phone: string) => {
  return axios.get(`${API_URL}/${phone}`);
};

export const getProfile = async (phone: string) => {
  return axios.get(`${USERS_URL}/${phone}`);
};

export const updateProfile = async (phone: string, data: { name?: string; aadhaar?: string; language?: string; password?: string }) => {
  return axios.put(`${USERS_URL}/${phone}`, data);
}; 