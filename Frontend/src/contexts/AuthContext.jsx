/* eslint-disable no-useless-catch */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(undefined);


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [Transaction_id, setTransaction_id] = useState(null);


  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedTransactionId = localStorage.getItem('transaction_id');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    if (storedTransactionId) {
      setTransaction_id(storedTransactionId);
    }


    setLoading(false);
  }, []);

  const login = async (email, password) => {

    try {
      const response = await authAPI.login(email, password);
      const { token: newToken, user: newUser } = response.data;
      console.log(response.data);

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', JSON.stringify(newToken));
      localStorage.setItem('user', JSON.stringify(newUser));

    }
    catch (error) {
      throw error;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await authAPI.signup(name, email, password);
      const { transaction_id: newTransactionId } = response.data;

      setTransaction_id(newTransactionId);
      localStorage.setItem('transaction_id', newTransactionId);

      return newTransactionId;

    } catch (error) {

      const { email: Error_Message_email } = error.response.data
      throw Error_Message_email;
    }
  };

  const otpauth = async (transaction_id, otp) => {
    try {
      const response = await authAPI.verifyotp(transaction_id, otp);
      const { token: newToken, user: newUser } = response.data;



      //Remove old Transaction_id data
      setTransaction_id(null);
      localStorage.removeItem('transaction_id');

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', JSON.stringify(newToken));
      localStorage.setItem('user', JSON.stringify(newUser));

    } catch (error) {
      throw error;
    }
  };



  const getprofile = async () => {
    try {
      const response = await userAPI.getProfile()
      return response.data
    }
    catch (error) {
      throw error;
    }
  }

  const setprofile = async (data) => {
    try {
      const response = await userAPI.updateProfile(data)
      console.log(response.data)
      return response.data
    }
    catch (error) {
      throw error;
    }
  }

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    loading,
    Transaction_id,
    setTransaction_id,
    otpauth,
    getprofile,
    setprofile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
