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
    chunkSize: 1024 * 1024 * 4, // 4MB chunks
    step: function (results, parser) {
      if (results.data) {
        if (headers.length === 0 && results.meta && results.meta.fields) {
          headers = results.meta.fields;
        }
        masterData.push(results.data);
        rowCount++;

        if (rowCount % 25000 === 0) {
          self.postMessage({
            type: 'PROGRESS',
            rowCount,
            bytesProcessed: parser.streamer ? parser.streamer._start : 0,
            fileSize
          });
        }
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

      // 3. Health Score
      let totalCells = masterData.length * headers.length;
      let missingCells = 0;
      headers.forEach(h => {
        if (stats[h]) missingCells += stats[h].missingCount || 0;
      });
      healthScore = totalCells > 0 ? Math.max(0, Math.round(100 - (missingCells / totalCells) * 100)) : 100;

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
          numSample.push(num);
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

        stats[header] = {
          type: 'numeric',
          count,
          missingCount: Math.min(missingCount, data.length),
          min: Number(min.toFixed(2)),
          max: Number(max.toFixed(2)),
          mean: Number(mean.toFixed(2)),
          median: Number(median.toFixed(2)),
          stdDev: Number(stdDev.toFixed(2))
        };
      } else {
        stats[header] = { type: 'numeric', count: 0, missingCount: data.length, min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
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

