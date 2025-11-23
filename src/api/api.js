import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL, // backend URL
  withCredentials: true,             // ✅ send cookies automatically
});

export default api;
// https://farmerconnect-backend.onrender.com