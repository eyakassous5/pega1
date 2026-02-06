import './TranslationDisplay.css';

function TranslationDisplay({ result, currentSignIndex, isAnimating, onReplay }) {
  if (!result) return null;

  const { original, signs, unknownWords, totalDuration } = result;

  return (
    <div className="translation-card">
      <div className="translation-header">
        <h3 className="translation-title">🔤 Traduction</h3>
        <div className="translation-meta">
          <span className="meta-item">{signs.length} signes</span>
          <span className="meta-divider">•</span>
          <span className="meta-item">{totalDuration?.toFixed(1)}s</span>
        </div>
      </div>

      <div className="original-text">
        <span className="original-label">Texte original :</span>
        <span className="original-value">{original}</span>
      </div>

      {/* Sign sequence */}
      <div className="sign-sequence">
        {signs.map((sign, index) => (
          <div
            key={index}
            className={`sign-chip ${
              index === currentSignIndex ? 'active' : ''
            } ${index < currentSignIndex ? 'done' : ''}`}
          >
            <span className="sign-chip-word">{sign.word}</span>
            {index === currentSignIndex && (
              <span className="sign-chip-playing">▶</span>
            )}
            {index < currentSignIndex && (
              <span className="sign-chip-done">✓</span>
            )}
          </div>
        ))}
      </div>

      {/* Unknown words */}
      {unknownWords.length > 0 && (
        <div className="unknown-words">
          <span className="unknown-label">⚠️ Mots non reconnus :</span>
          {unknownWords.map((word, i) => (
            <span key={i} className="unknown-chip">
              {word}
            </span>
          ))}
        </div>
      )}

      {/* Replay button */}
      {signs.length > 0 && !isAnimating && (
        <button className="btn-replay" onClick={onReplay}>
          🔄 Rejouer l'animation
        </button>
      )}

      {/* Progress bar during animation */}
      {isAnimating && signs.length > 0 && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((currentSignIndex + 1) / signs.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default TranslationDisplay;
