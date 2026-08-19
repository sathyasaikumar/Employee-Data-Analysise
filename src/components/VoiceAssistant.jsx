import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import {
  Mic, MicOff, Sparkles, Volume2, VolumeX, X, HelpCircle,
  LayoutDashboard, Sliders, Table, Calculator, GitCompare,
  Cpu, Brain, AlertTriangle, FileText, Download, Sun, Moon,
  Upload, Database, Search, RotateCcw, Maximize2, Zap, Check,
  Camera, Layers, ShieldCheck, User, Radio, Play
} from 'lucide-react';

export default function VoiceAssistant({
  embedded = false,
  // Navigation & Tabs
  activeTab,
  onSelectTab,
  // Modals
  onOpenAutoML,
  onCloseAutoML,
  onOpenDLStudio,
  onCloseDLStudio,
  onOpenDLExecutive,
  onCloseDLExecutive,
  onOpenMLPipeline,
  onCloseMLPipeline,
  onOpenAnomalies,
  onCloseAnomalies,
  onOpenCalculator,
  onCloseCalculator,
  onOpenProfile,
  onCloseProfile,
  // Datasets
  onUploadClick,
  onHistoryClick,
  onLiveUsersClick,
  onLoadSample,
  onBackToDashboard,
  datasetsList = [],
  onSelectDataset,
  datasetName = 'Dataset',
  // Export
  onExportPDF,
  onExportCSV,
  // Theme & Window
  theme = 'dark',
  onToggleTheme,
  onSetTheme,
  onLogout,
  // Filters & Search
  filters = {},
  onFilterChange,
  onResetFilters,
  isSidebarOpen = true,
  onToggleSidebar
}) {
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isVoiceFeedbackEnabled, setIsVoiceFeedbackEnabled] = useState(true);
  const [showCommandsHelp, setShowCommandsHelp] = useState(false);
  const [searchCommandQuery, setSearchCommandQuery] = useState('');

  const recognitionRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  // Speak voice response
  const speakFeedback = useCallback((text) => {
    if (!isVoiceFeedbackEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis notice:', e);
    }
  }, [isVoiceFeedbackEnabled]);

  // Show visual toast notification
  const triggerNotification = useCallback((message, speakText = null) => {
    setFeedbackMessage(message);
    if (speakText) {
      speakFeedback(speakText);
    }
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackMessage('');
    }, 3500);
  }, [speakFeedback]);

  // Fast HD Screenshot Capture
  const takeVoiceScreenshot = useCallback(async (fullPage = false, isCopy = false) => {
    triggerNotification('⚡ High-Speed Capturing Screenshot...', 'Capturing screenshot');
    try {
      const target = fullPage
        ? (document.querySelector('.main-layout') || document.body)
        : (document.querySelector('.content-area') || document.body);

      const canvas = await html2canvas(target, {
        scale: Math.min(window.devicePixelRatio || 2, 2),
        useCORS: false,
        allowTaint: true,
        backgroundColor: theme === 'light' ? '#f8fafc' : '#0a0e1a',
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        ignoreElements: (el) => el.classList.contains('voice-status-floating-toast')
      });

      if (isCopy) {
        canvas.toBlob(async (blob) => {
          if (blob && navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            triggerNotification('✅ Screenshot Copied to Clipboard!', 'Copied to clipboard');
          }
        }, 'image/png');
      } else {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const safeName = (datasetName || 'Dataset_Analytics').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const link = document.createElement('a');
          link.download = `${safeName}_Voice_HD_${timestamp}.png`;
          link.href = URL.createObjectURL(blob);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          triggerNotification('📸 HD Screenshot Saved!', 'Snapshot saved');
        }, 'image/png', 1.0);
      }
    } catch (err) {
      console.error('Voice screenshot failed:', err);
      triggerNotification('❌ Screenshot Failed');
    }
  }, [datasetName, theme, triggerNotification]);

  // Comprehensive NLP Voice Command Dispatcher
  const processVoiceCommand = useCallback((rawPhrase) => {
    const p = rawPhrase.toLowerCase().trim();
    setTranscript(rawPhrase);

    // 1. SCREENSHOT & CAPTURE COMMANDS
    if (p.includes('screenshot') || p.includes('capture') || p.includes('snapshot') || p.includes('take picture') || p.includes('snap')) {
      if (p.includes('copy') || p.includes('clipboard')) {
        takeVoiceScreenshot(false, true);
      } else if (p.includes('full') || p.includes('all') || p.includes('whole')) {
        takeVoiceScreenshot(true, false);
      } else {
        takeVoiceScreenshot(false, false);
      }
      return;
    }

    // 2. AUTOML AI COMMANDS
    if (p.includes('automl') || p.includes('auto ml') || p.includes('model intelligence')) {
      if (p.includes('close') || p.includes('exit') || p.includes('hide')) {
        if (onCloseAutoML) onCloseAutoML();
        triggerNotification('AutoML Engine Closed', 'Closing AutoML');
      } else {
        if (onOpenAutoML) onOpenAutoML();
        triggerNotification('🚀 Launching AutoML Model Intelligence Engine', 'Opening AutoML');
      }
      return;
    }

    // 3. DEEP LEARNING STUDIO COMMANDS
    if (p.includes('dl studio') || p.includes('deep learning studio') || p.includes('project analysis studio')) {
      if (p.includes('close') || p.includes('exit') || p.includes('hide')) {
        if (onCloseDLStudio) onCloseDLStudio();
        triggerNotification('Deep Learning Studio Closed', 'Closing Studio');
      } else {
        if (onOpenDLStudio) onOpenDLStudio();
        triggerNotification('🧠 Launching Deep Learning Project Analysis Studio', 'Opening Deep Learning Studio');
      }
      return;
    }

    // 4. DEEP LEARNING EXECUTIVE PLATFORM COMMANDS
    if (p.includes('deep learning') || p.includes('dl platform') || p.includes('neural network') || p.includes('deep learning platform')) {
      if (p.includes('close') || p.includes('exit') || p.includes('hide')) {
        if (onCloseDLExecutive) onCloseDLExecutive();
        triggerNotification('Deep Learning Platform Closed', 'Closing Deep Learning');
      } else {
        if (onOpenDLExecutive) onOpenDLExecutive();
        triggerNotification('⚡ Launching Deep Learning Executive Architecture Platform', 'Opening Deep Learning Platform');
      }
      return;
    }

    // 5. ML PIPELINE
    if (p.includes('pipeline') || p.includes('ml pipeline')) {
      if (p.includes('close') || p.includes('exit')) {
        if (onCloseMLPipeline) onCloseMLPipeline();
        triggerNotification('ML Pipeline Closed', 'Closing Pipeline');
      } else {
        if (onOpenMLPipeline) onOpenMLPipeline();
        triggerNotification('⚙️ Opening ML Pipeline Studio', 'Opening Pipeline');
      }
      return;
    }

    // 6. ANOMALY & OUTLIER DETECTION
    if (p.includes('anomaly') || p.includes('anomalies') || p.includes('outlier') || p.includes('outliers')) {
      if (p.includes('close') || p.includes('exit')) {
        if (onCloseAnomalies) onCloseAnomalies();
        triggerNotification('Anomaly Modal Closed', 'Closing Outliers');
      } else {
        if (onOpenAnomalies) onOpenAnomalies();
        triggerNotification('⚠️ Opening Automatic Anomaly & Outlier Detector', 'Opening Anomaly Detector');
      }
      return;
    }

    // 6.5. REAL-TIME CALCULATOR & FORMULA ENGINE
    if (p.includes('calculator') || p.includes('calculate') || p.includes('salary math') || p.includes('formula engine')) {
      if (p.includes('close') || p.includes('exit')) {
        if (onCloseCalculator) onCloseCalculator();
        triggerNotification('Calculator Closed', 'Closing Calculator');
      } else {
        if (onOpenCalculator) onOpenCalculator();
        triggerNotification('🧮 Opening Real-Time Workforce & Statistical Calculator', 'Opening Calculator');
      }
      return;
    }

    // 7. NAVIGATION & TAB SWITCHING
    if (p.includes('dashboard') || p.includes('executive dashboard') || p.includes('home')) {
      if (onBackToDashboard) onBackToDashboard();
      if (onSelectTab) onSelectTab('dashboard');
      triggerNotification('📊 Navigating to Executive Dashboard', 'Opening Dashboard');
      return;
    }

    if (p.includes('visual studio') || p.includes('chart builder') || p.includes('custom charts') || p.includes('charts')) {
      if (onBackToDashboard) onBackToDashboard();
      if (onSelectTab) onSelectTab('builder');
      triggerNotification('🎨 Navigating to Custom Visual Studio', 'Opening Visual Studio');
      return;
    }

    if (p.includes('table') || p.includes('data table') || p.includes('explorer') || p.includes('data explorer')) {
      if (onBackToDashboard) onBackToDashboard();
      if (onSelectTab) onSelectTab('table');
      triggerNotification('📋 Navigating to Data Explorer Table', 'Opening Data Table');
      return;
    }

    if (p.includes('statistic') || p.includes('stats') || p.includes('profiling') || p.includes('statistical')) {
      if (onBackToDashboard) onBackToDashboard();
      if (onSelectTab) onSelectTab('stats');
      triggerNotification('📐 Navigating to Statistical Profiling', 'Opening Statistics');
      return;
    }

    if (p.includes('comparison') || p.includes('compare') || p.includes('compare datasets') || p.includes('versus')) {
      if (onBackToDashboard) onBackToDashboard();
      if (onSelectTab) onSelectTab('comparison');
      triggerNotification('⚖️ Navigating to Dataset Comparison Analysis', 'Opening Comparison View');
      return;
    }

    if (p.includes('project') || p.includes('ai projects') || p.includes('templates')) {
      if (onBackToDashboard) onBackToDashboard();
      if (onSelectTab) onSelectTab('ai_projects');
      triggerNotification('📁 Navigating to AI Project Explorer', 'Opening AI Projects');
      return;
    }

    // 8. DATASET MANAGEMENT & SWITCHING
    if (p.includes('upload') || p.includes('new dataset') || p.includes('import')) {
      if (onUploadClick) onUploadClick();
      triggerNotification('📦 Opening Dataset Upload Dropzone', 'Opening Upload');
      return;
    }

    if (p.includes('history') || p.includes('saved datasets') || p.includes('previous dataset')) {
      if (onHistoryClick) onHistoryClick();
      triggerNotification('🗂️ Opening Dataset History & Storage', 'Opening Dataset History');
      return;
    }

    if (p.includes('workforce') || p.includes('hr dataset') || p.includes('employee')) {
      if (onLoadSample) onLoadSample('workforce');
      triggerNotification('🏢 Loading Enterprise Workforce Intelligence Dataset', 'Loading Workforce Dataset');
      return;
    }

    if (p.includes('sales') || p.includes('revenue') || p.includes('ecommerce')) {
      if (onLoadSample) onLoadSample('sales');
      triggerNotification('📈 Loading Global E-Commerce Revenue & Sales Dataset', 'Loading Sales Dataset');
      return;
    }

    if (p.includes('next dataset') || p.includes('switch dataset') || p.includes('change dataset')) {
      if (datasetsList && datasetsList.length > 1) {
        const currentIndex = datasetsList.findIndex(d => d.originalName === datasetName);
        const nextIndex = (currentIndex + 1) % datasetsList.length;
        const nextDs = datasetsList[nextIndex];
        if (nextDs && onSelectDataset) {
          onSelectDataset(nextDs.id);
          triggerNotification(`🔄 Switched to: ${nextDs.originalName}`, `Switched to ${nextDs.originalName}`);
          return;
        }
      }
    }

    if (p.includes('live users') || p.includes('active users') || p.includes('traffic')) {
      if (onLiveUsersClick) onLiveUsersClick();
      triggerNotification('🌐 Opening Real-Time Live Users Tracker', 'Opening Live Users Tracker');
      return;
    }

    // 9. REPORTS & EXPORTS
    if (p.includes('pdf') || p.includes('executive report') || p.includes('export report')) {
      if (onExportPDF) onExportPDF();
      triggerNotification('📄 Generating Executive Multi-Page PDF Report...', 'Generating PDF Report');
      return;
    }

    if (p.includes('export csv') || p.includes('download csv') || p.includes('export data')) {
      if (onExportCSV) onExportCSV();
      triggerNotification('📥 Exporting Filtered Dataset as CSV...', 'Exporting CSV');
      return;
    }

    // 10. THEME & DISPLAY COMMANDS
    if (p.includes('dark mode') || p.includes('dark theme')) {
      if (onSetTheme) onSetTheme('dark'); else if (onToggleTheme && theme !== 'dark') onToggleTheme();
      triggerNotification('🌙 Switched to Sleek Dark Mode', 'Dark mode enabled');
      return;
    }

    if (p.includes('light mode') || p.includes('light theme')) {
      if (onSetTheme) onSetTheme('light'); else if (onToggleTheme && theme !== 'light') onToggleTheme();
      triggerNotification('☀️ Switched to Crisp Light Mode', 'Light mode enabled');
      return;
    }

    if (p.includes('toggle theme') || p.includes('change theme')) {
      if (onToggleTheme) onToggleTheme();
      triggerNotification('🎨 Theme Mode Toggled', 'Theme switched');
      return;
    }

    if (p.includes('fullscreen') || p.includes('full screen')) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        triggerNotification('🖥️ Fullscreen Mode Enabled', 'Fullscreen active');
      } else {
        document.exitFullscreen().catch(() => {});
        triggerNotification('🖥️ Exited Fullscreen Mode', 'Exited fullscreen');
      }
      return;
    }

    // 11. USER PROFILE & LOGOUT
    if (p.includes('profile') || p.includes('my account') || p.includes('user details')) {
      if (onOpenProfile) onOpenProfile();
      triggerNotification('👤 Opening Executive Admin Profile', 'Opening Profile');
      return;
    }

    if (p.includes('log out') || p.includes('logout') || p.includes('sign out')) {
      if (onLogout) onLogout();
      triggerNotification('🔒 Logging Out of Session', 'Logging out');
      return;
    }

    // 12. FILTERING & SEARCH COMMANDS
    if (p.startsWith('search ') || p.startsWith('find ')) {
      const query = p.replace(/^(search|find)\s+/i, '').trim();
      if (query && onFilterChange) {
        onFilterChange({ ...filters, search: query });
        triggerNotification(`🔍 Filter Applied: "${query}"`, `Searching for ${query}`);
        return;
      }
    }

    if (p.includes('clear filter') || p.includes('reset filter') || p.includes('clear search') || p.includes('reset all')) {
      if (onResetFilters) onResetFilters();
      triggerNotification('🔄 All Filters Cleared & Reset', 'Filters cleared');
      return;
    }

    if (p.includes('toggle filter') || p.includes('show filter') || p.includes('hide filter') || p.includes('filter panel')) {
      if (onToggleSidebar) onToggleSidebar();
      triggerNotification('📂 Filter Sidebar Toggled', 'Filter panel toggled');
      return;
    }

    triggerNotification(`🤔 Heard: "${rawPhrase}" (Say "Help" for commands)`, `Heard ${rawPhrase}`);
  }, [
    activeTab, onSelectTab, onOpenAutoML, onCloseAutoML, onOpenDLStudio, onCloseDLStudio,
    onOpenDLExecutive, onCloseDLExecutive, onOpenMLPipeline, onCloseMLPipeline,
    onOpenAnomalies, onCloseAnomalies, onOpenProfile, onUploadClick, onHistoryClick,
    onLiveUsersClick, onLoadSample, onBackToDashboard, datasetsList, onSelectDataset,
    datasetName, onExportPDF, onExportCSV, theme, onToggleTheme, onSetTheme, onLogout,
    filters, onFilterChange, onResetFilters, onToggleSidebar, takeVoiceScreenshot, triggerNotification
  ]);

  // Toggle Global Voice Listening
  const toggleGlobalListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      triggerNotification('⚠️ Speech Recognition not supported in this browser');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      triggerNotification('🎙️ Voice Assistant Paused', 'Voice assistant paused');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        triggerNotification('🎙️ Global AI Voice Assistant Active: Say anything!', 'Voice assistant active');
      };

      recognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcriptText = event.results[lastResultIndex][0].transcript;
        processVoiceCommand(transcriptText);
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.warn('Voice recognition notice:', event.error);
        }
      };

      recognition.onend = () => {
        if (isListening && recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition init error:', err);
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Filtered Cheatsheet Categories
  const ALL_COMMAND_CATEGORIES = useMemo(() => [
    {
      id: 'ai',
      title: 'AI & Deep Learning',
      icon: Brain,
      color: '#c084fc',
      badge: 'PRO AI',
      commands: [
        { text: 'Open AutoML', desc: 'Launch AutoML Model Intelligence Engine', phrase: 'open automl' },
        { text: 'Open DL Studio', desc: 'Real-time Deep Learning Project Studio', phrase: 'open dl studio' },
        { text: 'Deep Learning Platform', desc: '68-Module Architecture Hub', phrase: 'deep learning platform' },
        { text: 'Anomaly Detection', desc: 'Automated Outlier Detector', phrase: 'detect outliers' },
        { text: 'ML Pipeline', desc: 'Interactive Pipeline Workflow Studio', phrase: 'open pipeline' },
        { text: 'Close AutoML', desc: 'Exit active AI model modal', phrase: 'close automl' }
      ]
    },
    {
      id: 'camera',
      title: 'HD Camera Screenshots',
      icon: Camera,
      color: '#38bdf8',
      badge: '2x RETINA',
      commands: [
        { text: 'Take Screenshot', desc: 'Instant high-speed 2x HD PNG download', phrase: 'take screenshot' },
        { text: 'Copy Screenshot', desc: 'Direct copy of HD screenshot to Clipboard', phrase: 'copy screenshot' },
        { text: 'Full Dashboard', desc: 'Capture all multi-card metrics in full viewport', phrase: 'full dashboard' },
        { text: 'Snapshot', desc: 'Fast view capture in high resolution', phrase: 'snapshot' }
      ]
    },
    {
      id: 'navigation',
      title: 'Navigation & Analytics Views',
      icon: LayoutDashboard,
      color: '#60a5fa',
      badge: 'TABS',
      commands: [
        { text: 'Executive Dashboard', desc: 'Main 2x2 charts & KPI cards', phrase: 'open dashboard' },
        { text: 'Visual Studio', desc: 'Custom Chart Builder Studio', phrase: 'visual studio' },
        { text: 'Data Table', desc: 'Data Explorer Table with sorting & search', phrase: 'data table' },
        { text: 'Statistical Profiling', desc: 'Math distributions & percentiles', phrase: 'statistics' },
        { text: 'Comparison View', desc: 'Cross-dataset variance analysis', phrase: 'compare datasets' },
        { text: 'AI Projects', desc: '12 Preloaded Deep Learning real-world templates', phrase: 'ai projects' }
      ]
    },
    {
      id: 'datasets',
      title: 'Dataset Management & Switching',
      icon: Database,
      color: '#34d399',
      badge: 'DATA',
      commands: [
        { text: 'Upload Dataset', desc: 'Open file dropzone for CSV/Excel/JSON', phrase: 'upload dataset' },
        { text: 'Dataset History', desc: 'View and restore previously saved files', phrase: 'dataset history' },
        { text: 'Load Workforce', desc: 'Load Enterprise Workforce Demo CSV', phrase: 'load workforce' },
        { text: 'Load Sales', desc: 'Load Global E-Commerce Sales Demo CSV', phrase: 'load sales' },
        { text: 'Switch Dataset', desc: 'Cycle to the next saved database file', phrase: 'switch dataset' }
      ]
    },
    {
      id: 'reports',
      title: 'Reports, Export & Traffic',
      icon: FileText,
      color: '#f472b6',
      badge: 'EXPORT',
      commands: [
        { text: 'Export PDF', desc: 'Generate multi-page Executive PDF Report', phrase: 'export pdf' },
        { text: 'Export CSV', desc: 'Download filtered dataset as clean CSV', phrase: 'export csv' },
        { text: 'Live Users', desc: 'Real-time active website connection tracker', phrase: 'live users' }
      ]
    },
    {
      id: 'system',
      title: 'Theme, Search & Admin Profile',
      icon: Sun,
      color: '#fbbf24',
      badge: 'SYSTEM',
      commands: [
        { text: 'Dark Mode', desc: 'Switch interface to sleek Dark Mode', phrase: 'dark mode' },
        { text: 'Light Mode', desc: 'Switch interface to crisp Light Mode', phrase: 'light mode' },
        { text: 'Fullscreen', desc: 'Toggle Fullscreen display mode', phrase: 'fullscreen' },
        { text: 'Search [Keyword]', desc: 'Apply real-time keyword filter', phrase: 'search finance' },
        { text: 'Clear Filters', desc: 'Reset all active filters', phrase: 'clear filters' },
        { text: 'User Profile', desc: 'Open Executive Admin personal profile', phrase: 'profile' }
      ]
    }
  ], []);

  const filteredCategories = useMemo(() => {
    if (!searchCommandQuery.trim()) return ALL_COMMAND_CATEGORIES;
    const q = searchCommandQuery.toLowerCase().trim();
    return ALL_COMMAND_CATEGORIES.map(cat => {
      const matched = cat.commands.filter(cmd => 
        cmd.text.toLowerCase().includes(q) || 
        cmd.desc.toLowerCase().includes(q) ||
        cmd.phrase.toLowerCase().includes(q)
      );
      return { ...cat, commands: matched };
    }).filter(cat => cat.commands.length > 0);
  }, [ALL_COMMAND_CATEGORIES, searchCommandQuery]);

  return (
    <>
      {/* ===================================================================
          SYSTEM FOLDER EMBEDDED VOICE CONTROLLER MODULE (COMPACT & SLEEK)
          =================================================================== */}
      <div className="folder-voice-compact-card">
        {/* Main interactive row */}
        <div className="folder-voice-main-row">
          <div className="folder-voice-left-col">
            <button
              type="button"
              className={`folder-voice-orb-btn ${isListening ? 'listening' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleGlobalListening();
              }}
              title={isListening ? "Voice Active: Click to Stop" : "Click to Enable Voice AI"}
            >
              <Mic size={13} className={isListening ? "text-emerald-400 animate-pulse" : "text-cyan-400"} />
              {isListening && <span className="voice-radar-ping" />}
            </button>
            <div className="folder-voice-meta">
              <div className="folder-voice-heading">
                <span>Hands-Free Voice AI</span>
                {isListening ? (
                  <span className="voice-status-badge active">LIVE</span>
                ) : (
                  <span className="voice-status-badge off">OFF</span>
                )}
              </div>
              <span className="folder-voice-caption">
                {isListening ? 'Listening for commands...' : 'Voice command platform'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`folder-voice-toggle-pill ${isListening ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleGlobalListening();
            }}
          >
            {isListening ? 'Active' : 'Start'}
          </button>
        </div>

        {/* Bottom micro toolbar */}
        <div className="folder-voice-bottom-row">
          <button
            type="button"
            className="folder-voice-link-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowCommandsHelp(true);
            }}
          >
            <HelpCircle size={10} className="text-cyan-400" />
            <span>Voice Commands Cheatsheet</span>
          </button>

          <button
            type="button"
            className="folder-voice-sound-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsVoiceFeedbackEnabled(prev => !prev);
            }}
            title={isVoiceFeedbackEnabled ? "Voice Feedback Enabled (Click to Mute)" : "Voice Feedback Muted (Click to Enable)"}
          >
            {isVoiceFeedbackEnabled ? <Volume2 size={11} className="text-emerald-400" /> : <VolumeX size={11} className="text-slate-400" />}
          </button>
        </div>
      </div>

      {/* ===================================================================
          NON-INTRUSIVE STATUS TOAST NOTIFICATION (AUTO-FADES IN 2.5S)
          =================================================================== */}
      {feedbackMessage && (
        <div className="voice-status-floating-toast">
          <Sparkles size={13} className="text-cyan-400 animate-spin" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ===================================================================
          CRYSTAL-CLEAR FULL-SCREEN PORTAL VOICE COMMANDS CHEATSHEET MODAL
          =================================================================== */}
      {showCommandsHelp && createPortal(
        <div 
          className="voice-commands-modal-overlay" 
          onClick={() => setShowCommandsHelp(false)}
          data-theme={theme}
        >
          <div 
            className="voice-commands-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="voice-modal-header">
              <div className="voice-modal-header-left">
                <div className="voice-header-icon-box">
                  <Mic size={18} className="text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="voice-modal-title">Global AI Voice Commands Directory</h2>
                    <span className="voice-pro-badge">Real-Time NLP</span>
                  </div>
                  <p className="voice-modal-sub">
                    Speak naturally to command any feature hands-free, or click <strong>Run</strong> to test instantly
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                className="voice-close-modal-btn" 
                onClick={() => setShowCommandsHelp(false)}
                title="Close Cheatsheet"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Filter Search Bar */}
            <div className="voice-modal-search-bar">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                value={searchCommandQuery}
                onChange={(e) => setSearchCommandQuery(e.target.value)}
                placeholder="Search commands (e.g. 'AutoML', 'Screenshot', 'Dark Mode', 'PDF', 'Workforce')..."
                className="voice-search-input"
                autoFocus
              />
              {searchCommandQuery && (
                <button
                  type="button"
                  className="voice-search-clear-btn"
                  onClick={() => setSearchCommandQuery('')}
                >
                  ×
                </button>
              )}
            </div>

            {/* Commands Grid */}
            <div className="voice-commands-grid">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => {
                  const IconComp = category.icon;
                  return (
                    <div key={category.id} className="voice-command-card">
                      <div className="card-header">
                        <div className="flex items-center gap-2">
                          <IconComp size={15} style={{ color: category.color }} />
                          <span className="card-title-text">{category.title}</span>
                        </div>
                        <span className="card-badge-pill" style={{ color: category.color, borderColor: `${category.color}40` }}>
                          {category.badge}
                        </span>
                      </div>

                      <div className="command-list">
                        {category.commands.map((cmd, idx) => (
                          <div key={idx} className="command-row-item">
                            <div className="command-text-col">
                              <code className="voice-phrase-code">"{cmd.text}"</code>
                              <span className="voice-desc-text">{cmd.desc}</span>
                            </div>
                            <button
                              type="button"
                              className="voice-test-run-btn"
                              onClick={() => {
                                processVoiceCommand(cmd.phrase);
                                setShowCommandsHelp(false);
                              }}
                              title={`Execute "${cmd.text}"`}
                            >
                              <Play size={10} />
                              <span>Run</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="voice-no-results">
                  <AlertTriangle size={24} className="text-amber-400 mb-2" />
                  <p>No voice commands matching "{searchCommandQuery}"</p>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm mt-2" 
                    onClick={() => setSearchCommandQuery('')}
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="voice-modal-footer">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`btn ${isListening ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => toggleGlobalListening()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800 }}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  <span>{isListening ? 'Pause Voice Listening' : 'Start Voice Listening Now'}</span>
                </button>
                <span className="voice-footer-hint">
                  {isListening ? '🟢 Active: Microphone is listening in real time' : '⚪ Inactive: Click above to enable hands-free voice control'}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
