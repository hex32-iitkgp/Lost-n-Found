import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/auth";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";



function Login() {
    const navigate = useNavigate();
    const { fetchUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false); // New state to track login success
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await loginUser(form);

            localStorage.setItem("token", res.data.access_token);

            await fetchUser(); // 🔥 important

            setLoginSuccess(true); // Force reload to update UI based on new auth state
        } catch (err) {
            setLoading(false);
            alert(err.response?.data?.detail || "Login failed");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (loginSuccess) {
            navigate("/about");
        }

    }, [loginSuccess]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-reportsStart via-white to-reportsEnd border-b-8 border-reportsEnd">

            <div className="bg-white p-8 rounded-xl w-[350px] shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-slideUp">

                <h2 className="text-2xl font-semibold mb-6 text-center">
                    Login
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className="w-full p-3 border rounded-lg outline-none"
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className="w-full p-3 border rounded-lg outline-none"
                        onChange={handleChange}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-reportsStart text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

                <p className="text-sm text-center mt-4">
                    Don't have an account?{" "}
                    <span
                        onClick={() => navigate("/register")}
                        className="text-blue-600 cursor-pointer"
                    >
                        Sign up
                    </span>
                </p>

            </div>
        </div>
    );
}

export default Login;