import { useState, useEffect } from 'react';

/**
 * Test component to verify avatar animations work
 * Shows bones loaded and lets you trigger animations
 */
function AnimationTester() {
  const [testStatus, setTestStatus] = useState('idle');
  const [bonesInfo, setBonesInfo] = useState(null);

  useEffect(() => {
    // Poll for bones info from AvatarModel
    const timer = setInterval(() => {
      if (window.__avatarBones) {
        setBonesInfo(window.__avatarBones);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const testAnimation = async () => {
    setTestStatus('testing...');
    try {
      // Simulate what happens when you type text
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'bonjour' }),
      });
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.signs && data.signs.length > 0) {
        setTestStatus(`✅ Got ${data.signs.length} signs: ${data.signs.map(s => s.word).join(', ')}`);
      } else {
        setTestStatus('❌ No signs returned');
      }
    } catch (e) {
      setTestStatus(`❌ Error: ${e.message}`);
    }
  };

  const statusColor = testStatus.includes('✅') ? '#0f0' : testStatus.includes('❌') ? '#f00' : '#0a0';

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.95)',
      border: '2px solid #0f0',
      color: '#0f0',
      padding: '12px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '11px',
      maxWidth: '300px',
      zIndex: 10000,
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: statusColor }}>
        🧪 Animation Tester
      </div>
      
      <div style={{ marginBottom: '8px', fontSize: '10px' }}>
        <div>🦴 Bones: {bonesInfo 
          ? `${bonesInfo.normalizedCount} mapped` 
          : 'detecting...'
        }</div>
        <div>📡 API Status: {testStatus}</div>
      </div>

      <button
        onClick={testAnimation}
        style={{
          width: '100%',
          padding: '6px',
          background: '#0f0',
          color: '#000',
          border: 'none',
          borderRadius: '3px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontFamily: 'monospace',
        }}
      >
        Test: Say "Bonjour"
      </button>
    </div>
  );
}

export default AnimationTester;
