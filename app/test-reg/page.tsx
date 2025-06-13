'use client';

import { useState } from 'react';
import { register } from '../app/(auth)/actions';

export default function TestRegistration() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Starting registration test...');
      
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'testpassword123');
      
      const initialState = { status: 'idle' };
      const result = await register(initialState, formData);
      
      console.log('Registration result:', result);
      setResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Registration error:', error);
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Registration Test</h1>
      <button onClick={handleTest} disabled={loading}>
        {loading ? 'Testing...' : 'Test Registration'}
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