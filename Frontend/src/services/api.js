import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
// api.interceptors.request.use((config) => {
//   const tokenObj = JSON.parse(localStorage.getItem('token'));
//   const accessToken = tokenObj?.access;
//   // const token = localStorage.getItem('token', token.access);

//   if (accessToken ) {
//     console.log(accessToken )
//     config.headers.Authorization = `Bearer ${accessToken }`;
//   }
//   return config;
// });


// Flag to prevent multiple refresh calls at once
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add access token to every request
api.interceptors.request.use((config) => {
  const tokenObj = JSON.parse(localStorage.getItem("token"));
  const accessToken = tokenObj?.access;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Handle expired access tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Wait for refresh to complete if already in progress
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      const tokenObj = JSON.parse(localStorage.getItem("token"));
      const refreshToken = tokenObj?.refresh;

      if (!refreshToken) {
        localStorage.removeItem("token");
        window.location.href = "/signin";
        return Promise.reject(error);
      }

      try {
        // Request new access token
        const response = await axios.post(`${API_BASE_URL}api/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;

        // Update localStorage
        localStorage.setItem(
          "token",
          JSON.stringify({
            access: newAccessToken,
            refresh: refreshToken,
          })
        );

        api.defaults.headers.common["Authorization"] = "Bearer " + newAccessToken;
        processQueue(null, newAccessToken);

        // Retry original request with new token
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("token");
        window.location.href = "/signin"; // redirect to sign in if refresh fails
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


export const authAPI = {
  login: (email, password) =>
    api.post('signin/', { email, password }),

  signup: (name, email, password) =>
    api.post('signup/', { name, email, password }),

  verifyotp: (transaction_id, otp) =>
    api.post('verify-otp/', { transaction_id, otp }),
};

export const reportsAPI = {
  upload: (formData) =>
    api.post('upload-medical-report/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  getAll: () => api.get('dashboard-data/'),
  
  //Report-page Analysis: GET to fetch existing analysis data (if any)
  getreportAnalysis: () => api.get(`reports/analysis/`),
    
  // Report-page AI: POST to request insights (sends reportId + type)
  postReportAIInsights: (reportId, type) =>
    api.post('/reports/report-ai-insights/', { reportId, type }),

  // Report-page AI: GET to fetch stored AI result
  fetchReportAIResult: (reportId, type) =>
    api.get('/reports/report-ai-insights/', { params: { reportId, type } }),

};

export const detectionAPI = {
  // 1. Analyse button — POST patient health metrics → heart risk prediction
  //    Payload: { male, age, cigsPerDay, BPMeds, prevalentHyp, diabetes, totChol, sysBP, BMI, glucose }
  analyze: (payload) =>
    api.post('/detection/analyze/', payload),

  // 2. GET all detection results in one shot (includes aiSummary embedded in each result)
  //    Same pattern as reportsAPI.getreportAnalysis() in Reports.jsx
  getResults: () =>
    api.get('/detection/analyze/'),

  // 3. AI Assist popup (food / simple / detailed insights)
  //    POST: send reportId + type → backend generates insight
  postAIInsights: (reportId, predictionQuestionId) =>
    api.post('/detection/ai-insights/', { reportId, predictionQuestionId }),
  //    GET: fetch the generated insight
  getAIInsights: (reportId, predictionQuestionId) =>
    api.get('/detection/ai-insights/', { params: { reportId, predictionQuestionId } }),
  
};

export const userAPI = {

  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data) =>
    api.put('/users/profile/', data),
};

export default api;
