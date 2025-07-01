"use client";

import { useSession } from "@/components/fast-session-provider";
import { useEffect, useState } from "react";

export default function DebugSessionPage() {
  const session = useSession();
  const [cookies, setCookies] = useState('');
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setCookies(document.cookie);
    }
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Session Page</h1>
      <div className="space-y-4">
        
        <div>
          <h2 className="text-lg font-semibold">Session Status: {session.status}</h2>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(session.data, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">Raw Cookies:</h3>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
            {cookies || 'NO COOKIES'}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">User Type Check:</h3>
          <div className="mt-2 p-4 bg-blue-100 rounded">
            <p>session?.data?.user?.type: <strong>{session?.data?.user?.type || 'undefined'}</strong></p>
            <p>Admin check result: <strong>{session?.data?.user?.type === 'admin' ? 'TRUE (Admin)' : 'FALSE (Not Admin)'}</strong></p>
          </div>
        </div>
        
      </div>
    </div>
  );
}