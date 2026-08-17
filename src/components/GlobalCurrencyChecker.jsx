import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ArrowRightLeft, Search, RefreshCw, AlertTriangle, ChevronDown, Check, Clock, Maximize2, Minimize2, X } from 'lucide-react';
import { WORLD_CURRENCIES, getCurrencyByCode, searchCurrencies } from '../utils/currencyData';

export default function GlobalCurrencyChecker({ onCurrencyChange }) {
  // Primary selected country/currency
  const [selectedCountry, setSelectedCountry] = useState(WORLD_CURRENCIES[0]); // Default India (INR)
  const [fromCurrency, setFromCurrency] = useState(WORLD_CURRENCIES[0]); // INR
  const [toCurrency, setToCurrency] = useState(WORLD_CURRENCIES[1]); // USD
  const [amount, setAmount] = useState('100');

  // Rates & API State
  const [rates, setRates] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Zoom In / Zoom Out Modal State
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      setIsFullScreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = (forceState) => {
    const nextState = typeof forceState === 'boolean' ? forceState : !isFullScreen;
    setIsFullScreen(nextState);

    try {
      if (nextState) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen().catch(() => {});
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen().catch(() => {});
      } else {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
          else if (document.msExitFullscreen) document.msExitFullscreen().catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Fullscreen request:', err.message);
    }
  };

  const handleOpenZoom = () => {
    setIsZoomedIn(true);
    setIsFullScreen(false);
  };

  const handleCloseZoom = () => {
    setIsZoomedIn(false);
    setIsFullScreen(false);
  };

  // Searchable Country Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // Fetch Exchange Rates when fromCurrency changes
  const fetchExchangeRates = async (baseCode = fromCurrency.code) => {
    setIsLoading(true);
    setError(null);

    const apiUrls = [
      `https://open.er-api.com/v6/latest/${baseCode}`,
      `https://api.exchangerate-api.com/v4/latest/${baseCode}`,
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseCode.toLowerCase()}.json`
    ];

    let fetchedSuccess = false;

    for (const url of apiUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;

        const data = await response.json();
        let extractedRates = null;
        let updateTime = new Date();

        if (data.rates) {
          extractedRates = data.rates;
          if (data.time_last_update_utc) {
            updateTime = new Date(data.time_last_update_utc);
          }
        } else if (data[baseCode.toLowerCase()]) {
          extractedRates = data[baseCode.toLowerCase()];
        }

        if (extractedRates && Object.keys(extractedRates).length > 0) {
          setRates(extractedRates);
          setLastUpdated(updateTime);
          fetchedSuccess = true;
          break;
        }
      } catch (err) {
        console.warn(`Failed fetching exchange rate from ${url}:`, err);
      }
    }

    if (!fetchedSuccess) {
      setError('Exchange rate offline');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchExchangeRates(fromCurrency.code);
  }, [fromCurrency.code]);

  const onCurrencyChangeRef = useRef(onCurrencyChange);
  useEffect(() => {
    onCurrencyChangeRef.current = onCurrencyChange;
  }, [onCurrencyChange]);

  useEffect(() => {
    if (onCurrencyChangeRef.current) {
      onCurrencyChangeRef.current({
        selectedCountry,
        fromCurrency,
        toCurrency,
        rate: rates[toCurrency.code] || null,
        rates
      });
    }
  }, [selectedCountry, fromCurrency, toCurrency, rates]);

  // When user selects a Country from dropdown
  const handleSelectCountry = (countryObj) => {
    setSelectedCountry(countryObj);
    setFromCurrency(countryObj);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  // Swap From & To Currency
  const handleSwap = () => {
    const prevFrom = fromCurrency;
    const prevTo = toCurrency;
    setFromCurrency(prevTo);
    setToCurrency(prevFrom);
    setSelectedCountry(prevTo);
  };

  // Calculate Exchange Rate & Converted Value
  const rate = rates[toCurrency.code] !== undefined ? rates[toCurrency.code] : null;
  const numericAmount = parseFloat(amount) || 0;
  const convertedValue = rate !== null ? (numericAmount * rate) : null;

  const filteredCountries = searchCurrencies(searchQuery);

  const formattedLastUpdated = lastUpdated
    ? lastUpdated.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // Render Core Form Controls (reused in both compact card and zoomed-in modal)
  const renderFormControls = (isModal = false) => (
    <>
      {/* Select Country Searchable Dropdown */}
      <div className="country-select-wrapper" ref={dropdownRef}>
        <label className="currency-input-label">Select Country</label>
        <button
          type="button"
          className="country-dropdown-btn"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="country-dropdown-flag">{selectedCountry.flag}</span>
          <span className="country-dropdown-text">
            <strong>{selectedCountry.country}</strong> — {selectedCountry.code} ({selectedCountry.symbol})
          </span>
          <ChevronDown size={14} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="country-dropdown-menu">
            <div className="country-search-box">
              <Search size={13} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="country-search-input"
                placeholder="Search country or currency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="country-options-list">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c) => (
                  <div
                    key={c.code + c.country}
                    className={`country-option-item ${selectedCountry.code === c.code && selectedCountry.country === c.country ? 'selected' : ''}`}
                    onClick={() => handleSelectCountry(c)}
                  >
                    <span className="option-flag">{c.flag}</span>
                    <div className="option-details">
                      <span className="option-country">{c.country}</span>
                      <span className="option-currency">{c.name} ({c.symbol})</span>
                    </div>
                    <span className="option-code">{c.code}</span>
                    {selectedCountry.code === c.code && selectedCountry.country === c.country && (
                      <Check size={13} className="check-icon" />
                    )}
                  </div>
                ))
              ) : (
                <div className="no-countries-found">No match found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Amount & Currency Conversion Controls */}
      <div className={`currency-controls-grid ${isModal ? 'modal-grid' : ''}`}>
        <div className="currency-field-group amount-group">
          <label className="currency-input-label">Amount</label>
          <div className="input-with-symbol">
            <span className="currency-symbol-tag">{fromCurrency.symbol}</span>
            <input
              type="number"
              min="0"
              step="any"
              className="currency-number-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
          </div>
        </div>

        <div className="currency-field-group">
          <label className="currency-input-label">From</label>
          <select
            className="currency-select-input"
            value={fromCurrency.code}
            onChange={(e) => {
              const selected = getCurrencyByCode(e.target.value);
              setFromCurrency(selected);
              setSelectedCountry(selected);
            }}
          >
            {WORLD_CURRENCIES.map((c) => (
              <option key={'from-' + c.code} value={c.code}>
                {c.flag} {c.code} - {c.country}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="currency-swap-btn"
          onClick={handleSwap}
          title="Swap Currencies"
        >
          <ArrowRightLeft size={14} />
        </button>

        <div className="currency-field-group">
          <label className="currency-input-label">To</label>
          <select
            className="currency-select-input"
            value={toCurrency.code}
            onChange={(e) => setToCurrency(getCurrencyByCode(e.target.value))}
          >
            {WORLD_CURRENCIES.map((c) => (
              <option key={'to-' + c.code} value={c.code}>
                {c.flag} {c.code} - {c.country}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Conversion Result Display Box */}
      <div className="currency-result-section">
        {isLoading ? (
          <div className="currency-loading-state">
            <RefreshCw size={16} className="animate-spin text-emerald-400" />
            <span>Fetching live exchange rate...</span>
          </div>
        ) : error ? (
          <div className="currency-error-banner">
            <AlertTriangle size={14} />
            <span>{error}</span>
            <button
              type="button"
              className="retry-btn"
              onClick={() => fetchExchangeRates(fromCurrency.code)}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="currency-display-card">
            <div className="main-converted-output">
              <span className={`converted-value ${isModal ? 'large-val' : ''}`}>
                {toCurrency.symbol}
                {convertedValue !== null
                  ? convertedValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4
                    })
                  : '0.00'}
              </span>
              <span className="converted-code">{toCurrency.code}</span>
            </div>

            <div className="rate-details-row">
              <span className="rate-pair-info">
                Exchange Rate: <strong>1 {fromCurrency.code}</strong> ={' '}
                <strong>
                  {rate !== null
                    ? rate < 0.0001
                      ? rate.toExponential(4)
                      : rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                    : '—'}{' '}
                  {toCurrency.code}
                </strong>
              </span>

              {formattedLastUpdated && (
                <span className="last-updated-badge" title="Timestamp of latest update">
                  <Clock size={11} /> Updated: {formattedLastUpdated}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="currency-summary-footer">
        <span className="summary-pill">{selectedCountry.flag} {selectedCountry.country}</span>
        <span className="summary-separator">•</span>
        <span className="summary-pill">{selectedCountry.name}</span>
        <span className="summary-separator">•</span>
        <span className="summary-pill">{selectedCountry.code} ({selectedCountry.symbol})</span>
      </div>
    </>
  );

  return (
    <>
      {/* Standard Compact Card View */}
      <div className="kpi-card kpi-emerald kpi-currency-card kpi-standard-card">
        <div className="kpi-card-header">
          <div className="currency-title-badge">
            <span className="kpi-label">GLOBAL CURRENCY</span>
            <div className="live-pill">
              <span className="live-dot"></span> LIVE
            </div>
          </div>

          <div className="kpi-header-action-group">
            <button
              type="button"
              className="currency-zoom-btn"
              onClick={handleOpenZoom}
              title="Full Screen / Expand View"
            >
              <Maximize2 size={11} />
            </button>
            <div className="kpi-icon-box">
              <Globe size={13} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Compact Card Content - Unified Single Row Layout */}
        <div className="currency-compact-body">
          <div className="currency-mini-row">
            {/* Country Selector Button */}
            <div className="country-select-wrapper compact" ref={dropdownRef}>
              <button
                type="button"
                className="country-dropdown-btn compact"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title={`Selected: ${selectedCountry.country} (${selectedCountry.code})`}
              >
                <span className="country-dropdown-flag">{selectedCountry.flag}</span>
                <span className="country-dropdown-text">
                  {selectedCountry.code}
                </span>
                <ChevronDown size={10} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="country-dropdown-menu">
                  <div className="country-search-box">
                    <Search size={12} className="search-icon" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="country-search-input"
                      placeholder="Search country..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="country-options-list">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((c) => (
                        <div
                          key={c.code + c.country}
                          className={`country-option-item ${selectedCountry.code === c.code && selectedCountry.country === c.country ? 'selected' : ''}`}
                          onClick={() => handleSelectCountry(c)}
                        >
                          <span className="option-flag">{c.flag}</span>
                          <div className="option-details">
                            <span className="option-country">{c.country}</span>
                            <span className="option-currency">{c.name} ({c.symbol})</span>
                          </div>
                          <span className="option-code">{c.code}</span>
                          {selectedCountry.code === c.code && selectedCountry.country === c.country && (
                            <Check size={12} className="check-icon" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-countries-found">No match found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="currency-mini-amount-box">
              <span className="currency-mini-symbol">{fromCurrency.symbol}</span>
              <input
                type="number"
                min="0"
                step="any"
                className="currency-mini-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
              />
            </div>

            <button
              type="button"
              className="currency-mini-swap-btn"
              onClick={handleSwap}
              title="Swap Currencies"
            >
              <ArrowRightLeft size={10} />
            </button>

            <div className="currency-mini-output-box">
              <span className="currency-mini-output-val">
                {toCurrency.symbol}{convertedValue !== null ? convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </span>
              <span className="currency-mini-output-code">{toCurrency.code}</span>
            </div>
          </div>
        </div>

        {/* Footer Rate Info */}
        <div className="kpi-card-footer">
          <span className="kpi-subtext text-emerald" style={{ fontSize: '0.56rem' }}>
            <Clock size={10} /> 1 {fromCurrency.code} = {rate !== null ? (rate < 0.01 ? rate.toFixed(4) : rate.toFixed(2)) : '—'} {toCurrency.code}
          </span>
        </div>
      </div>

      {/* Zoomed-In Full Screen Overlay Modal (Portal to document.body) */}
      {isZoomedIn && createPortal(
        <div className={`currency-zoom-modal-overlay ${isFullScreen ? 'has-fullscreen is-fullscreen' : ''}`} onClick={handleCloseZoom}>
          <div className={`currency-zoom-modal-content ${isFullScreen ? 'is-fullscreen modal-fullscreen' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <img src="/logo.png" alt="Sathya Logo" className="modal-gold-logo" style={{ height: '26px', objectFit: 'contain' }} />
                <Globe size={20} className="text-emerald-400" />
                <h3 className="modal-title">Global Currency Intelligence & Converter</h3>
                <span className="live-pill">
                  <span className="live-dot"></span> LIVE EXCHANGE RATES
                </span>
              </div>

              {/* Modal Action Controls: Full Screen Toggle + Close */}
              <div className="modal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="currency-zoom-close-btn"
                  onClick={() => toggleFullScreen()}
                  title={isFullScreen ? "Exit Full Screen" : "Expand to Full Screen View"}
                >
                  {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  className="currency-zoom-close-btn"
                  onClick={handleCloseZoom}
                  title="Close View"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              {renderFormControls(true)}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
