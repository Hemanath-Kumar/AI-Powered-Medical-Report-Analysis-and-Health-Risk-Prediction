import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { Transaction_id, signup } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Error handling
  const [error, setError] = useState("");

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }


    try {
      const { name, email, password } = formData;
      // Call your signup function from AuthContext
      const txId = await signup(name, email, password);
      navigate(`/otp/${txId}`);

    } catch (err) {
      // Handle API or network errors 
      // Get error message from response if available, otherwise use generic message
      setError(err || "Signup failed");
    } finally {
      setLoading(false);
    }


  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="flex w-full max-w-[900px] rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800 flex-col md:flex-row">
        {/* Left Side */}
        <div className="md:flex-1 bg-gradient-to-br from-primary to-accent text-white p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Personal Medical Agent Portal</h2>
          <ul className="space-y-3 text-lg">
            <li>✔ AI-powered Heart & Diabetes Prediction</li>
            <li>✔ ERP-based Health & Diet Tracking</li>
            <li>✔ Personalized Diet Plans</li>
            <li>✔ Smart Monitoring Dashboard</li>
            <li>✔ Virtual Health Assistant</li>
          </ul>
        </div>

        {/* Right Side (Signup Form) */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <h3 className="text-2xl font-semibold mb-6 text-white">Sign Up</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create new password"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition shadow-md hover:shadow-lg"
            >
              Create Account
            </button>

            <p className="text-center text-sm mt-4 text-gray-600 dark:text-white">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signin")}
                className="text-primary font-medium hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
