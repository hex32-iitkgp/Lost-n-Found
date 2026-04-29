// src/pages/About.jsx
import { useNavigate } from "react-router-dom";

function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="max-w-xl bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-semibold mb-4">Lost & Found</h1>
        <p className="text-gray-600 mb-6">
          A community-driven platform to report lost items and help return them
          to their owners. Please login to access all features.
        </p>

        <button
          onClick={() => navigate("/login")}
          className="bg-found text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
        >
          Login to Continue
        </button>
      </div>
    </div>
  );
}

export default About;