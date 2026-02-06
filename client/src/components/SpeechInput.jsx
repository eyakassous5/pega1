import { useState, useRef, useEffect, useCallback } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import './SpeechInput.css';

function SpeechInput({ onTranslate, isTranslating, isAnimating }) {
  const [text, setText] = useState('');
  const [selectedLang, setSelectedLang] = useState('fr-FR');
  const textareaRef = useRef(null);

  const onResult = useCallback(
    (transcript) => {
      setText(transcript);
    },
    []
  );

  const onFinalResult = useCallback(
    (transcript) => {
      setText(transcript);
      if (transcript.trim()) {
        onTranslate(transcript);
      }
    },
    [onTranslate]
  );

  const { isListening, isSupported, startListening, stopListening, error } =
    useSpeechRecognition({
      language: selectedLang,
      onResult,
      onFinalResult,
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isTranslating && !isAnimating) {
      onTranslate(text.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setText('');
      startListening();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const isBusy = isTranslating || isAnimating;

  return (
    <div className="speech-input-card">
      <div className="input-header">
        <h2 className="input-title">💬 Entrée</h2>
        <select
          className="lang-select"
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
        >
          <option value="fr-FR">🇫🇷 Français</option>
          <option value="ar-TN">🇹🇳 Arabe Tunisien</option>
          <option value="ar-SA">🇸🇦 Arabe</option>
          <option value="en-US">🇬🇧 English</option>
        </select>
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            className={`input-textarea ${isListening ? 'listening' : ''}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? '🎤 Parlez maintenant...'
                : 'Tapez du texte ou utilisez le microphone...'
            }
            rows={3}
            disabled={isListening}
          />
          {isListening && (
            <div className="listening-indicator">
              <div className="pulse-ring" />
              <div className="pulse-ring delay" />
              <div className="pulse-dot" />
            </div>
          )}
        </div>

        <div className="input-actions">
          {isSupported && (
            <button
              type="button"
              className={`btn-mic ${isListening ? 'active' : ''}`}
              onClick={toggleListening}
              disabled={isBusy}
              title={isListening ? 'Arrêter' : 'Parler'}
            >
              {isListening ? '⏹️ Arrêter' : '🎤 Parler'}
            </button>
          )}

          <button
            type="submit"
            className="btn-translate"
            disabled={!text.trim() || isBusy}
          >
            {isTranslating ? (
              <>
                <span className="spinner" /> Traduction...
              </>
            ) : (
              '🤟 Traduire'
            )}
          </button>

          {text && (
            <button
              type="button"
              className="btn-clear"
              onClick={() => setText('')}
              disabled={isBusy}
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {error && <div className="speech-error">⚠️ {error}</div>}
      {!isSupported && (
        <div className="speech-warning">
          ℹ️ La reconnaissance vocale n'est pas supportée par ce navigateur.
          Utilisez Chrome pour la meilleure expérience.
        </div>
      )}

      {/* Quick phrases */}
      <div className="quick-phrases">
        <span className="quick-label">Essayez :</span>
        {['Bonjour', 'Comment ça va', 'Merci', "J'ai besoin d'aide", 'Au revoir'].map(
          (phrase) => (
            <button
              key={phrase}
              className="quick-btn"
              onClick={() => {
                setText(phrase);
                onTranslate(phrase);
              }}
              disabled={isBusy}
            >
              {phrase}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default SpeechInput;
