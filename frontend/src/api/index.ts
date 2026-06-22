import axios from "axios";
import { API_BASE } from "../config/api";

const api = axios.create({
  baseURL: API_BASE,
});

console.log("[ENV]", import.meta.env.MODE, "API_BASE:", API_BASE || "(relative)");

export default api;