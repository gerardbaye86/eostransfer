import React, { useState, useEffect, useCallback } from 'react';

interface LoginPageProps {
  onLogin: (pin: string) => boolean;
}

const PIN_LENGTH = 4;

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleKeyPress = useCallback((digit: string) => {
    setError('');
    if (pin.length < PIN_LENGTH) {
      setPin(prevPin => prevPin + digit);
    }
  }, [pin.length]);

  const handleBackspace = () => {
    setError('');
    setPin(prevPin => prevPin.slice(0, -1));
  };

  const handleClear = () => {
    setError('');
    setPin('');
  };

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      const success = onLogin(pin);
      if (!success) {
        setError('PIN invàlid. Torna-ho a provar.');
        setPin('');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    }
  }, [pin, onLogin]);

  const PinDots: React.FC<{ length: number }> = ({ length }) => (
    <div className="flex justify-center space-x-4 mb-6">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <div
          key={i}
          className={`h-4 w-4 rounded-full transition-all duration-300 ${
            i < length ? 'bg-cyan-400 shadow-[0_0_10px_#06b6d4]' : 'bg-white/20'
          }`}
        />
      ))}
    </div>
  );
  
  const KeypadButton: React.FC<{ children: React.ReactNode; onClick: () => void; }> = ({ children, onClick }) => (
    <button
      onClick={onClick}
      className="h-16 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 text-2xl font-semibold text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
    >
      {children}
    </button>
  );

  return (
    <div className="w-full max-w-xs p-8 space-y-6 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
          EOSTransfer
        </h1>
        <h2 className="text-2xl font-bold text-white">Benvingut/da</h2>
        <p className="text-gray-400">Introdueix el teu PIN</p>
      </div>
      <div className={`transition-transform duration-500 ${isShaking ? 'animate-shake' : ''}`}>
        <PinDots length={pin.length} />
      </div>
      <div className="h-5 text-center">
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {'123456789'.split('').map(digit => (
          <KeypadButton key={digit} onClick={() => handleKeyPress(digit)}>
            {digit}
          </KeypadButton>
        ))}
        <KeypadButton onClick={handleClear}>
          C
        </KeypadButton>
        <KeypadButton onClick={() => handleKeyPress('0')}>
          0
        </KeypadButton>
        <KeypadButton onClick={handleBackspace}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.21.47-.324.75-.324H21a.75.75 0 0 1 .75.75v12.75a.75.75 0 0 1-.75.75H10.17c-.28 0-.54-.113-.75-.324Z" />
          </svg>
        </KeypadButton>
      </div>
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};

export default LoginPage;