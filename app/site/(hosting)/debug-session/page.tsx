"use client";

import { useSession } from "@/components/fast-session-provider";
import { useEffect, useState } from "react";

export default function DebugSessionPage() {
  const session = useSession();
  const [cookies, setCookies] = useState('');
  const [apiSessionData, setApiSessionData] = useState<any>(null);
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setCookies(document.cookie);
    }
    
    // Also fetch session data from API
    fetch('/api/test/debug-session', {
      headers: {
        'X-Test-Environment': 'playwright'
      }
    })
    .then(res => res.json())
    .then(data => setApiSessionData(data))
    .catch(err => setApiSessionData({ error: err.message }));
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Session Page (Public Site)</h1>
      <div className="space-y-4">
        
        <div>
          <h2 className="text-lg font-semibold">Client Session (FastSessionProvider)</h2>
          <div className="text-sm text-gray-600 mb-2">Status: {session.status}</div>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(session.data, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">Server Session (API)</h3>
          <pre className="mt-2 p-4 bg-blue-100 rounded text-xs overflow-auto">
            {JSON.stringify(apiSessionData, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">Raw Cookies:</h3>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
            {cookies || 'NO COOKIES'}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">User Type Analysis:</h3>
          <div className="mt-2 p-4 bg-green-100 rounded">
            <p><strong>Client session user type:</strong> {session?.data?.user?.type || 'undefined'}</p>
            <p><strong>Server session user type:</strong> {apiSessionData?.sessionUser?.type || 'undefined'}</p>
            <p><strong>Client Admin check:</strong> {session?.data?.user?.type === 'admin' ? 'TRUE (Admin)' : 'FALSE (Not Admin)'}</p>
            <p><strong>Server has session:</strong> {apiSessionData?.hasSession ? 'TRUE' : 'FALSE'}</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}