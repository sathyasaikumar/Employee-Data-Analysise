import Papa from 'papaparse';

/**
 * Detect column data type based on sample values
 */
export function detectColumnTypes(data, headers) {
  const schema = {};

  headers.forEach(header => {
    let numericCount = 0;
    let dateCount = 0;
    let totalCount = 0;
    const uniqueValues = new Set();

    data.forEach(row => {
      const val = row[header];
      if (val !== undefined && val !== null && val.toString().trim() !== '') {
        totalCount++;
        const strVal = val.toString().trim();
        uniqueValues.add(strVal);

        // Check if numeric
        const num = Number(strVal.replace(/[\$,]/g, ''));
        if (!isNaN(num)) {
          numericCount++;
        }

        // Check if date
        if (isNaN(num) && !isNaN(Date.parse(strVal)) && strVal.length > 5) {
          dateCount++;
        }
      }
    });

    if (totalCount === 0) {
      schema[header] = 'categorical';
    } else if (numericCount / totalCount > 0.8) {
      schema[header] = 'numeric';
    } else if (dateCount / totalCount > 0.8) {
      schema[header] = 'datetime';
    } else {
      schema[header] = 'categorical';
    }
  });

  return schema;
}

/**
 * Compute statistical summaries for numeric & categorical columns
 */
export function computeSummaryStats(data, headers, schema) {
  const stats = {};

  headers.forEach(header => {
    const type = schema[header];
    const values = data
      .map(row => row[header])
      .filter(val => val !== undefined && val !== null && val.toString().trim() !== '');
    
    const missingCount = data.length - values.length;

    if (type === 'numeric') {
      const numValues = values
        .map(v => Number(v.toString().replace(/[\$,]/g, '')))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

      if (numValues.length > 0) {
        const min = numValues[0];
        const max = numValues[numValues.length - 1];
        const sum = numValues.reduce((acc, curr) => acc + curr, 0);
        const mean = sum / numValues.length;

        // Median calculation
        const mid = Math.floor(numValues.length / 2);
        const median = numValues.length % 2 !== 0 
          ? numValues[mid] 
          : (numValues[mid - 1] + numValues[mid]) / 2;

        // Standard Deviation
        const variance = numValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numValues.length;
        const stdDev = Math.sqrt(variance);

        stats[header] = {
          type: 'numeric',
          count: numValues.length,
          missingCount,
          min,
          max,
          mean: Number(mean.toFixed(2)),
          median: Number(median.toFixed(2)),
          stdDev: Number(stdDev.toFixed(2))
        };
      }
    } else {
      const frequencyMap = {};
      values.forEach(v => {
        const valStr = v.toString().trim();
        frequencyMap[valStr] = (frequencyMap[valStr] || 0) + 1;
      });

      const uniqueCount = Object.keys(frequencyMap).length;
      let topCategory = '-';
      let maxFreq = 0;

      Object.entries(frequencyMap).forEach(([cat, count]) => {
        if (count > maxFreq) {
          maxFreq = count;
          topCategory = cat;
        }
      });

      stats[header] = {
        type: 'categorical',
        count: values.length,
        missingCount,
        uniqueCount,
        topCategory,
        topFrequency: maxFreq,
        frequencies: frequencyMap
      };
    }
  });

  return stats;
}

/**
 * Parse CSV File or Raw String
 */
export function parseCSV(input) {
  return new Promise((resolve, reject) => {
    Papa.parse(input, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          reject(new Error("The uploaded CSV file contains no readable data."));
          return;
        }

        const headers = results.meta.fields || Object.keys(results.data[0]);
        const schema = detectColumnTypes(results.data, headers);
        const stats = computeSummaryStats(results.data, headers, schema);

        // Compute overall data health score (100% minus percentage of missing values)
        let totalCells = results.data.length * headers.length;
        let missingCells = 0;
        results.data.forEach(row => {
          headers.forEach(h => {
            if (row[h] === undefined || row[h] === null || row[h] === '') {
              missingCells++;
            }
          });
        });

        const healthScore = totalCells > 0 
          ? Math.max(0, Math.round(100 - (missingCells / totalCells) * 100))
          : 100;

        resolve({
          data: results.data,
          headers,
          schema,
          stats,
          healthScore,
          totalRows: results.data.length,
          totalCols: headers.length,
          missingCells
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
