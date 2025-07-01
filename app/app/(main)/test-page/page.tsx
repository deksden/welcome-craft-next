"use client";

export default function TestPage() {
  console.log('🚨🚨🚨 TEST PAGE: COMPONENT FUNCTION CALLED - REACT COMPONENT IS RENDERING!')
  console.log('🚨🚨🚨 TEST PAGE: This is a minimal test page to verify React rendering works')
  
  return (
    <div>
      <h1>Test Page</h1>
      <p>This is a minimal test page to verify React rendering.</p>
      <p>If you see this, React is working correctly.</p>
    </div>
  )
}