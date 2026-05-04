import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

import { useNavigate } from "react-router-dom";

const OtpPage = ({ transactionId }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const { otpauth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!otp) {
      setError("Please enter OTP");
      setLoading(false);
      return;
    }

    try {

      await otpauth(transactionId, otp);

      // Navigate to dashboard
      navigate("/dashboard");

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }


  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="flex w-full max-w-[500px] rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800">
        <div className="flex-1 p-10 flex flex-col justify-center">
          <h3 className="text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-white">OTP Verification</h3>
          <form
            className="space-y-6 flex flex-col items-center"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              placeholder="Enter OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-52 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center tracking-widest text-lg"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-52 bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <p className="text-center text-sm mt-4 text-gray-600 dark:text-gray-400">
              Didn’t receive OTP?{" "}
              <a href="/" className="text-primary font-medium hover:underline">
                Resend
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
