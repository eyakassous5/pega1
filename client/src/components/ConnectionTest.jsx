import { useEffect, useState } from 'react';

function ConnectionTest() {
  const [status, setStatus] = useState('Testing...');
  const [apiResponse, setApiResponse] = useState(null);

  useEffect(() => {
    const test = async () => {
      try {
        console.log('🧪 Testing API connection...');
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'bonjour' }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ API Connection OK', data);
        setStatus(`✅ Connected! Got ${data.signs?.length || 0} signs`);
        setApiResponse(data);
      } catch (error) {
        console.error('❌ API Connection Failed:', error);
        setStatus(`❌ Error: ${error.message}`);
      }
    };

    test();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.8)',
      color: status.startsWith('✅') ? '#0f0' : '#f00',
      padding: '10px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 10000,
    }}>
      <div>{status}</div>
      {apiResponse && (
        <div style={{ fontSize: '11px', marginTop: '4px', color: '#0f0' }}>
          Signs: {apiResponse.signs?.map(s => s.word).join(', ') || 'none'}
        </div>
      )}
    </div>
  );
}

export default ConnectionTest;
