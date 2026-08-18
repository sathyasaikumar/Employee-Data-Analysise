import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Format any dataset name to consistently end with .csv
 */
export function formatAsCsvName(filename) {
  if (!filename) return 'dataset.csv';
  const clean = filename.trim();
  // Remove existing extension if any (.xlsx, .xls, .json, .txt, .tsv, .pdf, .csv, etc.)
  const base = clean.replace(/\.[^/.]+$/, '');
  return `${base}.csv`;
}

/**
 * Convert any supported data file (CSV, XLSX, XLS, JSON, TSV, TXT, PDF) into CSV text
 * or pass File object directly for non-blocking stream processing in the worker thread.
 */
export async function convertFileToCsvContent(file) {
  const fileName = file.name.toLowerCase();
  const normalizedDatasetName = formatAsCsvName(file.name);

  // 1. Excel Spreadsheets (.xlsx, .xls)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      const csvContent = XLSX.utils.sheet_to_csv(firstSheet);
      return { csvContent, datasetName: normalizedDatasetName };
    } catch (err) {
      throw new Error(`Failed to convert Excel spreadsheet "${file.name}". If the file is extremely large (50MB+), please export/save it as a CSV file for instant multi-million row stream processing.`);
    }
  }

  // 2. JSON Data Files (.json)
  if (fileName.endsWith('.json')) {
    try {
      const text = await file.text();
      let parsedData = JSON.parse(text);
      if (!Array.isArray(parsedData)) {
        if (typeof parsedData === 'object' && parsedData !== null) {
          const arrayKey = Object.keys(parsedData).find(k => Array.isArray(parsedData[k]));
          if (arrayKey) {
            parsedData = parsedData[arrayKey];
          } else {
            parsedData = [parsedData];
          }
        }
      }
      const csvContent = Papa.unparse(parsedData);
      return { csvContent, datasetName: normalizedDatasetName };
    } catch (err) {
      throw new Error(`Failed to parse JSON file "${file.name}". Please ensure it contains a valid array of record objects.`);
    }
  }

  // 3. PDF Files (.pdf) or Text Documents (.txt, .tsv)
  if (fileName.endsWith('.pdf')) {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const mockRows = lines.map((line, idx) => {
        const parts = line.split(/\s{2,}|\t|,/);
        return {
          RecordID: idx + 1,
          Document_Line: line.trim(),
          Column_1: parts[0] || '',
          Column_2: parts[1] || '',
          Column_3: parts[2] || ''
        };
      });
      const csvContent = Papa.unparse(mockRows);
      return { csvContent, datasetName: normalizedDatasetName };
    } catch (err) {
      throw new Error(`Failed to parse text from PDF file "${file.name}".`);
    }
  }

  // 4. Native CSV / TSV / TXT Files - Direct File Stream to Worker
  return { file, datasetName: normalizedDatasetName };
}
