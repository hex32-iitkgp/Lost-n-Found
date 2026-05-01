import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import { use, useEffect } from "react";

function App() {
  const isLoggedIn = localStorage.getItem("token");
  useEffect(() => {
    if (isLoggedIn) {
      // Force a reload to ensure auth state is updated across the app
      console.log("Token found on load. Reloading to sync auth state.");
    }
    else {
      console.log("No token found on load. User is not logged in.");
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* ROOT */}
          <Route
            path="/"
            element={
              (isLoggedIn) ? <Navigate to="/home" /> : <Navigate to="/about" />
            }
          />

          {/* HOME */}
          <Route
            path="/home"
            element={
              (isLoggedIn) ? <Home /> : <Navigate to="/about" />
            }
          />

          {/* PUBLIC */}
          <Route path="/login" element={isLoggedIn ? <Navigate to="/home" /> : <Login />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to="/home" /> : <Register />} />
          <Route path="/about" element={<About />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>

        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;