import axios from 'axios';

const API_URL = `${process.env.API_BASE_URL}/api/auth`;

export const registerUser = async (data: { name: string; phone: string; aadhaar: string; language: string; password: string }) => {
  return axios.post(`${API_URL}/register`, data);
};

export const getUserByPhone = async (phone: string) => {
  return axios.get(`${API_URL}/${phone}`);
}; 