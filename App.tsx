import { useState } from 'react';
import type { User } from './types';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';

function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        // This header is essential for the server to understand the request body.
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      // Before trying to parse the JSON, check if the response is ok.
      if (!response.ok) {
        // Try to get a specific error message from the API, but handle cases where it might not be JSON.
        let errorMsg = `Login failed with status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (e) {
            // The response was not JSON, which is a sign of a server problem.
            console.error("Could not parse error response as JSON.");
        }
        return { success: false, error: errorMsg };
      }

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid PIN' };
      }
    } catch (error) {
      console.error('Login error:', error);
      // This will catch network errors or if the server is completely down.
      return { success: false, error: 'An unexpected network error occurred.' };
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="App bg-gray-900 min-h-screen flex items-center justify-center font-sans">
      {user ? (
        <MainPage user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
