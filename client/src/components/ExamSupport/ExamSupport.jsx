import { useEffect, useMemo, useState } from 'react';
import './ExamSupport.css';

function decodeAudioText(audio) {
  if (audio?.transcript) return audio.transcript;
  if (!audio?.token) return '';

  try {
    const binary = window.atob(audio.token);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (_) {
    return '';
  }
}

function pickFrenchVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return voices.find(v => /^fr/i.test(v.lang)) || null;
}

function ecouteLabel(n) {
  return `${n} ${n === 1 ? 'écoute restante' : 'écoutes restantes'}`;
}

const STYLE_LABELS = {
  evenement: 'Événement',
  administratif: 'Document administratif',
  commercial: 'Annonce commerciale',
  transport: 'Information transport',
};

const KIND_LABELS = {
  affiche: 'Affiche',
  annonce: 'Annonce',
  panneau: 'Panneau',
  sms: 'Message',
  courriel: 'Courriel',
  lettre: 'Lettre',
  dialogue: 'Dialogue audio',
  article: 'Article',
  audio: 'Audio',
};

const ExamSupport = ({ support, questionKey }) => {
  const [listenCount, setListenCount] = useState(0);
  const [voiceReady, setVoiceReady] = useState(() => (
    typeof window !== 'undefined' && 'speechSynthesis' in window ? Boolean(pickFrenchVoice()) : false
  ));
  const audioText = useMemo(() => decodeAudioText(support?.audio), [support, questionKey]);

  useEffect(() => {
    setListenCount(0);
  }, [questionKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceReady(false);
      return undefined;
    }

    const refreshVoice = () => setVoiceReady(Boolean(pickFrenchVoice()));
    refreshVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoice);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', refreshVoice);
    };
  }, []);

  if (!support) return null;

  const kind = support.kind;

  if ((kind === 'affiche' || kind === 'annonce' || kind === 'panneau') && support.visual) {
    const visual = support.visual;
    return (
      <section className={`exam-support exam-support--visual exam-support--${visual.style || 'administratif'}`} aria-label={`${KIND_LABELS[kind]} : ${visual.title}`}>
        <div className="exam-support__stamp">{STYLE_LABELS[visual.style] || KIND_LABELS[kind]}</div>
        <h2 className="exam-support__title">{visual.title}</h2>
        <ul className="exam-support__lines">
          {(visual.body || []).map((line, index) => <li key={index}>{line}</li>)}
        </ul>
        {visual.meta && <p className="exam-support__meta">{visual.meta}</p>}
      </section>
    );
  }

  if (kind === 'sms' && support.message) {
    return (
      <section className="exam-support exam-support--sms" aria-label={`SMS de ${support.message.from}`}>
        <div className="exam-support__phone">
          <div className="exam-support__phone-head">{support.message.from}</div>
          <div className="exam-support__bubble">
            {(support.message.lines || []).map((line, index) => <p key={index}>{line}</p>)}
          </div>
        </div>
      </section>
    );
  }

  if ((kind === 'courriel' || kind === 'lettre' || kind === 'article') && support.message) {
    return (
      <section className="exam-support exam-support--mail" aria-label={`${KIND_LABELS[kind]} de ${support.message.from}`}>
        <div className="exam-support__mail-head">
          <p><span>De :</span> {support.message.from}</p>
          {support.message.subject && <p><span>Objet :</span> {support.message.subject}</p>}
        </div>
        <div className="exam-support__mail-body">
          {(support.message.lines || []).map((line, index) => <p key={index}>{line}</p>)}
        </div>
      </section>
    );
  }

  if ((kind === 'audio' || kind === 'dialogue') && support.audio) {
    const remaining = Math.max(0, 2 - listenCount);
    const speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const audioUnavailable = !speechAvailable || !voiceReady || !audioText;
    const canPlay = remaining > 0 && !audioUnavailable;
    const remainingLabel = ecouteLabel(remaining);

    const playAudio = () => {
      if (!canPlay) return;

      const frVoice = pickFrenchVoice();
      if (!frVoice) {
        setVoiceReady(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(audioText);
      utterance.voice = frVoice;
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.onstart = () => {
        setListenCount(count => Math.min(2, count + 1));
      };
      window.speechSynthesis.speak(utterance);
    };

    return (
      <section className="exam-support exam-support--audio" aria-label="Support de compréhension orale">
        <div className="exam-support__audio-main">
          <div>
            <p className="exam-support__audio-kicker">Compréhension orale</p>
            <p className="exam-support__audio-title">Document audio</p>
            {support.audio.speakers?.length > 0 && (
              <p className="exam-support__speakers">Locuteurs : {support.audio.speakers.join(' · ')}</p>
            )}
          </div>
          <button
            type="button"
            className="exam-support__listen"
            onClick={playAudio}
            disabled={!canPlay}
            aria-label={audioUnavailable ? 'Audio indisponible sur cet appareil.' : `Écouter le document audio. ${remainingLabel}.`}
          >
            <span aria-hidden="true">▶</span> Écouter
          </button>
        </div>
        <p className="exam-support__audio-note" role={audioUnavailable ? 'status' : undefined}>
          {audioUnavailable
            ? 'Audio indisponible sur cet appareil. Essayez un autre navigateur.'
            : remainingLabel}
        </p>
      </section>
    );
  }

  return null;
};

export default ExamSupport;
