import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/auth";

function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await loginUser(form);

            // store token
            localStorage.setItem("token", res.data.access_token);

            // redirect
            navigate("/");
            window.location.reload(); // quick refresh to update UI
        } catch (err) {
            alert("Invalid credentials");
        }
    };

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
                        className="w-full bg-reportsStart text-white py-3 rounded-lg hover:opacity-90 transition"
                    >
                        Login
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