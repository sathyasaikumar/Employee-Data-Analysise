import React, { useState, useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Camera, Download, Copy, Check, Sparkles, Image, Aperture, Eye, Loader2, Zap, Mic, MicOff, Volume2 } from 'lucide-react';

export default function HDScreenshotButton({ 
  datasetName = 'Dataset_Analytics', 
  theme = 'dark',
  targetSelector = '.content-area',
  className = '',
  compact = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceHeardPhrase, setVoiceHeardPhrase] = useState('');
  
  const menuRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /**
   * Ultra-High-Speed Canvas Capture Engine
   */
  const captureCanvasFast = useCallback(async (fullPage = false) => {
    setIsCapturing(true);
    setCaptureStatus('⚡ High-Speed Capturing...');

    let target = null;
    if (fullPage) {
      target = document.querySelector('.main-layout') || document.querySelector('.content-area') || document.body;
    } else {
      target = document.querySelector(targetSelector) || document.querySelector('.content-area') || document.body;
    }

    if (!target) {
      setIsCapturing(false);
      return null;
    }

    try {
      const isLight = theme === 'light';
      const bgColor = isLight ? '#f8fafc' : '#0a0e1a';

      setIsOpen(false);

      const canvas = await html2canvas(target, {
        scale: Math.min(window.devicePixelRatio || 2, 2),
        useCORS: false,
        allowTaint: true,
        backgroundColor: bgColor,
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        ignoreElements: (element) => {
          return (
            element.classList.contains('hd-screenshot-dropdown') ||
            element.classList.contains('mobile-filter-backdrop') ||
            element.classList.contains('hd-screenshot-toast-status') ||
            element.classList.contains('voice-screenshot-hud')
          );
        }
      });

      return canvas;
    } catch (err) {
      console.error('High-speed screenshot generation error:', err);
      setCaptureStatus('Capture Failed');
      setTimeout(() => setCaptureStatus(''), 1500);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [targetSelector, theme]);

  /**
   * Instant Blob-Streamed File Download (<10ms IO)
   */
  const handleDownloadHD = useCallback(async (format = 'png', fullPage = false, triggeredByVoice = false) => {
    const canvas = await captureCanvasFast(fullPage);
    if (!canvas) return;

    setCaptureStatus('⚡ Saving HD...');
    const isJpeg = format === 'jpeg';
    const mimeType = isJpeg ? 'image/jpeg' : 'image/png';

    canvas.toBlob((blob) => {
      if (!blob) return;
      const safeName = (datasetName || 'Dataset_Analytics')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${safeName}_HD_${timestamp}.${isJpeg ? 'jpg' : 'png'}`;

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setCaptureStatus(triggeredByVoice ? '🎙️ Voice: HD Captured!' : '📸 HD Captured!');

      if (triggeredByVoice && window.speechSynthesis) {
        try {
          const utterance = new SpeechSynthesisUtterance('Screenshot captured');
          utterance.rate = 1.2;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          // ignore
        }
      }

      setTimeout(() => setCaptureStatus(''), 2200);
    }, mimeType, isJpeg ? 0.95 : 1.0);
  }, [captureCanvasFast, datasetName]);

  /**
   * Instant Asynchronous Clipboard Stream
   */
  const handleCopyClipboard = useCallback(async (triggeredByVoice = false) => {
    const canvas = await captureCanvasFast(false);
    if (!canvas) return;

    setCaptureStatus('⚡ Copying to Clipboard...');
    try {
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setCaptureStatus(triggeredByVoice ? '🎙️ Voice: Copied to Clipboard!' : '✅ Copied to Clipboard!');
          if (triggeredByVoice && window.speechSynthesis) {
            try {
              const utterance = new SpeechSynthesisUtterance('Screenshot copied to clipboard');
              utterance.rate = 1.2;
              window.speechSynthesis.speak(utterance);
            } catch (e) {
              // ignore
            }
          }
          setTimeout(() => {
            setCopied(false);
            setCaptureStatus('');
          }, 2200);
        } else {
          handleDownloadHD('png', false, triggeredByVoice);
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Clipboard copy error, falling back to download:', err);
      handleDownloadHD('png', false, triggeredByVoice);
    }
  }, [captureCanvasFast, handleDownloadHD]);

  /**
   * Voice Command Web Speech Recognition Engine
   */
  const toggleVoiceCapture = (e) => {
    if (e) e.stopPropagation();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setCaptureStatus('Voice not supported');
      setTimeout(() => setCaptureStatus(''), 2500);
      return;
    }

    if (isVoiceListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceListening(false);
      setCaptureStatus('Voice Capture Disabled');
      setTimeout(() => setCaptureStatus(''), 1500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setCaptureStatus('🎙️ Voice Active: Say "Take Screenshot"');
      };

      recognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        setVoiceHeardPhrase(transcript);

        if (
          transcript.includes('screenshot') ||
          transcript.includes('take screenshot') ||
          transcript.includes('capture') ||
          transcript.includes('capture screen') ||
          transcript.includes('take picture') ||
          transcript.includes('snap') ||
          transcript.includes('camera') ||
          transcript.includes('snapshot') ||
          transcript.includes('photo')
        ) {
          if (transcript.includes('copy')) {
            handleCopyClipboard(true);
          } else if (transcript.includes('full') || transcript.includes('all')) {
            handleDownloadHD('png', true, true);
          } else {
            handleDownloadHD('png', false, true);
          }
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition notice:', event.error);
        }
      };

      recognition.onend = () => {
        if (isVoiceListening && recognitionRef.current) {
          try {
            recognition.start();
          } catch (err) {
            setIsVoiceListening(false);
          }
        } else {
          setIsVoiceListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech Recognition start error:', err);
      setIsVoiceListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div className={`hd-screenshot-wrapper ${className}`} ref={menuRef}>
      {/* UNIFIED ADVANCED MODEL CAMERA CAPSULE (UNIQUE COMPACT DESIGN) */}
      <div className={`hd-unified-capsule ${isOpen ? 'active' : ''} ${isCapturing ? 'capturing' : ''}`}>
        
        {/* Main Camera Click Area */}
        <button
          type="button"
          className="hd-capsule-main-btn"
          onClick={() => setIsOpen(prev => !prev)}
          title="Instant High-Speed HD Screenshot Capture"
          disabled={isCapturing}
        >
          <div className="hd-shutter-glow">
            {isCapturing ? (
              <Loader2 size={13} className="animate-spin text-cyan-400" />
            ) : (
              <Camera size={13} className="hd-lens-icon" />
            )}
          </div>
        </button>

        {/* Integrated Micro Voice Mic Trigger */}
        <button
          type="button"
          className={`hd-capsule-mic-btn ${isVoiceListening ? 'listening' : ''}`}
          onClick={toggleVoiceCapture}
          title={isVoiceListening ? "Voice Active: Say 'Take Screenshot' (Click to stop)" : "Enable Voice Command Screenshot"}
          aria-label="Voice Screenshot"
        >
          <Mic size={11} className={isVoiceListening ? "text-emerald-400" : "text-cyan-300"} />
          {isVoiceListening && <span className="voice-capsule-ping" />}
        </button>
      </div>

      {/* Floating Live Voice Listening HUD */}
      {isVoiceListening && (
        <div className="voice-screenshot-hud">
          <div className="voice-hud-wave">
            <span className="wave-bar bar-1" />
            <span className="wave-bar bar-2" />
            <span className="wave-bar bar-3" />
            <span className="wave-bar bar-4" />
          </div>
          <span className="voice-hud-text">
            {voiceHeardPhrase ? `🎤 "${voiceHeardPhrase}"` : '🎙️ Say "Take Screenshot"'}
          </span>
          <button 
            type="button" 
            className="voice-hud-stop-btn"
            onClick={toggleVoiceCapture}
            title="Stop voice listening"
          >
            ×
          </button>
        </div>
      )}

      {/* Capture Status Live Toast */}
      {captureStatus && !isVoiceListening && (
        <div className="hd-screenshot-toast-status">
          <Sparkles size={11} className="text-amber-400" />
          <span>{captureStatus}</span>
        </div>
      )}

      {/* Unique Glassmorphic High-Speed Dropdown */}
      {isOpen && (
        <div className="hd-screenshot-dropdown">
          <div className="hd-dropdown-header">
            <div className="hd-header-title">
              <Aperture size={13} className="text-cyan-400" />
              <span>Ultra-Speed HD Capture</span>
            </div>
            <span className="hd-header-tag">
              <Zap size={8} className="inline mr-0.5" /> 2x Retina
            </span>
          </div>

          <div className="hd-dropdown-options">
            <button
              type="button"
              className="hd-dropdown-item"
              onClick={() => handleDownloadHD('png', false, false)}
            >
              <div className="hd-item-icon-box bg-cyan">
                <Image size={12} />
              </div>
              <div className="hd-item-content">
                <span className="hd-item-title">⚡ Instant HD Snapshot (PNG)</span>
                <span className="hd-item-sub">Ultra-fast lossless 2x retina image</span>
              </div>
            </button>

            <button
              type="button"
              className="hd-dropdown-item"
              onClick={() => handleDownloadHD('png', true, false)}
            >
              <div className="hd-item-icon-box bg-blue">
                <Eye size={12} />
              </div>
              <div className="hd-item-content">
                <span className="hd-item-title">Full Dashboard & All Cards</span>
                <span className="hd-item-sub">Complete viewport + metrics</span>
              </div>
            </button>

            <button
              type="button"
              className="hd-dropdown-item"
              onClick={() => handleDownloadHD('jpeg', false, false)}
            >
              <div className="hd-item-icon-box bg-purple">
                <Download size={12} />
              </div>
              <div className="hd-item-content">
                <span className="hd-item-title">Compressed HD JPG</span>
                <span className="hd-item-sub">High quality 95% compressed file</span>
              </div>
            </button>

            <button
              type="button"
              className="hd-dropdown-item"
              onClick={() => handleCopyClipboard(false)}
            >
              <div className="hd-item-icon-box bg-emerald">
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </div>
              <div className="hd-item-content">
                <span className="hd-item-title">
                  {copied ? 'Copied to Clipboard!' : 'Copy HD to Clipboard'}
                </span>
                <span className="hd-item-sub">Instant paste in Slack / Teams / Slides</span>
              </div>
            </button>

            <button
              type="button"
              className={`hd-dropdown-item voice-toggle-item ${isVoiceListening ? 'active' : ''}`}
              onClick={toggleVoiceCapture}
            >
              <div className="hd-item-icon-box bg-voice">
                {isVoiceListening ? <Mic size={12} className="text-emerald-400" /> : <MicOff size={12} className="text-slate-400" />}
              </div>
              <div className="hd-item-content">
                <span className="hd-item-title" style={{ color: isVoiceListening ? '#34d399' : 'inherit' }}>
                  {isVoiceListening ? '🎙️ Voice Active (Listening...)' : '🎙️ Enable Voice Command'}
                </span>
                <span className="hd-item-sub">Say "Take Screenshot" to snap hands-free</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
