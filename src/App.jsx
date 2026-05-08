import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const syncToken = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", syncToken);

    return () => window.removeEventListener("storage", syncToken);
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/"
          element={token ? <Navigate to="/chat" /> : <Login />}
        />

        {/* REGISTER */}
        <Route
          path="/register"
          element={token ? <Navigate to="/chat" /> : <Register />}
        />

        {/* CHAT */}
        <Route
          path="/chat"
          element={token ? <Chat /> : <Navigate to="/" />}
        />

      </Routes>
    </BrowserRouter>
  );
}