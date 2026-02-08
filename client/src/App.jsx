import { useState, useCallback } from 'react';
import Header from './components/Header';
import SpeechInput from './components/SpeechInput';
import AvatarScene from './components/AvatarScene';
import TranslationDisplay from './components/TranslationDisplay';
import SignDictionary from './components/SignDictionary';
import AnimationTester from './components/AnimationTester';
import { translateText } from './services/api';
import './App.css';

function App() {
  const [translationResult, setTranslationResult] = useState(null);
  const [currentSignIndex, setCurrentSignIndex] = useState(-1);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState(null);
  const [showDictionary, setShowDictionary] = useState(false);

  const handleTranslate = useCallback(async (text) => {
    if (!text.trim()) return;

    setError(null);
    setIsTranslating(true);
    setCurrentSignIndex(-1);
    setIsAnimating(false);

    try {
      const result = await translateText(text);
      setTranslationResult(result);

      // Start animation sequence if there are signs
      if (result.signs && result.signs.length > 0) {
        setIsAnimating(true);
        playSignSequence(result.signs);
      }
    } catch (err) {
      console.error('Translation failed:', err);
      setError('La traduction a échoué. Vérifiez que le serveur est en marche.');
      setTranslationResult(null);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const playSignSequence = useCallback((signs) => {
    let index = 0;

    const playNext = () => {
      if (index >= signs.length) {
        setCurrentSignIndex(-1);
        setIsAnimating(false);
        return;
      }

      setCurrentSignIndex(index);
      const duration = (signs[index].duration || 1.5) * 1000;

      index++;
      setTimeout(playNext, duration);
    };

    playNext();
  }, []);

  const handleReplay = useCallback(() => {
    if (translationResult?.signs?.length > 0) {
      setIsAnimating(true);
      playSignSequence(translationResult.signs);
    }
  }, [translationResult, playSignSequence]);

  const currentSign =
    currentSignIndex >= 0 && translationResult?.signs
      ? translationResult.signs[currentSignIndex]
      : null;

  return (
    <div className="app">
      <Header onToggleDictionary={() => setShowDictionary(!showDictionary)} />

      <main className="app-main">
        <div className="app-layout">
          {/* Left Panel: Input & Translation Info */}
          <div className="panel panel-input">
            <SpeechInput
              onTranslate={handleTranslate}
              isTranslating={isTranslating}
              isAnimating={isAnimating}
            />

            {error && (
              <div className="error-banner">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {translationResult && (
              <TranslationDisplay
                result={translationResult}
                currentSignIndex={currentSignIndex}
                isAnimating={isAnimating}
                onReplay={handleReplay}
              />
            )}
          </div>

          {/* Right Panel: 3D Avatar */}
          <div className="panel panel-avatar">
            <div className="avatar-container">
              <AvatarScene
                currentSign={currentSign}
                isAnimating={isAnimating}
              />
              {currentSign && (
                <div className="sign-overlay">
                  <div className="sign-word">{currentSign.word}</div>
                  <div className="sign-description">{currentSign.description}</div>
                </div>
              )}
              {!isAnimating && !currentSign && (
                <div className="avatar-hint">
                  🤟 Parlez ou tapez du texte pour voir la traduction en langue des signes
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Dictionary Modal */}
      {showDictionary && (
        <SignDictionary onClose={() => setShowDictionary(false)} />
      )}

      {/* Animation Tester */}
      <AnimationTester />
    </div>
  );
}

export default App;
