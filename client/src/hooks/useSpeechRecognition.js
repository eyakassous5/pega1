import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for speech recognition using the Web Speech API.
 * Works best in Chrome/Edge.
 */
export default function useSpeechRecognition({
  language = 'fr-FR',
  continuous = true,
  interimResults = true,
  onResult,
  onFinalResult,
}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          finalTranscriptRef.current = finalTranscript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullText = (finalTranscript + interimTranscript).trim();

      if (onResult) {
        onResult(fullText);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setError('Aucune voix détectée. Veuillez réessayer.');
      } else if (event.error === 'not-allowed') {
        setError("L'accès au microphone a été refusé.");
      } else if (event.error === 'network') {
        setError('Erreur réseau. Vérifiez votre connexion Internet.');
      } else {
        setError(`Erreur: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const final = finalTranscriptRef.current.trim();
      if (final && onFinalResult) {
        onFinalResult(final);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [language, continuous, interimResults, isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    finalTranscriptRef.current = '';

    try {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Impossible de démarrer la reconnaissance vocale.');
    }
  }, [language]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
  };
}
