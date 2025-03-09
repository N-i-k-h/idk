import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />  {/* Default to Login Page */}
        <Route path="/register" element={<Register />} />  {/* Add Register Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<App />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
