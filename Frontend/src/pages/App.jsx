import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './Components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Reports from './pages/Reports';
import Detection from './pages/Detection';
import Profile from './pages/Profile';
import SignupPage from './Components/Auth/SignupPage';
import SigninPage from './Components/Auth/SigninPage';
import OtpPage from './Components/Auth/OtpPage';
import NotFound from './pages/404';
import { useParams } from "react-router-dom";

const Loading = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return user ? <>{children}</> : <Navigate to="/signin" />;
};


const OtpRoute = () => {

  const { Transaction_id, loading } = useAuth();
  const { id } = useParams();

  if (loading) return <Loading />;

  if (!id) {
    return <Navigate to="/signup" replace />;
  }


  // Otherwise, show OTP page
  return <OtpPage transactionId={id} />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">

            <Routes>
              <Route path="*" element={<NotFound />} />

              <Route path="/otp/:id" element={<OtpRoute />} />


              <Route
                path="/signin"
                element={
                  <PublicRoute>

                    <SigninPage />

                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignupPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Upload />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/detection"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Detection />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
