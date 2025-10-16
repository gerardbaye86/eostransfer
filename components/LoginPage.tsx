import React, { useState, useEffect, useRef } from 'react';

interface LoginPageProps {
  onLogin: (email: string, pin: string) => Promise<{ success: boolean; error?: string }>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(Array(4).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pinInputRefs = useRef<HTMLInputElement[]>([]);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (!/^[0-9]$/.test(value) && value !== '') return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value !== '' && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Backspace' && index === 0) {
        emailInputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email === '' || pin.some(p => p === '')) {
      setError('Si us plau, introdueix l\'email i el PIN complet.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const fullPin = pin.join('');

    const result = await onLogin(email, fullPin);

    if (!result.success) {
      setError(result.error || 'L\'email o el PIN introduïts no són vàlids.');
      setPin(Array(4).fill(''));
      pinInputRefs.current[0]?.focus();
    }
    
    setIsLoading(false);
  };

  const isPinFilled = pin.every(p => p !== '');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Benvingut/da</h1>
          <p className="mt-2 text-gray-400">Introdueix el teu email i PIN per accedir a la transferència d'arxius.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input 
              ref={emailInputRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="El teu correu electrònic"
              className="w-full px-4 py-3 text-center bg-white/5 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
            />
          </div>
          
          <div className="flex justify-center space-x-3 sm:space-x-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={el => pinInputRefs.current[index] = el!}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handlePinChange(index, e.target.value)}
                onKeyDown={e => handlePinKeyDown(index, e)}
                disabled={isLoading}
                className="w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl font-bold bg-white/5 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                style={{ caretColor: 'transparent' }} 
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-300 px-4 py-3 rounded-lg text-center">
              <p>{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={!email || !isPinFilled || isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificant...
                </>
              ) : (
                'Accedeix'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
