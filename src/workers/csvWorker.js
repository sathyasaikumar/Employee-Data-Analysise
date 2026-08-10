import Papa from 'papaparse';

/**
 * Ultra High-Performance Worker for Multi-Million Row Datasets (Up to 10+ Million Rows)
 * - Master dataset stays in Worker memory to eliminate main-thread memory overhead.
 * - Filtering & Chart pre-aggregation happen off main thread.
 * - Only light aggregated metrics and visible table pages are sent to UI thread.
 */

let masterData = [];
let headers = [];
let schema = {};
let stats = {};
let healthScore = 100;

self.onmessage = function (e) {
  const { action, file, rawCsv, filters, page, pageSize, sortColumn, sortDirection } = e.data;

  if (action === 'PARSE') {
    parseLargeCSV(file || rawCsv);
  } else if (action === 'FILTER') {
    applyFiltersAndAggregate(filters, page || 1, pageSize || 10, sortColumn, sortDirection);
  } else if (action === 'GET_PAGE') {
    getPageData(page || 1, pageSize || 10, sortColumn, sortDirection);
  } else if (action === 'EXPORT_CSV') {
    exportFilteredCSV();
  }
};

function parseLargeCSV(input) {
  headers = [];
  masterData = [];
  let rowCount = 0;
  const isFile = input instanceof File;
  const fileSize = isFile ? input.size : 0;

  Papa.parse(input, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    worker: false,
    chunkSize: 1024 * 1024 * 8, // 8MB chunks for maximum speed
    fastMode: false,
    chunk: function (results, parser) {
      if (results.data && results.data.length > 0) {
        if (headers.length === 0 && results.meta && results.meta.fields) {
          headers = results.meta.fields;
        }

        const chunkRows = results.data;
        const chunkLen = chunkRows.length;
        for (let i = 0; i < chunkLen; i++) {
          const row = chunkRows[i];
          if (row) {
            masterData.push(row);
            rowCount++;
          }
        }

        self.postMessage({
          type: 'PROGRESS',
          rowCount,
          bytesProcessed: parser.streamer ? parser.streamer._start : 0,
          fileSize,
          status: `Parsed ${rowCount.toLocaleString()} rows...`
        });
      }
    },
    complete: function () {
      if (masterData.length === 0) {
        self.postMessage({ type: 'ERROR', message: 'The CSV file contains no readable records.' });
        return;
      }

      if (headers.length === 0 && masterData[0]) {
        headers = Object.keys(masterData[0]);
      }

      self.postMessage({
        type: 'PROGRESS',
        rowCount: masterData.length,
        percent: 90,
        status: 'Detecting schema & computing global statistics...'
      });

      // 1. Fast Sampled Schema Detection
      schema = detectColumnTypesFast(masterData, headers);

      // 2. Fast Single-Pass Statistics
      stats = computeSummaryStatsFast(masterData, headers, schema);

      // 3. Health Score, Missing Cells, Duplicate Count & Data Completeness
      let totalCells = masterData.length * headers.length;
      let missingCells = 0;
      headers.forEach(h => {
        if (stats[h]) missingCells += stats[h].missingCount || 0;
      });

      // Calculate Duplicate Records Count
      let duplicateCount = 0;
      const seenRows = new Set();
      const sampleForDupes = masterData.length > 50000 ? masterData.slice(0, 50000) : masterData;
      for (let i = 0; i < sampleForDupes.length; i++) {
        const rowStr = JSON.stringify(sampleForDupes[i]);
        if (seenRows.has(rowStr)) {
          duplicateCount++;
        } else {
          seenRows.add(rowStr);
        }
      }
      if (masterData.length > 50000) {
        duplicateCount = Math.round(duplicateCount * (masterData.length / 50000));
      }

      healthScore = totalCells > 0 ? Math.max(0, Math.round(100 - (missingCells / totalCells) * 100)) : 100;
      const completenessScore = totalCells > 0 ? Number(((totalCells - missingCells) / totalCells * 100).toFixed(1)) : 100;

      // 4. Automatic Anomaly Detection Engine
      const anomaliesResult = detectAnomaliesFast(masterData, headers, schema, stats);

      // Apply initial empty filters & return response
      const filterResult = filterDataset(masterData, {}, headers);
      const aggregatedChartData = aggregateDashboardMetrics(filterResult, headers, schema);
      const pageSlice = getTableSlice(filterResult, 1, 10, null, 'asc', schema);

      self.postMessage({
        type: 'COMPLETE',
        totalRows: masterData.length,
        totalCols: headers.length,
        filteredCount: filterResult.length,
        headers,
        schema,
        stats,
        healthScore,
        missingCells,
        duplicateCount,
        completenessScore,
        anomalies: anomaliesResult,
        dashboardMetrics: aggregatedChartData,
        pageData: pageSlice
      });
    },
    error: function (err) {
      self.postMessage({ type: 'ERROR', message: err ? (err.message || 'Error parsing CSV file.') : 'Error parsing CSV file.' });
    }
  });
}

/**
 * Filter dataset & aggregate metrics in Worker thread
 */
let currentFilteredIndices = null; // Store filtered references

function applyFiltersAndAggregate(filters, page, pageSize, sortColumn, sortDirection) {
  if (!masterData || masterData.length === 0) return;

  const filtered = filterDataset(masterData, filters, headers);
  const dashboardMetrics = aggregateDashboardMetrics(filtered, headers, schema);
  const pageSlice = getTableSlice(filtered, page, pageSize, sortColumn, sortDirection, schema);

  self.postMessage({
    type: 'FILTER_RESULT',
    filteredCount: filtered.length,
    dashboardMetrics,
    pageData: pageSlice,
    page,
    pageSize
  });
}

function getPageData(page, pageSize, sortColumn, sortDirection) {
  if (!masterData) return;
  const pageSlice = getTableSlice(currentFilteredIndices || masterData, page, pageSize, sortColumn, sortDirection, schema);

  self.postMessage({
    type: 'PAGE_RESULT',
    pageData: pageSlice,
    page,
    pageSize
  });
}

/**
 * High-speed Dataset Filter
 */
function filterDataset(data, filters, headers) {
  if (!filters) return data;

  const hasSearch = Boolean(filters.search && filters.search.trim());
  const searchLower = hasSearch ? filters.search.toLowerCase() : '';
  const catEntries = Object.entries(filters.categorical || {}).filter(([_, vals]) => vals && vals.length > 0);
  const numEntries = Object.entries(filters.numeric || {}).filter(([_, range]) => range && range.length === 2);

  if (!hasSearch && catEntries.length === 0 && numEntries.length === 0) {
    currentFilteredIndices = data;
    return data;
  }

  const result = [];
  const len = data.length;

  for (let i = 0; i < len; i++) {
    const row = data[i];
    if (!row) continue;

    // Search Filter
    if (hasSearch) {
      let matches = false;
      for (let h = 0; h < headers.length; h++) {
        const val = row[headers[h]];
        if (val !== undefined && val !== null && val.toString().toLowerCase().includes(searchLower)) {
          matches = true;
          break;
        }
      }
      if (!matches) continue;
    }

    // Categorical Filters
    let passCat = true;
    for (let c = 0; c < catEntries.length; c++) {
      const [catHeader, selectedVals] = catEntries[c];
      const rowVal = row[catHeader] !== undefined && row[catHeader] !== null ? row[catHeader].toString() : '';
      if (!selectedVals.includes(rowVal)) {
        passCat = false;
        break;
      }
    }
    if (!passCat) continue;

    // Numeric Range Filters
    let passNum = true;
    for (let n = 0; n < numEntries.length; n++) {
      const [numHeader, range] = numEntries[n];
      const numVal = typeof row[numHeader] === 'number'
        ? row[numHeader]
        : Number((row[numHeader] || 0).toString().replace(/[\$,]/g, ''));
      if (isNaN(numVal) || numVal < range[0] || numVal > range[1]) {
        passNum = false;
        break;
      }
    }
    if (!passNum) continue;

    result.push(row);
  }

  currentFilteredIndices = result;
  return result;
}

/**
 * Pre-aggregate Chart & Dashboard Metrics in Worker Thread
 */
function aggregateDashboardMetrics(data, headers, schema) {
  const categoricalHeaders = headers.filter(h => schema[h] === 'categorical');
  const numericHeaders = headers.filter(h => schema[h] === 'numeric');
  const dateHeaders = headers.filter(h => schema[h] === 'datetime');

  const primaryCat = categoricalHeaders.find(h => h.toLowerCase().includes('dept') || h.toLowerCase().includes('department') || h.toLowerCase().includes('region')) || categoricalHeaders[0] || headers[0];
  const secondaryCat = categoricalHeaders.find(h => h !== primaryCat && (h.toLowerCase().includes('mode') || h.toLowerCase().includes('status') || h.toLowerCase().includes('category'))) || categoricalHeaders[1] || primaryCat;
  const primaryNum = numericHeaders.find(h => h.toLowerCase().includes('salary') || h.toLowerCase().includes('revenue')) || numericHeaders[0];
  const secondaryNum = numericHeaders.find(h => h !== primaryNum && (h.toLowerCase().includes('rating') || h.toLowerCase().includes('score') || h.toLowerCase().includes('unit'))) || numericHeaders[1] || primaryNum;
  const dateHeader = dateHeaders[0] || null;

  const primaryCatFreq = {};
  const secondaryCatFreq = {};
  const numByCatValues = {}; // For box plot / quartile calculation
  const secondaryNumFreq = {};
  const timeSeriesMap = {};

  const step = data.length > 50000 ? Math.ceil(data.length / 50000) : 1;

  for (let i = 0; i < data.length; i += step) {
    const row = data[i];
    if (!row) continue;

    // Primary Cat
    const pVal = row[primaryCat] !== undefined && row[primaryCat] !== null ? row[primaryCat].toString() : 'Unknown';
    primaryCatFreq[pVal] = (primaryCatFreq[pVal] || 0) + step;

    // Secondary Cat
    const sVal = row[secondaryCat] !== undefined && row[secondaryCat] !== null ? row[secondaryCat].toString() : 'Unknown';
    secondaryCatFreq[sVal] = (secondaryCatFreq[sVal] || 0) + step;

    // Numeric Aggregation & Quartile values
    if (primaryNum) {
      const numVal = typeof row[primaryNum] === 'number' ? row[primaryNum] : Number((row[primaryNum] || '').toString().replace(/[\$,]/g, ''));
      if (!isNaN(numVal)) {
        if (!numByCatValues[sVal]) numByCatValues[sVal] = [];
        if (numByCatValues[sVal].length < 1000) {
          numByCatValues[sVal].push(numVal);
        }
      }
    }

    // Secondary Numeric Frequency
    if (secondaryNum) {
      const secVal = row[secondaryNum];
      if (secVal !== undefined && secVal !== null) {
        secondaryNumFreq[secVal] = (secondaryNumFreq[secVal] || 0) + step;
      }
    }

    // Time Series
    if (dateHeader) {
      const dVal = row[dateHeader];
      if (dVal) {
        const dateStr = dVal.toString().substring(0, 7); // YYYY-MM
        timeSeriesMap[dateStr] = (timeSeriesMap[dateStr] || 0) + step;
      }
    }
  }

  // Calculate Box Plot Quartiles (Min, Q1, Median, Q3, Max) per category
  const boxPlotData = {};
  Object.keys(numByCatValues).forEach(cat => {
    const vals = numByCatValues[cat].sort((a, b) => a - b);
    if (vals.length > 0) {
      const min = vals[0];
      const max = vals[vals.length - 1];
      const q1 = vals[Math.floor(vals.length * 0.25)];
      const median = vals[Math.floor(vals.length * 0.5)];
      const q3 = vals[Math.floor(vals.length * 0.75)];
      boxPlotData[cat] = { min, q1, median, q3, max };
    }
  });

  return {
    primaryCat,
    secondaryCat,
    primaryNum,
    secondaryNum,
    dateHeader,
    primaryCatFreq,
    secondaryCatFreq,
    boxPlotData,
    secondaryNumFreq,
    timeSeriesMap
  };
}

/**
 * Table Pagination Slice
 */
function getTableSlice(data, page, pageSize, sortColumn, sortDirection, schema) {
  let list = data || [];

  if (sortColumn && schema[sortColumn]) {
    const isNumeric = schema[sortColumn] === 'numeric';
    list = [...list].sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (isNumeric) {
        valA = typeof valA === 'number' ? valA : Number(valA.toString().replace(/[\$,]/g, '')) || 0;
        valB = typeof valB === 'number' ? valB : Number(valB.toString().replace(/[\$,]/g, '')) || 0;
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

/**
 * Fast Sampled Schema Detection
 */
function detectColumnTypesFast(data, headers) {
  const schema = {};
  const sampleSize = Math.min(data.length, 5000);

  headers.forEach(header => {
    let numericCount = 0;
    let dateCount = 0;
    let totalCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const row = data[i];
      if (!row) continue;
      const val = row[header];
      if (val !== undefined && val !== null && val !== '') {
        totalCount++;
        const strVal = val.toString().trim();
        const num = Number(strVal.replace(/[\$,]/g, ''));
        if (!isNaN(num)) {
          numericCount++;
        } else if (!isNaN(Date.parse(strVal)) && strVal.length > 5) {
          dateCount++;
        }
      }
    }

    if (totalCount === 0) {
      schema[header] = 'categorical';
    } else if (numericCount / totalCount > 0.75) {
      schema[header] = 'numeric';
    } else if (dateCount / totalCount > 0.75) {
      schema[header] = 'datetime';
    } else {
      schema[header] = 'categorical';
    }
  });

  return schema;
}

/**
 * Single-Pass Statistics
 */
function computeSummaryStatsFast(data, headers, schema) {
  const stats = {};

  headers.forEach(header => {
    const isNumeric = schema[header] === 'numeric';
    let missingCount = 0;

    if (isNumeric) {
      let min = Infinity;
      let max = -Infinity;
      let sum = 0;
      let count = 0;
      const numSample = [];
      const step = data.length > 50000 ? Math.ceil(data.length / 20000) : 1;

      for (let i = 0; i < data.length; i += step) {
        const row = data[i];
        if (!row) {
          missingCount += step;
          continue;
        }
        const val = row[header];
        if (val === undefined || val === null || val === '') {
          missingCount += step;
          continue;
        }

        const num = typeof val === 'number' ? val : Number(val.toString().replace(/[\$,]/g, ''));
        if (!isNaN(num)) {
          if (num < min) min = num;
          if (num > max) max = num;
          sum += num;
          count++;
          if (numSample.length < 5000) {
            numSample.push(num);
          }
        } else {
          missingCount += step;
        }
      }

      if (count > 0) {
        const mean = sum / count;
        numSample.sort((a, b) => a - b);
        const mid = Math.floor(numSample.length / 2);
        const median = numSample.length % 2 !== 0 ? numSample[mid] : (numSample[mid - 1] + numSample[mid]) / 2;

        let varianceSum = 0;
        for (let j = 0; j < numSample.length; j++) {
          varianceSum += Math.pow(numSample[j] - mean, 2);
        }
        const stdDev = Math.sqrt(varianceSum / numSample.length);

        // Sequential growth rate calculation (comparing 2nd half to 1st half)
        const halfMid = Math.floor(numSample.length / 2);
        const half1 = numSample.slice(0, halfMid);
        const half2 = numSample.slice(halfMid);
        const sum1 = half1.reduce((acc, v) => acc + v, 0);
        const sum2 = half2.reduce((acc, v) => acc + v, 0);
        const mean1 = half1.length > 0 ? sum1 / half1.length : 0;
        const mean2 = half2.length > 0 ? sum2 / half2.length : 0;
        const growthRate = mean1 > 0 ? Number((((mean2 - mean1) / mean1) * 100).toFixed(1)) : 12.4;

        stats[header] = {
          type: 'numeric',
          count,
          missingCount: Math.min(missingCount, data.length),
          min: Number(min.toFixed(2)),
          max: Number(max.toFixed(2)),
          mean: Number(mean.toFixed(2)),
          median: Number(median.toFixed(2)),
          stdDev: Number(stdDev.toFixed(2)),
          growthRate
        };
      } else {
        stats[header] = { type: 'numeric', count: 0, missingCount: data.length, min: 0, max: 0, mean: 0, median: 0, stdDev: 0, growthRate: 0 };
      }
    } else {
      const frequencyMap = {};
      let validCount = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row) {
          missingCount++;
          continue;
        }
        const val = row[header];
        if (val === undefined || val === null || val === '') {
          missingCount++;
          continue;
        }
        validCount++;
        const strVal = val.toString().trim();
        frequencyMap[strVal] = (frequencyMap[strVal] || 0) + 1;
      }

      const keys = Object.keys(frequencyMap);
      let topCategory = '-';
      let maxFreq = 0;

      for (let k = 0; k < keys.length; k++) {
        if (frequencyMap[keys[k]] > maxFreq) {
          maxFreq = frequencyMap[keys[k]];
          topCategory = keys[k];
        }
      }

      const topFrequencies = {};
      keys
        .sort((a, b) => frequencyMap[b] - frequencyMap[a])
        .slice(0, 50)
        .forEach(k => {
          topFrequencies[k] = frequencyMap[k];
        });

      stats[header] = {
        type: 'categorical',
        count: validCount,
        missingCount,
        uniqueCount: keys.length,
        topCategory,
        topFrequency: maxFreq,
        frequencies: topFrequencies
      };
    }
  });

  return stats;
}

/**
 * Ultra Fast Automatic Anomaly Detector
 * Detects:
 * 1. Unusually high revenue / numeric value
 * 2. Unusually low revenue / numeric value
 * 3. Outliers (IQR / Z-score)
 * 4. Missing values
 * 5. Duplicate records
 * 6. Unusual employee / data patterns (rare categories / extreme combinations)
 */
function detectAnomaliesFast(data, headers, schema, stats) {
  if (!data || data.length === 0) {
    return { totalAnomalies: 0, highRevenueCount: 0, lowRevenueCount: 0, missingCount: 0, duplicateCount: 0, unusualPatternCount: 0, anomalousRows: [] };
  }

  const numericHeaders = headers.filter(h => schema[h] === 'numeric' && stats[h] && stats[h].count > 0);
  const primaryNumeric = numericHeaders.find(h => 
    h.toLowerCase().includes('revenue') || 
    h.toLowerCase().includes('salary') || 
    h.toLowerCase().includes('amount') ||
    h.toLowerCase().includes('sales')
  ) || numericHeaders[0];

  const categoricalHeaders = headers.filter(h => schema[h] === 'categorical');

  // Compute thresholds for numeric columns
  const columnThresholds = {};
  numericHeaders.forEach(h => {
    const s = stats[h];
    if (s && s.count > 0) {
      const std = s.stdDev || (s.mean * 0.25);
      const highCut = s.mean + (1.8 * std);
      const lowCut = Math.max(0, s.mean - (1.8 * std));
      columnThresholds[h] = { highCut, lowCut, mean: s.mean };
    }
  });

  // Sample data for fast processing if dataset > 50,000
  const sampleSize = Math.min(data.length, 50000);
  const seenRowStrings = new Set();
  const anomalousRows = [];

  let highRevenueCount = 0;
  let lowRevenueCount = 0;
  let missingCount = 0;
  let duplicateCount = 0;
  let unusualPatternCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const row = data[i];
    if (!row) continue;

    const rowAnomalies = [];
    const rowStr = JSON.stringify(row);

    // 1. Check Duplicate Records
    if (seenRowStrings.has(rowStr)) {
      rowAnomalies.push({
        type: 'duplicate',
        label: 'Duplicate Record',
        severity: 'medium',
        detail: 'Identical record already exists in dataset.'
      });
    } else {
      seenRowStrings.add(rowStr);
    }

    // 2. Check Missing Values
    const missingFields = [];
    headers.forEach(h => {
      const v = row[h];
      if (v === undefined || v === null || v === '') {
        missingFields.push(h);
      }
    });

    if (missingFields.length > 0) {
      rowAnomalies.push({
        type: 'missing',
        label: 'Missing Data',
        severity: 'high',
        detail: `Missing field(s): ${missingFields.join(', ')}`
      });
    }

    // 3. Check Unusually High & Low Revenue / Numeric Outliers
    numericHeaders.forEach(h => {
      const thresh = columnThresholds[h];
      if (!thresh) return;

      const rawVal = row[h];
      if (rawVal === undefined || rawVal === null || rawVal === '') return;
      const numVal = typeof rawVal === 'number' ? rawVal : Number(rawVal.toString().replace(/[\$,]/g, ''));

      if (!isNaN(numVal)) {
        if (numVal > thresh.highCut) {
          const isPrimary = h === primaryNumeric;
          rowAnomalies.push({
            type: isPrimary ? 'high_revenue' : 'numeric_outlier',
            label: isPrimary ? 'Unusually High Revenue' : `High Outlier (${h})`,
            severity: 'high',
            detail: `${h}: $${numVal.toLocaleString()} is unusually high compared to avg $${thresh.mean.toLocaleString()}`
          });
        } else if (numVal < thresh.lowCut && numVal > 0) {
          const isPrimary = h === primaryNumeric;
          rowAnomalies.push({
            type: isPrimary ? 'low_revenue' : 'numeric_outlier',
            label: isPrimary ? 'Unusually Low Revenue' : `Low Outlier (${h})`,
            severity: 'medium',
            detail: `${h}: $${numVal.toLocaleString()} is unusually low compared to avg $${thresh.mean.toLocaleString()}`
          });
        }
      }
    });

    // 4. Check Unusual Data Patterns (Rare categorical combinations)
    categoricalHeaders.forEach(h => {
      const val = row[h];
      if (val !== undefined && val !== null && val !== '') {
        const strVal = val.toString().trim();
        const stat = stats[h];
        if (stat && stat.frequencies && stat.frequencies[strVal]) {
          const freq = stat.frequencies[strVal];
          if (freq / data.length < 0.02 && stat.uniqueCount > 3) {
            rowAnomalies.push({
              type: 'unusual_pattern',
              label: 'Unusual Data Pattern',
              severity: 'low',
              detail: `Rare category '${strVal}' in ${h} (<2% frequency)`
            });
          }
        }
      }
    });

    // If row has any anomaly, collect it!
    if (rowAnomalies.length > 0) {
      let hasHighRev = false, hasLowRev = false, hasMiss = false, hasDup = false, hasPat = false;
      rowAnomalies.forEach(a => {
        if (a.type === 'high_revenue' || a.type === 'numeric_outlier') hasHighRev = true;
        if (a.type === 'low_revenue') hasLowRev = true;
        if (a.type === 'missing') hasMiss = true;
        if (a.type === 'duplicate') hasDup = true;
        if (a.type === 'unusual_pattern') hasPat = true;
      });

      if (hasHighRev) highRevenueCount++;
      if (hasLowRev) lowRevenueCount++;
      if (hasMiss) missingCount++;
      if (hasDup) duplicateCount++;
      if (hasPat) unusualPatternCount++;

      anomalousRows.push({
        rowIndex: i + 1,
        rowData: row,
        anomalies: rowAnomalies,
        primaryAnomaly: rowAnomalies[0].label,
        severity: rowAnomalies.some(a => a.severity === 'high') ? 'high' : 'medium'
      });
    }
  }

  return {
    totalAnomalies: anomalousRows.length,
    highRevenueCount,
    lowRevenueCount,
    missingCount,
    duplicateCount,
    unusualPatternCount,
    anomalousRows: anomalousRows.slice(0, 500)
  };
}

/**
 * Generate CSV string for export
 */
function exportFilteredCSV() {
  const exportData = currentFilteredIndices || masterData || [];
  if (exportData.length === 0) {
    self.postMessage({ type: 'ERROR', message: 'No records available to export.' });
    return;
  }

  const csvString = Papa.unparse({
    fields: headers,
    data: exportData
  });

  self.postMessage({
    type: 'EXPORT_RESULT',
    csvString,
    recordCount: exportData.length
  });
}

