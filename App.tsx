import React, { useState, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import type { User } from './types';

const USERS: Record<string, User> = {
  '1234': { id: 'user1', name: 'Gerard - EOS' },
  '1111': { id: 'user2', name: 'Jordi - EOS' },
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = useCallback((pin: string): boolean => {
    const foundUser = USERS[pin];
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center font-sans p-4">
      {user ? (
        <MainPage user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;