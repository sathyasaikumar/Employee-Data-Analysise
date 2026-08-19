import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Calculator,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  Clock,
  History,
  Trash2,
  Percent,
  Sigma,
  Activity,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export default function RealtimeCalculatorModal({
  isOpen,
  onClose,
  initialValue = null,
  initialMode = 'standard', // 'standard' | 'workforce' | 'stats'
  stats = {},
  schema = {},
  totalRows = 0,
  filteredRows = 0,
  datasetName = 'Workforce Dataset',
  theme = 'dark',
  onDeleteSuccess = null
}) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  // Modal window states
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialMode); // 'standard' | 'workforce' | 'stats' | 'history'
  const [copiedNotification, setCopiedNotification] = useState(null);

  // Standard / Scientific Calculator State
  const [expression, setExpression] = useState(() => {
    if (initialValue !== null && initialValue !== undefined && !isNaN(initialValue)) {
      return String(initialValue);
    }
    return '';
  });
  const [calcResult, setCalcResult] = useState(() => {
    if (initialValue !== null && initialValue !== undefined && !isNaN(initialValue)) {
      return Number(initialValue);
    }
    return 0;
  });
  const [displayFormat, setDisplayFormat] = useState('standard'); // 'standard' | 'currency' | 'percent' | 'scientific'
  const [currencySymbol, setCurrencySymbol] = useState('₹'); // Default ₹ or $
  const [memoryVal, setMemoryVal] = useState(0);
  const [isMemoryActive, setIsMemoryActive] = useState(false);
  const [calcHistory, setCalcHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('realtime_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected column for live dataset metrics
  const numericHeaders = useMemo(() => {
    return Object.keys(schema || {}).filter(h => schema[h] === 'numeric');
  }, [schema]);

  const [selectedColumn, setSelectedColumn] = useState(() => {
    if (numericHeaders.length > 0) {
      const salaryCol = numericHeaders.find(h =>
        h.toLowerCase().includes('salary') ||
        h.toLowerCase().includes('revenue') ||
        h.toLowerCase().includes('amount') ||
        h.toLowerCase().includes('comp')
      );
      return salaryCol || numericHeaders[0];
    }
    return '';
  });

  // Keep selectedColumn synced if headers change
  useEffect(() => {
    if (numericHeaders.length > 0 && (!selectedColumn || !numericHeaders.includes(selectedColumn))) {
      const salaryCol = numericHeaders.find(h =>
        h.toLowerCase().includes('salary') ||
        h.toLowerCase().includes('revenue') ||
        h.toLowerCase().includes('amount') ||
        h.toLowerCase().includes('comp')
      );
      setSelectedColumn(salaryCol || numericHeaders[0]);
    }
  }, [numericHeaders, selectedColumn]);

  // Update expression if initialValue changes when opened
  useEffect(() => {
    if (isOpen && initialValue !== null && initialValue !== undefined && !isNaN(initialValue)) {
      const formatted = typeof initialValue === 'number' ? initialValue.toString() : String(initialValue);
      setExpression(formatted);
      setCalcResult(Number(initialValue));
    }
  }, [isOpen, initialValue]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('realtime_calc_history', JSON.stringify(calcHistory.slice(0, 50)));
    } catch (e) {
      console.warn('Calc history cache notice:', e);
    }
  }, [calcHistory]);

  // Live active column stats
  const activeColStats = useMemo(() => {
    if (selectedColumn && stats && stats[selectedColumn]) {
      return stats[selectedColumn];
    }
    // Fallback if no specific column stat
    return {
      mean: 96750,
      median: 94200,
      min: 32000,
      max: 280000,
      sum: 96750000,
      stdDev: 24500,
      q25: 72000,
      q75: 125000,
      variance: 600250000
    };
  }, [selectedColumn, stats]);

  const liveMean = activeColStats.mean !== undefined ? activeColStats.mean : 96750;
  const liveMedian = activeColStats.median !== undefined ? activeColStats.median : 94200;
  const liveMin = activeColStats.min !== undefined ? activeColStats.min : 32000;
  const liveMax = activeColStats.max !== undefined ? activeColStats.max : 280000;
  const liveSum = activeColStats.sum !== undefined ? activeColStats.sum : (liveMean * (totalRows || 100));
  const liveStdDev = activeColStats.stdDev !== undefined ? activeColStats.stdDev : Math.round(liveMean * 0.25);
  const liveQ25 = activeColStats.q25 !== undefined ? activeColStats.q25 : Math.round(liveMedian * 0.8);
  const liveQ75 = activeColStats.q75 !== undefined ? activeColStats.q75 : Math.round(liveMedian * 1.25);
  const liveIQR = liveQ75 - liveQ25;

  // Safe Mathematical Evaluator for Expression
  const evaluateMathExpression = useCallback((expr) => {
    if (!expr || !expr.trim()) return 0;
    try {
      // Clean and sanitize string
      let sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^/g, '**')
        .replace(/π/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E');

      // Replace % with /100 when applied to numbers
      sanitized = sanitized.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

      // Validate characters allowed for safety
      if (/[^0-9+\-*/().\s,Math.PIEsincoztanqlrveg**]/.test(sanitized)) {
        return NaN;
      }

      // Safe Function evaluation
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return result;
      }
      return NaN;
    } catch {
      return NaN;
    }
  }, []);

  // Real-time live evaluation preview as user types
  const livePreview = useMemo(() => {
    if (!expression || !expression.trim()) return null;
    const res = evaluateMathExpression(expression);
    if (!isNaN(res) && isFinite(res)) {
      return res;
    }
    return null;
  }, [expression, evaluateMathExpression]);

  // Execute Calculation (=)
  const handleCalculate = () => {
    if (!expression || !expression.trim()) return;
    const res = evaluateMathExpression(expression);
    if (!isNaN(res) && isFinite(res)) {
      setCalcResult(res);
      const newEntry = {
        id: Date.now(),
        expression: expression,
        result: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        format: displayFormat
      };
      setCalcHistory(prev => [newEntry, ...prev.slice(0, 49)]);
      setExpression(String(res));
    } else {
      setCalcResult('Error');
    }
  };

  // Append Token to Expression
  const appendToken = (token) => {
    setExpression(prev => {
      // If previous was '0' and typing a number, replace 0
      if (prev === '0' && /^[0-9]$/.test(token)) return token;
      return prev + token;
    });
  };

  // Clear Expression
  const handleClear = () => {
    setExpression('');
    setCalcResult(0);
  };

  // Backspace
  const handleBackspace = () => {
    setExpression(prev => (prev.length > 0 ? prev.slice(0, -1) : ''));
  };

  // Scientific & Unary operations
  const handleUnaryOp = (op) => {
    const currentNum = livePreview !== null ? livePreview : evaluateMathExpression(expression) || 0;
    let res = 0;
    let newExpr = '';

    switch (op) {
      case 'sqrt':
        if (currentNum < 0) return;
        res = Math.sqrt(currentNum);
        newExpr = `Math.sqrt(${currentNum})`;
        break;
      case 'sqr':
        res = Math.pow(currentNum, 2);
        newExpr = `(${currentNum}**2)`;
        break;
      case 'cube':
        res = Math.pow(currentNum, 3);
        newExpr = `(${currentNum}**3)`;
        break;
      case 'inv':
        if (currentNum === 0) return;
        res = 1 / currentNum;
        newExpr = `(1/${currentNum})`;
        break;
      case 'sin':
        res = Math.sin((currentNum * Math.PI) / 180);
        newExpr = `Math.sin((${currentNum}*Math.PI)/180)`;
        break;
      case 'cos':
        res = Math.cos((currentNum * Math.PI) / 180);
        newExpr = `Math.cos((${currentNum}*Math.PI)/180)`;
        break;
      case 'tan':
        res = Math.tan((currentNum * Math.PI) / 180);
        newExpr = `Math.tan((${currentNum}*Math.PI)/180)`;
        break;
      case 'ln':
        if (currentNum <= 0) return;
        res = Math.log(currentNum);
        newExpr = `Math.log(${currentNum})`;
        break;
      case 'log10':
        if (currentNum <= 0) return;
        res = Math.log10(currentNum);
        newExpr = `Math.log10(${currentNum})`;
        break;
      case 'abs':
        res = Math.abs(currentNum);
        newExpr = `Math.abs(${currentNum})`;
        break;
      case 'neg':
        res = -currentNum;
        newExpr = `(-1*${currentNum})`;
        break;
      case 'fact': {
        const n = Math.floor(Math.abs(currentNum));
        if (n > 170) return; // Prevent Infinity
        let f = 1;
        for (let i = 2; i <= n; i++) f *= i;
        res = f;
        newExpr = `${n}!`;
        break;
      }
      default:
        return;
    }

    setCalcResult(res);
    setExpression(String(res));
    setCalcHistory(prev => [
      {
        id: Date.now(),
        expression: newExpr,
        result: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        format: displayFormat
      },
      ...prev.slice(0, 49)
    ]);
  };

  // Memory Handlers
  const handleMemory = (action) => {
    const currentNum = livePreview !== null ? livePreview : (Number(calcResult) || 0);
    switch (action) {
      case 'MC':
        setMemoryVal(0);
        setIsMemoryActive(false);
        break;
      case 'MR':
        appendToken(String(memoryVal));
        break;
      case 'M+':
        setMemoryVal(prev => prev + currentNum);
        setIsMemoryActive(true);
        break;
      case 'M-':
        setMemoryVal(prev => prev - currentNum);
        setIsMemoryActive(true);
        break;
      case 'MS':
        setMemoryVal(currentNum);
        setIsMemoryActive(true);
        break;
      default:
        break;
    }
  };

  // Insert Live Dataset Variable
  const handleInsertDatasetVariable = (val, label) => {
    if (val === undefined || val === null || isNaN(val)) return;
    const rounded = Number(Number(val).toFixed(2));
    appendToken(String(rounded));
    setCopiedNotification(`Inserted ${label} (${rounded.toLocaleString()})`);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  // Copy result to clipboard
  const handleCopyResult = (val) => {
    const targetVal = val !== undefined ? val : (livePreview !== null ? livePreview : calcResult);
    navigator.clipboard.writeText(String(targetVal)).then(() => {
      setCopiedNotification(`Copied ${targetVal.toLocaleString()} to clipboard!`);
      setTimeout(() => setCopiedNotification(null), 2500);
    }).catch(() => {});
  };

  // Hardware Keyboard Event Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (activeTab !== 'standard') return;
      // Do not intercept if user is inside an input box in other tabs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key;
      if (/^[0-9.]$/.test(key)) {
        e.preventDefault();
        appendToken(key);
      } else if (key === '+') {
        e.preventDefault();
        appendToken(' + ');
      } else if (key === '-') {
        e.preventDefault();
        appendToken(' - ');
      } else if (key === '*') {
        e.preventDefault();
        appendToken(' * ');
      } else if (key === '/') {
        e.preventDefault();
        appendToken(' / ');
      } else if (key === '(' || key === ')') {
        e.preventDefault();
        appendToken(key);
      } else if (key === '%') {
        e.preventDefault();
        appendToken('%');
      } else if (key === '^') {
        e.preventDefault();
        appendToken('^');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape') {
        e.preventDefault();
        if (expression) {
          handleClear();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, expression, evaluateMathExpression, onClose]);

  // Formatted Output Display
  const formatDisplayValue = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return val || '0';
    if (displayFormat === 'currency') {
      return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (displayFormat === 'percent') {
      return `${(val * 100).toFixed(2)}%`;
    }
    if (displayFormat === 'scientific') {
      return val.toExponential(4);
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  // --- WORKFORCE & ENTERPRISE CALCULATORS STATE & LOGIC ---
  // 1. Salary Hike & Revision
  const [hikeBaseSalary, setHikeBaseSalary] = useState(() => liveMedian || 96750);
  const [hikePercentage, setHikePercentage] = useState(12.5);
  const [hikeBonusPercent, setHikeBonusPercent] = useState(10);

  useEffect(() => {
    if (liveMedian && hikeBaseSalary === 96750 && liveMedian !== 96750) {
      setHikeBaseSalary(liveMedian);
    }
  }, [liveMedian, hikeBaseSalary]);

  const hikeCalculations = useMemo(() => {
    const base = Number(hikeBaseSalary) || 0;
    const hikePct = Number(hikePercentage) || 0;
    const bonusPct = Number(hikeBonusPercent) || 0;

    const hikeAmountAnnual = base * (hikePct / 100);
    const newAnnualBase = base + hikeAmountAnnual;
    const bonusAmountAnnual = newAnnualBase * (bonusPct / 100);
    const totalNewCTC = newAnnualBase + bonusAmountAnnual;

    const oldMonthly = base / 12;
    const newMonthly = newAnnualBase / 12;
    const monthlyHike = hikeAmountAnnual / 12;

    return {
      base,
      hikePct,
      hikeAmountAnnual,
      newAnnualBase,
      bonusAmountAnnual,
      totalNewCTC,
      oldMonthly,
      newMonthly,
      monthlyHike
    };
  }, [hikeBaseSalary, hikePercentage, hikeBonusPercent]);

  // 2. Overtime & Hourly Rate Converter
  const [otAnnualSalary, setOtAnnualSalary] = useState(() => liveMedian || 96750);
  const [otWeeklyHours, setOtWeeklyHours] = useState(40);
  const [otExtraHoursPerWeek, setOtExtraHoursPerWeek] = useState(8);
  const [otMultiplier, setOtMultiplier] = useState(1.5); // 1.5x standard overtime

  const otCalculations = useMemo(() => {
    const salary = Number(otAnnualSalary) || 0;
    const stdHours = Number(otWeeklyHours) || 40;
    const otHours = Number(otExtraHoursPerWeek) || 0;
    const multiplier = Number(otMultiplier) || 1.5;

    const annualStdHours = stdHours * 52;
    const hourlyBase = annualStdHours > 0 ? salary / annualStdHours : 0;
    const hourlyOT = hourlyBase * multiplier;

    const weeklyStdPay = hourlyBase * stdHours;
    const weeklyOTPay = hourlyOT * otHours;
    const weeklyTotal = weeklyStdPay + weeklyOTPay;

    const monthlyProjected = (weeklyTotal * 52) / 12;
    const annualProjected = weeklyTotal * 52;
    const extraAnnualEarned = weeklyOTPay * 52;

    return {
      hourlyBase,
      hourlyOT,
      weeklyStdPay,
      weeklyOTPay,
      weeklyTotal,
      monthlyProjected,
      annualProjected,
      extraAnnualEarned
    };
  }, [otAnnualSalary, otWeeklyHours, otExtraHoursPerWeek, otMultiplier]);

  // 3. Payroll & Net Take-Home Pay Estimator
  const [payrollGross, setPayrollGross] = useState(() => liveMedian || 96750);
  const [payrollTaxBracket, setPayrollTaxBracket] = useState(18); // 18% avg effective tax
  const [payrollProvidentFund, setPayrollProvidentFund] = useState(12); // 12% PF/401k
  const [payrollHealthInsurance, setPayrollHealthInsurance] = useState(2500); // Annual / fixed

  const payrollCalculations = useMemo(() => {
    const gross = Number(payrollGross) || 0;
    const taxPct = Number(payrollTaxBracket) || 0;
    const pfPct = Number(payrollProvidentFund) || 0;
    const insurance = Number(payrollHealthInsurance) || 0;

    const taxAmount = gross * (taxPct / 100);
    const pfAmount = gross * (pfPct / 100);
    const totalDeductions = taxAmount + pfAmount + insurance;
    const netAnnual = Math.max(0, gross - totalDeductions);
    const netMonthly = netAnnual / 12;
    const deductionsMonthly = totalDeductions / 12;
    const takeHomePercentage = gross > 0 ? ((netAnnual / gross) * 100).toFixed(1) : '100';

    return {
      gross,
      taxAmount,
      pfAmount,
      insurance,
      totalDeductions,
      netAnnual,
      netMonthly,
      deductionsMonthly,
      takeHomePercentage
    };
  }, [payrollGross, payrollTaxBracket, payrollProvidentFund, payrollHealthInsurance]);

  // 4. CAGR & Compound Growth
  const [cagrStartVal, setCagrStartVal] = useState(() => liveMin || 45000);
  const [cagrEndVal, setCagrEndVal] = useState(() => liveMedian || 96750);
  const [cagrYears, setCagrYears] = useState(3);

  const cagrCalculations = useMemo(() => {
    const start = Number(cagrStartVal) || 0;
    const end = Number(cagrEndVal) || 0;
    const periods = Number(cagrYears) || 1;

    if (start <= 0 || end <= 0 || periods <= 0) {
      return { cagr: 0, totalGrowth: 0, absoluteChange: 0 };
    }

    const cagr = (Math.pow(end / start, 1 / periods) - 1) * 100;
    const totalGrowth = ((end - start) / start) * 100;
    const absoluteChange = end - start;

    return {
      cagr: cagr.toFixed(2),
      totalGrowth: totalGrowth.toFixed(2),
      absoluteChange
    };
  }, [cagrStartVal, cagrEndVal, cagrYears]);

  // --- STATISTICAL INFERENCE & CONFIDENCE ENGINE ---
  const [zScoreValue, setZScoreValue] = useState(() => liveMedian || 96750);
  const [ciConfidenceLevel, setCiConfidenceLevel] = useState(0.95); // 95% CI

  const statsCalculations = useMemo(() => {
    const x = Number(zScoreValue) || 0;
    const mean = liveMean || 0;
    const stdDev = liveStdDev > 0 ? liveStdDev : 1;
    const n = totalRows > 0 ? totalRows : 100;

    // 1. Z-Score
    const z = (x - mean) / stdDev;

    // Approximate percentile using standard normal CDF approximation
    const cdf = (val) => {
      const t = 1 / (1 + 0.2316419 * Math.abs(val));
      const d = 0.3989423 * Math.exp((-val * val) / 2);
      let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      if (val > 0) prob = 1 - prob;
      return prob;
    };
    const percentile = (cdf(z) * 100).toFixed(1);

    let outlierStatus = 'Typical / Within 1σ Normal Band';
    let outlierColor = 'emerald';
    if (Math.abs(z) > 3) {
      outlierStatus = '⚠️ Extreme Statistical Outlier (> 3σ)';
      outlierColor = 'rose';
    } else if (Math.abs(z) > 2) {
      outlierStatus = '⚡ Significant Deviation (2σ - 3σ)';
      outlierColor = 'amber';
    } else if (Math.abs(z) > 1) {
      outlierStatus = 'ℹ️ Moderate Variation (1σ - 2σ)';
      outlierColor = 'blue';
    }

    // 2. Margin of Error & Confidence Interval
    // Z-critical: 90% -> 1.645, 95% -> 1.96, 99% -> 2.576
    const zCrit = ciConfidenceLevel === 0.99 ? 2.576 : ciConfidenceLevel === 0.90 ? 1.645 : 1.96;
    const stdError = stdDev / Math.sqrt(n);
    const marginOfError = zCrit * stdError;
    const ciLower = mean - marginOfError;
    const ciUpper = mean + marginOfError;

    // 3. Coefficient of Variation (CV)
    const cv = mean > 0 ? ((stdDev / mean) * 100).toFixed(2) : '0.00';

    return {
      z: z.toFixed(3),
      percentile,
      outlierStatus,
      outlierColor,
      marginOfError: marginOfError.toFixed(2),
      ciLower: ciLower.toFixed(2),
      ciUpper: ciUpper.toFixed(2),
      cv,
      zCrit
    };
  }, [zScoreValue, liveMean, liveStdDev, totalRows, ciConfidenceLevel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`realtime-calculator-modal-overlay ${isFullScreen ? 'is-fullscreen-overlay' : ''}`}
      onClick={() => {
        setIsFullScreen(false);
        onClose();
      }}
    >
      <div
        className={`realtime-calculator-modal-card ${isFullScreen ? 'is-fullscreen-modal' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="calc-modal-header">
          <div className="calc-header-brand">
            <div className="calc-header-icon-box">
              <Calculator size={18} className="text-purple-400" />
            </div>
            <div className="calc-header-text">
              <div className="calc-title-row">
                <h3 className="calc-main-title">Real-Time Enterprise Analytics Calculator</h3>
                <span className="calc-live-pill">
                  <span className="calc-live-dot animate-pulse"></span>
                  LIVE DATASET SYNC
                </span>
              </div>
              <p className="calc-subtitle">
                High-precision Workforce, Financial & Statistical Formula Engine for <strong>{datasetName}</strong>
              </p>
            </div>
          </div>

          <div className="calc-header-controls">
            {/* Currency Symbol Selector */}
            <div className="calc-currency-selector-mini" title="Select Display Currency Symbol">
              {['₹', '$', '€', '£', '¥'].map(sym => (
                <button
                  key={sym}
                  type="button"
                  className={`calc-sym-btn ${currencySymbol === sym ? 'active' : ''}`}
                  onClick={() => setCurrencySymbol(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              className="calc-icon-control-btn"
              onClick={() => setIsFullScreen(prev => !prev)}
              title={isFullScreen ? 'Exit Full Screen' : 'Expand Full Screen'}
            >
              {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="calc-icon-control-btn close-btn"
              onClick={() => {
                setIsFullScreen(false);
                onClose();
              }}
              title="Close Calculator (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* LIVE DATASET CONNECTIVITY STRIP */}
        <div className="calc-dataset-strip">
          <div className="calc-strip-column-select">
            <span className="strip-label">
              <Layers size={12} className="text-blue-400" /> Column:
            </span>
            <select
              className="strip-select"
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              title="Select numeric column to sync statistical metrics"
            >
              {numericHeaders.length === 0 ? (
                <option value="">No numeric column</option>
              ) : (
                numericHeaders.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))
              )}
            </select>
          </div>

          <div className="calc-variable-chips-container">
            <span className="strip-label-mini">1-Click Live Variables:</span>
            <button
              type="button"
              className="calc-var-chip purple"
              onClick={() => handleInsertDatasetVariable(liveMedian, 'Median')}
              title="Click to insert live Median into calculator formula"
            >
              <span className="chip-name">Median:</span>
              <span className="chip-val">{currencySymbol}{liveMedian.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            </button>

            <button
              type="button"
              className="calc-var-chip rose"
              onClick={() => handleInsertDatasetVariable(liveMean, 'Mean')}
              title="Click to insert live Mean / Average into calculator formula"
            >
              <span className="chip-name">Mean:</span>
              <span className="chip-val">{currencySymbol}{liveMean.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            </button>

            <button
              type="button"
              className="calc-var-chip cyan"
              onClick={() => handleInsertDatasetVariable(liveMin, 'Min')}
              title="Click to insert lowest recorded value"
            >
              <span className="chip-name">Min:</span>
              <span className="chip-val">{currencySymbol}{liveMin.toLocaleString()}</span>
            </button>

            <button
              type="button"
              className="calc-var-chip emerald"
              onClick={() => handleInsertDatasetVariable(liveMax, 'Max')}
              title="Click to insert maximum peak value"
            >
              <span className="chip-name">Max:</span>
              <span className="chip-val">{currencySymbol}{liveMax.toLocaleString()}</span>
            </button>

            <button
              type="button"
              className="calc-var-chip amber"
              onClick={() => handleInsertDatasetVariable(liveStdDev, 'StdDev')}
              title="Click to insert Standard Deviation (σ)"
            >
              <span className="chip-name">σ StdDev:</span>
              <span className="chip-val">{liveStdDev.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            </button>

            <button
              type="button"
              className="calc-var-chip blue"
              onClick={() => handleInsertDatasetVariable(totalRows, 'Total Records')}
              title="Click to insert dataset record count"
            >
              <span className="chip-name">N:</span>
              <span className="chip-val">{totalRows.toLocaleString()}</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="calc-mode-tabs">
          <button
            type="button"
            className={`calc-mode-tab ${activeTab === 'standard' ? 'active' : ''}`}
            onClick={() => setActiveTab('standard')}
          >
            <Calculator size={14} />
            <span>Scientific & Live Keypad</span>
          </button>

          <button
            type="button"
            className={`calc-mode-tab ${activeTab === 'workforce' ? 'active' : ''}`}
            onClick={() => setActiveTab('workforce')}
          >
            <Briefcase size={14} />
            <span>Workforce & Salary Suite</span>
            <span className="tab-badge-pro">PRO</span>
          </button>

          <button
            type="button"
            className={`calc-mode-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <Sigma size={14} />
            <span>Statistical Inference (Z, CI)</span>
          </button>

          <button
            type="button"
            className={`calc-mode-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={14} />
            <span>Audit History Tape ({calcHistory.length})</span>
          </button>
        </div>

        {/* TOAST NOTIFICATION */}
        {copiedNotification && (
          <div className="calc-toast-banner">
            <Check size={13} className="text-emerald-400" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* TAB BODY CONTENT */}
        <div className="calc-modal-body-scroll">
          {/* 1. STANDARD & SCIENTIFIC KEYPAD MODE */}
          {activeTab === 'standard' && (
            <div className="calc-standard-grid-layout">
              {/* DISPLAY SCREEN */}
              <div className="calc-screen-wrapper">
                <div className="calc-screen-top-meta">
                  <div className="calc-format-pills">
                    <button
                      type="button"
                      className={`calc-fmt-btn ${displayFormat === 'standard' ? 'active' : ''}`}
                      onClick={() => setDisplayFormat('standard')}
                    >
                      123.45
                    </button>
                    <button
                      type="button"
                      className={`calc-fmt-btn ${displayFormat === 'currency' ? 'active' : ''}`}
                      onClick={() => setDisplayFormat('currency')}
                    >
                      {currencySymbol} Currency
                    </button>
                    <button
                      type="button"
                      className={`calc-fmt-btn ${displayFormat === 'percent' ? 'active' : ''}`}
                      onClick={() => setDisplayFormat('percent')}
                    >
                      % Percent
                    </button>
                    <button
                      type="button"
                      className={`calc-fmt-btn ${displayFormat === 'scientific' ? 'active' : ''}`}
                      onClick={() => setDisplayFormat('scientific')}
                    >
                      1.2e+4
                    </button>
                  </div>

                  <div className="calc-screen-actions">
                    {isMemoryActive && (
                      <span className="calc-memory-indicator" title={`Memory Stored: ${memoryVal}`}>
                        M: {memoryVal.toLocaleString()}
                      </span>
                    )}
                    <button
                      type="button"
                      className="calc-screen-action-btn"
                      onClick={() => handleCopyResult()}
                      title="Copy result to clipboard"
                    >
                      <Copy size={13} /> Copy Result
                    </button>
                  </div>
                </div>

                <div className="calc-expression-line">
                  <input
                    type="text"
                    className="calc-expression-input"
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                    placeholder="Enter formula or type calculation (e.g. 96750 * 1.15 + 5000)..."
                    spellCheck="false"
                  />
                </div>

                <div className="calc-result-line">
                  {livePreview !== null && livePreview !== calcResult && (
                    <span className="calc-live-preview-tag" title="Real-Time Calculated Preview">
                      ≈ {formatDisplayValue(livePreview)}
                    </span>
                  )}
                  <span className="calc-main-result-val">
                    {formatDisplayValue(calcResult)}
                  </span>
                </div>
              </div>

              {/* INTERACTIVE KEYPAD */}
              <div className="calc-keypad-sections-wrapper">
                {/* Memory Bar */}
                <div className="calc-memory-bar">
                  <button type="button" className="calc-key mem" onClick={() => handleMemory('MC')}>MC</button>
                  <button type="button" className="calc-key mem" onClick={() => handleMemory('MR')}>MR</button>
                  <button type="button" className="calc-key mem" onClick={() => handleMemory('M+')}>M+</button>
                  <button type="button" className="calc-key mem" onClick={() => handleMemory('M-')}>M-</button>
                  <button type="button" className="calc-key mem" onClick={() => handleMemory('MS')}>MS</button>
                  <button type="button" className="calc-key action del" onClick={handleBackspace} title="Backspace (Del)">DEL</button>
                  <button type="button" className="calc-key action ac" onClick={handleClear} title="Clear All (Esc)">AC</button>
                </div>

                <div className="calc-keypad-dual-grid">
                  {/* Scientific Functions Grid */}
                  <div className="calc-scientific-grid">
                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('sqrt')} title="Square Root">√x</button>
                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('sqr')} title="Square (x²)">x²</button>
                    <button type="button" className="calc-key fn" onClick={() => appendToken('^')} title="Power (x^y)">xʸ</button>
                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('inv')} title="Reciprocal (1/x)">1/x</button>

                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('sin')} title="Sine (degrees)">sin</button>
                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('cos')} title="Cosine (degrees)">cos</button>
                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('tan')} title="Tangent (degrees)">tan</button>
                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('cube')} title="Cube (x³)">x³</button>

                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('ln')} title="Natural Log (ln)">ln</button>
                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('log10')} title="Base-10 Log">log</button>
                    <button type="button" className="calc-key fn" onClick={() => appendToken('π')} title="Pi Constant (3.14159)">π</button>
                    <button type="button" className="calc-key fn" onClick={() => appendToken('e')} title="Euler's Constant (2.71828)">e</button>

                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('abs')} title="Absolute Value |x|">|x|</button>
                    <button type="button" className="calc-key fn" onClick={() => handleUnaryOp('fact')} title="Factorial (n!)">n!</button>
                    <button type="button" className="calc-key fn" onClick={() => appendToken('(')}>(</button>
                    <button type="button" className="calc-key fn" onClick={() => appendToken(')')}>)</button>
                  </div>

                  {/* Primary Numpad & Basic Operations */}
                  <div className="calc-numpad-grid">
                    <button type="button" className="calc-key num" onClick={() => appendToken('7')}>7</button>
                    <button type="button" className="calc-key num" onClick={() => appendToken('8')}>8</button>
                    <button type="button" className="calc-key num" onClick={() => appendToken('9')}>9</button>
                    <button type="button" className="calc-key op divide" onClick={() => appendToken(' / ')}>÷</button>

                    <button type="button" className="calc-key num" onClick={() => appendToken('4')}>4</button>
                    <button type="button" className="calc-key num" onClick={() => appendToken('5')}>5</button>
                    <button type="button" className="calc-key num" onClick={() => appendToken('6')}>6</button>
                    <button type="button" className="calc-key op multiply" onClick={() => appendToken(' * ')}>×</button>

                    <button type="button" className="calc-key num" onClick={() => appendToken('1')}>1</button>
                    <button type="button" className="calc-key num" onClick={() => appendToken('2')}>2</button>
                    <button type="button" className="calc-key num" onClick={() => appendToken('3')}>3</button>
                    <button type="button" className="calc-key op minus" onClick={() => appendToken(' - ')}>−</button>

                    <button type="button" className="calc-key num" onClick={() => appendToken('0')}>0</button>
                    <button type="button" className="calc-key num" onClick={() => appendToken('.')}>.</button>
                    <button type="button" className="calc-key op sign" onClick={() => handleUnaryOp('neg')}>±</button>
                    <button type="button" className="calc-key op plus" onClick={() => appendToken(' + ')}>+</button>

                    <button type="button" className="calc-key op percent-op" onClick={() => appendToken('%')}>%</button>
                    <button type="button" className="calc-key equals" onClick={handleCalculate}>=</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. WORKFORCE & ENTERPRISE SALARY SUITE MODE */}
          {activeTab === 'workforce' && (
            <div className="calc-workforce-container">
              {/* TOOL 1: SALARY HIKE & REVISION SIMULATOR */}
              <div className="calc-tool-card">
                <div className="tool-card-header">
                  <div className="tool-title-wrap">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <h4>Salary Hike, Revision & Bonus Estimator</h4>
                  </div>
                  <span className="tool-badge-pill">Annual / Monthly CTC</span>
                </div>

                <div className="tool-card-body-grid">
                  <div className="tool-inputs-col">
                    <div className="tool-input-group">
                      <div className="tool-input-label-row">
                        <label>Current Annual Base Salary ({currencySymbol}):</label>
                        <button
                          type="button"
                          className="tool-quick-fill-btn"
                          onClick={() => setHikeBaseSalary(liveMedian)}
                        >
                          Use Median ({currencySymbol}{liveMedian.toLocaleString()})
                        </button>
                      </div>
                      <input
                        type="number"
                        className="tool-num-input"
                        value={hikeBaseSalary}
                        onChange={(e) => setHikeBaseSalary(Number(e.target.value))}
                      />
                    </div>

                    <div className="tool-input-group">
                      <div className="tool-input-label-row">
                        <label>Hike / Increment Percentage (%):</label>
                        <span className="tool-val-highlight text-emerald-400">{hikePercentage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        step="0.5"
                        value={hikePercentage}
                        onChange={(e) => setHikePercentage(Number(e.target.value))}
                        className="tool-slider"
                      />
                      <div className="tool-quick-pills-row">
                        {[5, 8, 10, 12.5, 15, 20, 25].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            className={`tool-pill-btn ${hikePercentage === pct ? 'active' : ''}`}
                            onClick={() => setHikePercentage(pct)}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tool-input-group">
                      <label>Annual Variable Bonus (% of Base):</label>
                      <input
                        type="number"
                        className="tool-num-input"
                        value={hikeBonusPercent}
                        onChange={(e) => setHikeBonusPercent(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="tool-outputs-col">
                    <div className="tool-kpi-highlight-box emerald">
                      <span className="kpi-label">NEW ANNUAL BASE SALARY</span>
                      <span className="kpi-huge-val">{currencySymbol}{hikeCalculations.newAnnualBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="kpi-sub-line text-emerald-400">
                        + {currencySymbol}{hikeCalculations.hikeAmountAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })} (+{hikePercentage}%) Increase
                      </span>
                    </div>

                    <div className="tool-mini-stats-grid">
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">New Monthly Pay</span>
                        <span className="tile-val">{currencySymbol}{hikeCalculations.newMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Monthly Hike In-Hand</span>
                        <span className="tile-val text-emerald-400">+{currencySymbol}{hikeCalculations.monthlyHike.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Annual Bonus Projected</span>
                        <span className="tile-val text-purple-400">{currencySymbol}{hikeCalculations.bonusAmountAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Total Comprehensive CTC</span>
                        <span className="tile-val text-blue-400">{currencySymbol}{hikeCalculations.totalNewCTC.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="tool-apply-calc-btn"
                      onClick={() => {
                        setExpression(String(hikeCalculations.newAnnualBase));
                        setCalcResult(hikeCalculations.newAnnualBase);
                        setActiveTab('standard');
                      }}
                    >
                      <ArrowRight size={13} /> Load New Salary into Keypad Formula
                    </button>
                  </div>
                </div>
              </div>

              {/* TOOL 2: OVERTIME & HOURLY RATE CALCULATOR */}
              <div className="calc-tool-card">
                <div className="tool-card-header">
                  <div className="tool-title-wrap">
                    <Clock size={16} className="text-cyan-400" />
                    <h4>Overtime, Hourly Rate & Shift Converter</h4>
                  </div>
                  <span className="tool-badge-pill">FLSA / 1.5x Overtime</span>
                </div>

                <div className="tool-card-body-grid">
                  <div className="tool-inputs-col">
                    <div className="tool-input-group">
                      <label>Annual Salary Equivalent ({currencySymbol}):</label>
                      <input
                        type="number"
                        className="tool-num-input"
                        value={otAnnualSalary}
                        onChange={(e) => setOtAnnualSalary(Number(e.target.value))}
                      />
                    </div>

                    <div className="tool-input-row-dual">
                      <div className="tool-input-group">
                        <label>Weekly Base Hours:</label>
                        <input
                          type="number"
                          className="tool-num-input"
                          value={otWeeklyHours}
                          onChange={(e) => setOtWeeklyHours(Number(e.target.value))}
                        />
                      </div>
                      <div className="tool-input-group">
                        <label>Weekly OT Hours:</label>
                        <input
                          type="number"
                          className="tool-num-input"
                          value={otExtraHoursPerWeek}
                          onChange={(e) => setOtExtraHoursPerWeek(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="tool-input-group">
                      <label>OT Multiplier Rate:</label>
                      <div className="tool-quick-pills-row">
                        {[1.25, 1.5, 1.75, 2.0].map(m => (
                          <button
                            key={m}
                            type="button"
                            className={`tool-pill-btn ${otMultiplier === m ? 'active' : ''}`}
                            onClick={() => setOtMultiplier(m)}
                          >
                            {m}x Rate
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="tool-outputs-col">
                    <div className="tool-kpi-highlight-box cyan">
                      <span className="kpi-label">STANDARD HOURLY RATE</span>
                      <span className="kpi-huge-val">{currencySymbol}{otCalculations.hourlyBase.toFixed(2)}/hr</span>
                      <span className="kpi-sub-line text-cyan-400">
                        Overtime Rate: {currencySymbol}{otCalculations.hourlyOT.toFixed(2)}/hr ({otMultiplier}x)
                      </span>
                    </div>

                    <div className="tool-mini-stats-grid">
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Weekly Total with OT</span>
                        <span className="tile-val">{currencySymbol}{otCalculations.weeklyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}/wk</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Monthly Projected Pay</span>
                        <span className="tile-val text-cyan-400">{currencySymbol}{otCalculations.monthlyProjected.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Annual OT Premium</span>
                        <span className="tile-val text-emerald-400">+{currencySymbol}{otCalculations.extraAnnualEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Total Annual Earnings</span>
                        <span className="tile-val text-blue-400">{currencySymbol}{otCalculations.annualProjected.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOOL 3: PAYROLL & NET TAKE-HOME PAY ESTIMATOR */}
              <div className="calc-tool-card">
                <div className="tool-card-header">
                  <div className="tool-title-wrap">
                    <DollarSign size={16} className="text-purple-400" />
                    <h4>Payroll, Tax Deductions & Net In-Hand Estimator</h4>
                  </div>
                  <span className="tool-badge-pill">Tax & Deductions</span>
                </div>

                <div className="tool-card-body-grid">
                  <div className="tool-inputs-col">
                    <div className="tool-input-group">
                      <label>Gross Annual CTC ({currencySymbol}):</label>
                      <input
                        type="number"
                        className="tool-num-input"
                        value={payrollGross}
                        onChange={(e) => setPayrollGross(Number(e.target.value))}
                      />
                    </div>

                    <div className="tool-input-row-dual">
                      <div className="tool-input-group">
                        <label>Effective Tax Rate (%):</label>
                        <input
                          type="number"
                          className="tool-num-input"
                          value={payrollTaxBracket}
                          onChange={(e) => setPayrollTaxBracket(Number(e.target.value))}
                        />
                      </div>
                      <div className="tool-input-group">
                        <label>PF / 401(k) Contribution (%):</label>
                        <input
                          type="number"
                          className="tool-num-input"
                          value={payrollProvidentFund}
                          onChange={(e) => setPayrollProvidentFund(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="tool-outputs-col">
                    <div className="tool-kpi-highlight-box purple">
                      <span className="kpi-label">ESTIMATED NET TAKE-HOME PAY</span>
                      <span className="kpi-huge-val">{currencySymbol}{payrollCalculations.netAnnual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="kpi-sub-line text-purple-400">
                        {currencySymbol}{payrollCalculations.netMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })} / Month ({payrollCalculations.takeHomePercentage}% of Gross)
                      </span>
                    </div>

                    <div className="tool-mini-stats-grid">
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Annual Tax Withholding</span>
                        <span className="tile-val text-rose-400">-{currencySymbol}{payrollCalculations.taxAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">PF / Retirement Fund</span>
                        <span className="tile-val text-amber-400">+{currencySymbol}{payrollCalculations.pfAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Total Annual Deductions</span>
                        <span className="tile-val text-rose-400">-{currencySymbol}{payrollCalculations.totalDeductions.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Monthly Deductions</span>
                        <span className="tile-val text-rose-400">-{currencySymbol}{payrollCalculations.deductionsMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOOL 4: CAGR & REVENUE COMPOUND GROWTH */}
              <div className="calc-tool-card">
                <div className="tool-card-header">
                  <div className="tool-title-wrap">
                    <Percent size={16} className="text-blue-400" />
                    <h4>Compound Annual Growth Rate (CAGR)</h4>
                  </div>
                  <span className="tool-badge-pill">Growth Profiling</span>
                </div>

                <div className="tool-card-body-grid">
                  <div className="tool-inputs-col">
                    <div className="tool-input-row-dual">
                      <div className="tool-input-group">
                        <label>Initial Period Value ({currencySymbol}):</label>
                        <input
                          type="number"
                          className="tool-num-input"
                          value={cagrStartVal}
                          onChange={(e) => setCagrStartVal(Number(e.target.value))}
                        />
                      </div>
                      <div className="tool-input-group">
                        <label>Final Period Value ({currencySymbol}):</label>
                        <input
                          type="number"
                          className="tool-num-input"
                          value={cagrEndVal}
                          onChange={(e) => setCagrEndVal(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="tool-input-group">
                      <label>Number of Years / Periods (N):</label>
                      <input
                        type="number"
                        className="tool-num-input"
                        value={cagrYears}
                        onChange={(e) => setCagrYears(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="tool-outputs-col">
                    <div className="tool-kpi-highlight-box blue">
                      <span className="kpi-label">COMPOUND ANNUAL GROWTH RATE</span>
                      <span className="kpi-huge-val">{cagrCalculations.cagr}%</span>
                      <span className="kpi-sub-line text-blue-400">
                        Total {cagrCalculations.totalGrowth}% Growth (+{currencySymbol}{cagrCalculations.absoluteChange.toLocaleString()}) over {cagrYears} Years
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. STATISTICAL INFERENCE & CONFIDENCE ENGINE */}
          {activeTab === 'stats' && (
            <div className="calc-stats-suite-container">
              {/* SECTION 1: Z-SCORE & OUTLIER DETECTOR */}
              <div className="calc-tool-card">
                <div className="tool-card-header">
                  <div className="tool-title-wrap">
                    <Activity size={16} className="text-purple-400" />
                    <h4>Z-Score & Outlier Position Against Active Dataset</h4>
                  </div>
                  <span className="tool-badge-pill">Gaussian Normal Distribution</span>
                </div>

                <div className="tool-card-body-grid">
                  <div className="tool-inputs-col">
                    <div className="tool-input-group">
                      <div className="tool-input-label-row">
                        <label>Observation Value (X) to Evaluate:</label>
                        <button
                          type="button"
                          className="tool-quick-fill-btn"
                          onClick={() => setZScoreValue(liveMedian)}
                        >
                          Use Median ({liveMedian.toLocaleString()})
                        </button>
                      </div>
                      <input
                        type="number"
                        className="tool-num-input"
                        value={zScoreValue}
                        onChange={(e) => setZScoreValue(Number(e.target.value))}
                      />
                    </div>

                    <div className="calc-stats-reference-box">
                      <span className="ref-title">Live Dataset Distribution Parameters:</span>
                      <div className="ref-grid">
                        <div className="ref-item"><span>Population Mean (μ):</span> <strong>{liveMean.toLocaleString(undefined, { maximumFractionDigits: 1 })}</strong></div>
                        <div className="ref-item"><span>Standard Dev (σ):</span> <strong>{liveStdDev.toLocaleString(undefined, { maximumFractionDigits: 1 })}</strong></div>
                        <div className="ref-item"><span>Sample Size (N):</span> <strong>{totalRows.toLocaleString()}</strong></div>
                        <div className="ref-item"><span>Interquartile (IQR):</span> <strong>{liveIQR.toLocaleString()}</strong></div>
                      </div>
                    </div>
                  </div>

                  <div className="tool-outputs-col">
                    <div className={`tool-kpi-highlight-box ${statsCalculations.outlierColor}`}>
                      <span className="kpi-label">STANDARDIZED Z-SCORE</span>
                      <span className="kpi-huge-val">{statsCalculations.z >= 0 ? `+${statsCalculations.z}` : statsCalculations.z}σ</span>
                      <span className="kpi-sub-line">
                        {statsCalculations.outlierStatus} (Percentile Rank: {statsCalculations.percentile}%)
                      </span>
                    </div>

                    <div className="calc-formula-display-card">
                      <code>Z = (X - μ) / σ = ({zScoreValue} - {liveMean.toFixed(1)}) / {liveStdDev.toFixed(1)} = {statsCalculations.z}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONFIDENCE INTERVAL EVALUATOR */}
              <div className="calc-tool-card">
                <div className="tool-card-header">
                  <div className="tool-title-wrap">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <h4>Confidence Interval & Margin of Error</h4>
                  </div>
                  <span className="tool-badge-pill">Statistical Significance</span>
                </div>

                <div className="tool-card-body-grid">
                  <div className="tool-inputs-col">
                    <div className="tool-input-group">
                      <label>Confidence Level (1 - α):</label>
                      <div className="tool-quick-pills-row">
                        {[0.90, 0.95, 0.99].map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            className={`tool-pill-btn ${ciConfidenceLevel === lvl ? 'active' : ''}`}
                            onClick={() => setCiConfidenceLevel(lvl)}
                          >
                            {(lvl * 100)}% Confidence
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="tool-explainer-text">
                      Computes the true population mean boundaries with {(ciConfidenceLevel * 100)}% confidence using Standard Error <code>SE = σ / √N</code>.
                    </p>
                  </div>

                  <div className="tool-outputs-col">
                    <div className="tool-kpi-highlight-box emerald">
                      <span className="kpi-label">{(ciConfidenceLevel * 100)}% CONFIDENCE INTERVAL BOUNDS</span>
                      <span className="kpi-huge-val">
                        [{currencySymbol}{Number(statsCalculations.ciLower).toLocaleString()} — {currencySymbol}{Number(statsCalculations.ciUpper).toLocaleString()}]
                      </span>
                      <span className="kpi-sub-line text-emerald-400">
                        Mean: {currencySymbol}{liveMean.toLocaleString(undefined, { maximumFractionDigits: 1 })} ± {currencySymbol}{Number(statsCalculations.marginOfError).toLocaleString()} Margin of Error
                      </span>
                    </div>

                    <div className="tool-mini-stats-grid">
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Margin of Error (E)</span>
                        <span className="tile-val">±{currencySymbol}{Number(statsCalculations.marginOfError).toLocaleString()}</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Critical Z-Value (Z*)</span>
                        <span className="tile-val">{statsCalculations.zCrit}</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Coefficient of Variation (CV)</span>
                        <span className="tile-val text-cyan-400">{statsCalculations.cv}%</span>
                      </div>
                      <div className="tool-stat-tile">
                        <span className="tile-lbl">Population Variance (σ²)</span>
                        <span className="tile-val">{Math.round(Math.pow(liveStdDev, 2)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. AUDIT HISTORY TAPE */}
          {activeTab === 'history' && (
            <div className="calc-history-container">
              <div className="calc-history-header-actions">
                <span className="history-count-tag">{calcHistory.length} Recorded Calculations</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {calcHistory.length > 0 && (
                    <button
                      type="button"
                      className="history-action-btn danger"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                    >
                      <Trash2 size={12} /> Clear Tape
                    </button>
                  )}
                </div>
              </div>

              {calcHistory.length === 0 ? (
                <div className="calc-history-empty">
                  <Calculator size={32} className="text-slate-500 mb-2" />
                  <p>No recorded calculations yet in this session.</p>
                  <span>Calculations evaluated on the keypad or formula tools will appear here in real time.</span>
                </div>
              ) : (
                <div className="calc-history-list-scroll">
                  {calcHistory.map((item) => (
                    <div
                      key={item.id}
                      className="calc-history-item-row"
                      onClick={() => {
                        setExpression(item.expression);
                        setCalcResult(item.result);
                        setActiveTab('standard');
                      }}
                      title="Click to reload this formula into keypad"
                    >
                      <div className="history-row-left">
                        <span className="history-time">{item.timestamp}</span>
                        <span className="history-expr">{item.expression}</span>
                      </div>
                      <div className="history-row-right">
                        <span className="history-equals">=</span>
                        <span className="history-result">{typeof item.result === 'number' ? item.result.toLocaleString() : item.result}</span>
                        <button
                          type="button"
                          className="history-copy-mini-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyResult(item.result);
                          }}
                          title="Copy result"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="calc-modal-footer">
          <div className="calc-footer-left">
            <span className="calc-shortcut-tip">
              💡 <strong>Keyboard Shortcuts:</strong> Type numbers <code>0-9</code>, operators <code>+ - * / ^ % ( )</code>, <code>Enter</code> to calculate, <code>Backspace</code> to delete, <code>Esc</code> to clear.
            </span>
          </div>
          <div className="calc-footer-right">
            <button
              type="button"
              className="btn btn-secondary calc-footer-close-btn"
              onClick={() => {
                setIsFullScreen(false);
                onClose();
              }}
            >
              Done & Close
            </button>
          </div>
        </div>
      </div>

      {/* 🗑️ UNIQUE GLASSMORPHIC DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          const count = calcHistory.length;
          setCalcHistory([]);
          try { localStorage.removeItem('realtime_calc_history'); } catch {}
          if (onDeleteSuccess) {
            onDeleteSuccess({
              mode: 'delete',
              name: 'Calculation Tape Memory',
              deletedCount: count,
              storagePath: 'localStorage: realtime_calc_history',
              badge: '🗑️ CALCULATION TAPE CLEARED',
              desc: `All ${count} recorded calculations and formula history were successfully erased.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
          setIsDeleteConfirmOpen(false);
        }}
        title="Clear Calculation Tape History?"
        subtitle="Permanent Memory Clear"
        itemName={`All ${calcHistory.length} Calculation Records`}
        itemType="calculator"
        targetCount={calcHistory.length}
        storagePath="Session Calculation Tape"
        warningMessage="Are you sure you want to clear all recorded calculations? This will reset the tape history."
        confirmButtonText="Clear All Calculations"
      />
    </div>,
    document.body
  );
}
