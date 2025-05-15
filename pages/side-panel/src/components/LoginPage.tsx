import { useState } from 'react';
import GoogleLogin from './GoogleLogin';
import { FiLock } from 'react-icons/fi';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const handleLoginSuccess = () => {
    onLoginSuccess();
  };

  const handleLogout = () => {
    // This is just a placeholder since logout is handled in the GoogleLogin component
    // and we don't need to do anything special here
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <FiLock className="lock-icon" />
        <h1>Login Required</h1>
        <p>Please login with your Google account to continue</p>
      </div>

      <GoogleLogin onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />
    </div>
  );
};

export default LoginPage;
