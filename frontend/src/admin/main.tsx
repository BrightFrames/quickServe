import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App.tsx";
import "./index.css";

// Configure axios baseURL for production
const apiUrl =
  import.meta.env.VITE_API_URL || "https://project0-f2hv.onrender.com";

// Set baseURL for all axios requests
axios.defaults.baseURL = apiUrl;

// Log configuration for debugging
console.log("API URL configured:", apiUrl);
console.log("Environment:", import.meta.env.MODE);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
