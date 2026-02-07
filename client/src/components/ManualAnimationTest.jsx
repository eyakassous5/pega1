import { useState } from 'react';

function ManualAnimationTest({ isOpen, onClose }) {
  const [selectedSign, setSelectedSign] = useState('sign_bonjour');

  if (!isOpen) return null;

  const commonSigns = [
    'sign_bonjour',
    'sign_merci',
    'sign_oui',
    'sign_non',
    'sign_non',
    'sign_comment',
    'sign_ca_va',
    'sign_bien',
    'sign_mal',
    'sign_eau',
    'sign_manger',
    'sign_dormir',
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '320px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.95)',
      color: '#0f0',
      padding: '12px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 10001,
      maxWidth: '250px',
      border: '1px solid #0f0',
    }}>
      <div style={{ marginBottom: '8px', color: '#0f0', fontWeight: 'bold' }}>
        🧪 Manual Animation Test
      </div>

      <div style={{ marginBottom: '8px', fontSize: '11px' }}>
        <label style={{ display: 'block', marginBottom: '4px' }}>
          Select a sign to view:
        </label>
        <select
          value={selectedSign}
          onChange={(e) => setSelectedSign(e.target.value)}
          style={{
            width: '100%',
            padding: '4px',
            background: '#1a1a1a',
            color: '#0f0',
            border: '1px solid #0f0',
            borderRadius: '3px',
            fontFamily: 'monospace',
          }}
        >
          {commonSigns.map(sign => (
            <option key={sign} value={sign}>
              {sign}
            </option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: '10px', color: '#0a0', padding: '4px', background: '#0a0a0a', borderRadius: '3px' }}>
        Currently displaying: <strong>{selectedSign}</strong>
        <br />
        Check the avatar for animation
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          background: '#0f0',
          color: '#000',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          width: '100%',
          fontFamily: 'monospace',
          fontWeight: 'bold',
        }}
      >
        Close
      </button>
    </div>
  );
}

export default ManualAnimationTest;
