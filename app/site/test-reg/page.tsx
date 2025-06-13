'use client';

import { useState } from 'react';

export default function TestRegistration() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTestBrowser = async () => {
    setLoading(true);
    setResult('Testing via browser form submission...\n');
    
    try {
      // Тестируем через настоящую форму регистрации
      window.open('http://app.localhost:3000/register', '_blank');
      setResult('Opened registration page in new tab. Check server logs and try to register with test@example.com / testpassword123');
    } catch (error) {
      console.error('Error:', error);
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Registration Test</h1>
      <button onClick={handleTestBrowser} disabled={loading}>
        {loading ? 'Opening...' : 'Open Registration Page'}
      </button>
      
      {result && (
        <pre style={{ 
          background: '#f0f0f0', 
          padding: '10px', 
          marginTop: '20px',
          whiteSpace: 'pre-wrap'
        }}>
          {result}
        </pre>
      )}
    </div>
  );
}