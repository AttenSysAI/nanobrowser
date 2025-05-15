import { useState, useEffect } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { authService, UserInfo } from '../services/auth';

interface GoogleLoginProps {
  onLoginSuccess: () => void;
  onLogout: () => void;
}

const GoogleLogin = ({ onLoginSuccess, onLogout }: GoogleLoginProps) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUserInfo(currentUser);
      }
    };

    checkAuth();
  }, []);

  const fetchUserInfo = (accessToken: string) => {
    // Get user info from Google's userinfo endpoint using the access token
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(response => response.json())
      .then(async googleUserInfo => {
        try {
          // Use auth service to authenticate with backend
          const authResponse = await authService.authenticateWithGoogle(googleUserInfo, accessToken);

          // Save user session
          await authService.saveUserSession(authResponse.jwt, authResponse.user);

          // Call login success callback
          onLoginSuccess();

          setIsLoading(false);
        } catch (error) {
          console.error('Authentication error:', error);
          setIsLoading(false);
        }
      })
      .catch(error => {
        console.error('Google API error:', error);
        setIsLoading(false);
      });
  };

  const handleLogin = () => {
    setIsLoading(true);
    chrome.identity.getAuthToken({ interactive: true }, function (accessToken: string | undefined) {
      if (chrome.runtime.lastError || !accessToken) {
        console.error(chrome.runtime.lastError);
        setIsLoading(false);
        return;
      }

      fetchUserInfo(accessToken);
    });
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUserInfo(null);
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (userInfo) {
    return (
      <div className="user-container">
        <div className="user-info">
          {userInfo.picture && <img className="profile-image" src={userInfo.picture} alt="Profile" />}
          <div className="user-details">
            <h3 className="user-name">{userInfo.name}</h3>
            <p className="user-email">{userInfo.email}</p>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="login-container">
      <button className="login-button" onClick={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <span>Logging in...</span>
        ) : (
          <>
            <FaGoogle className="google-icon" />
            <span>Login with Google</span>
          </>
        )}
      </button>
    </div>
  );
};

export default GoogleLogin;
