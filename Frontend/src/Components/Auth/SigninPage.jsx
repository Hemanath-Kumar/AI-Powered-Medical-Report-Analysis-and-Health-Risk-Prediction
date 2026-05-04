import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const SigninPage = () => {

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.non_field_errors?.[0] ||   // DRF ValidationError (wrong credentials)
        data?.detail ||                   // DRF AuthenticationFailed
        data?.message ||                  // custom message field
        'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="flex w-full max-w-[900px] rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800 flex-col md:flex-row">

        {/* Left Side */}
        <div className="md:flex-1 bg-gradient-to-br from-primary to-accent text-white p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6">Personal Medical Agent</h2>
          <ul className="space-y-3 text-lg">
            <li>✔ AI-powered Heart Attack & Diabetes Prediction</li>
            <li>✔ ERP-based Health & Diet Tracking</li>
            <li>✔ Personalized Diet Plans for Heart & Diabetes</li>
            <li>✔ Smart Health Monitoring Dashboard</li>
            <li>✔ Virtual Personal Health Assistant</li>
          </ul>
        </div>

        {/* Right Side */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <h3 className="text-2xl font-semibold mb-6 text-white">Signin</h3>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Remember + Forgot */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center space-x-2 text-white">
                <input type="checkbox" className="w-4 h-4" />
                <span>Remember me</span>
              </label>
              {/* <Link to="/forgot-password" shaking className="text-primary hover:underline">
                Forgot Password?
              </Link> */}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Register */}
            <p className="text-center text-sm mt-4 text-gray-600 dark:text-white">
              Don’t have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;
