import React, { useState, useEffect } from 'react';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';

export default function SASCodePuzzler({ onVerify, officerId, sessionId }) {
  const [inputCode, setInputCode] = useState('');
  const [displayCode, setDisplayCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  // Generate SAS code on mount
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setIsLoading(false);
      return;
    }

    const generateCode = async () => {
      try {
        // Check if we already have codes for this session in localStorage
        const cachedData = localStorage.getItem(`sas_session_${sessionId}`);
        if (cachedData) {
          const data = JSON.parse(cachedData);
          setDisplayCode(officerId === 1 ? data.code1 : data.code2);
          setIsLoading(false);
          return;
        }

        // Generate new codes
        const response = await fetch('http://localhost:3001/api/sas/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Failed to generate SAS code');
        
        const data = await response.json();
        
        // Cache the codes in localStorage
        localStorage.setItem(`sas_session_${sessionId}`, JSON.stringify(data));
        
        // Display the code for this officer (code1 or code2)
        setDisplayCode(officerId === 1 ? data.code1 : data.code2);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    generateCode();
  }, [officerId, sessionId]);

  const handleVerify = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const cachedData = localStorage.getItem(`sas_session_${sessionId}`);
      if (!cachedData) throw new Error('Session data not found');
      
      const { id, code1, code2 } = JSON.parse(cachedData);
      
      const response = await fetch('http://localhost:3001/api/sas/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          code1: officerId === 1 ? inputCode : code1,
          code2: officerId === 2 ? inputCode : code2
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setVerified(true);
      onVerify(true, inputCode.toUpperCase());
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 6);
    setInputCode(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-pulse text-amber-400">Generating SAS Code...</div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded border ${verified ? 'bg-green-500/10 border-green-500/30' : 'bg-[#1a1a2e] border-[#2a2a3e]'}`}>
      <div className="flex items-center gap-2 mb-3">
        {verified ? <Unlock className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-gray-500" />}
        <span className="text-xs text-gray-400">OFFICER {officerId} AUTHORIZATION</span>
      </div>

      {/* Display Code (Puzzler Style) */}
      <div className="mb-4 p-3 bg-black/50 border border-amber-500/30 rounded">
        <div className="text-[10px] text-amber-400 mb-1">SEALED AUTHENTICATOR CODE</div>
        <div className="font-mono text-2xl text-amber-300 tracking-widest text-center">
          {displayCode.split('').map((char, i) => (
            <span key={i} className="inline-block w-8 text-center border-b border-amber-500/30 mx-0.5">
              {char}
            </span>
          ))}
        </div>
      </div>

      {/* Input Field */}
      <div className="mb-3">
        <div className="text-[10px] text-gray-400 mb-1">ENTER CODE TO VERIFY</div>
        <input
          type="text"
          value={inputCode}
          onChange={handleInputChange}
          disabled={verified}
          placeholder="000000"
          maxLength={6}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-lg font-mono text-green-400 placeholder-gray-600 focus:outline-none focus:border-amber-500 text-center tracking-widest"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 mb-3 text-red-400 text-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={verified || inputCode.length !== 6}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-black text-xs font-bold tracking-wider rounded transition-colors"
      >
        {verified ? 'VERIFIED ✓' : 'VERIFY CODE'}
      </button>
    </div>
  );
}
