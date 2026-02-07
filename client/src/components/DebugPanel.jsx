import { useEffect, useState } from 'react';
import './DebugPanel.css';

function DebugPanel({ currentSign, currentSignIndex, isAnimating, translationResult }) {
  const [logs, setLogs] = useState([]);
  const [boneInfo, setBoneInfo] = useState(null);

  // Poll for bone info from window
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.__avatarBones && !boneInfo) {
        setBoneInfo(window.__avatarBones);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [boneInfo]);

  useEffect(() => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      currentSign: currentSign?.word || 'none',
      animation: currentSign?.animation || 'none',
      index: currentSignIndex,
      isAnimating,
      totalSigns: translationResult?.signs?.length || 0,
    };

    setLogs(prev => [newLog, ...prev].slice(0, 20));
  }, [currentSign, currentSignIndex, isAnimating, translationResult]);

  return (
    <div className="debug-panel">
      <h3>🐛 Debug Info</h3>
      <div className="debug-info">
        <div><strong>Current Sign:</strong> {currentSign?.word || 'none'}</div>
        <div><strong>Animation:</strong> {currentSign?.animation || 'none'}</div>
        <div><strong>Index:</strong> {currentSignIndex} / {translationResult?.signs?.length || 0}</div>
        <div><strong>Animating:</strong> {isAnimating ? '✅' : '❌'}</div>
        <div><strong>Bones:</strong> {boneInfo
          ? `${boneInfo.normalizedCount} mapped / ${boneInfo.rawCount} raw`
          : 'Loading...'
        }</div>
        {boneInfo && boneInfo.normalizedCount === 0 && (
          <div style={{ color: '#f00' }}>⚠️ NO BONES MAPPED - avatar won't animate!</div>
        )}
        {boneInfo && boneInfo.rawCount > 0 && boneInfo.normalizedCount === 0 && (
          <div style={{ color: '#ff0', fontSize: '9px' }}>
            Raw names: {boneInfo.rawNames.slice(0, 5).join(', ')}...
          </div>
        )}
      </div>
      <div className="debug-logs">
        <h4>Activity Log:</h4>
        {logs.map((log, idx) => (
          <div key={idx} className="log-entry">
            <span className="log-time">{log.timestamp}</span>
            <span className="log-sign">{log.currentSign}</span>
            <span className="log-anim">({log.animation})</span>
            <span className="log-index">[{log.index}/{log.totalSigns}]</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DebugPanel;
