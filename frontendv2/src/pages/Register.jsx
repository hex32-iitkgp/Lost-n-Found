import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../services/auth";

function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [form2, setForm2] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmitRegister = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            await registerUser(form);
            form2.email = form.email;
            form2.password = form.password;
            const res = await loginUser(form2);
            localStorage.setItem("token", res.data.access_token);
            window.location.href = "/about";
        } catch (err) {
            alert("Registration failed");
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-reportsEnd via-white to-reportsStart border-b-8 border-reportsStart">

            <div className="bg-white p-8 rounded-xl shadow-md w-[350px] hover:shadow-2xl transition-shadow duration-300 animate-slideUp">

                <h2 className="text-2xl font-semibold mb-6 text-center">
                    Register
                </h2>

                <form onSubmit={handleSubmitRegister} className="space-y-4">

                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        className="w-full p-3 border rounded-lg outline-none"
                        onChange={handleChange}
                        required
                    />

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
                        className="w-full bg-reportsEnd text-white py-3 rounded-lg hover:opacity-90 transition"
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>

                </form>

                <p className="text-sm text-center mt-4">
                    Already have an account?{" "}
                    <span
                        onClick={() => navigate("/login")}
                        className="text-blue-600 cursor-pointer"
                    >
                        Login
                    </span>
                </p>

            </div>
        </div>
    );
}

export default Register;