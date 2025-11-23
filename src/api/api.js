import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8181/", // backend URL
  withCredentials: true,             // ✅ send cookies automatically
});

export default api;
// https://farmerconnect-backend.onrender.com