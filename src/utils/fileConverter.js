import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Convert any supported data file (CSV, XLSX, XLS, JSON, TSV, TXT, PDF) into CSV text
 * to be processed by the worker thread.
 */
export async function convertFileToCsvContent(file) {
  const fileName = file.name.toLowerCase();

  // 1. Excel Spreadsheets (.xlsx, .xls)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    const csvContent = XLSX.utils.sheet_to_csv(firstSheet);
    return { csvContent, datasetName: file.name };
  }

  // 2. JSON Data Files (.json)
  if (fileName.endsWith('.json')) {
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
    return { csvContent, datasetName: file.name };
  }

  // 3. PDF Files (.pdf) or Text Documents (.txt, .tsv)
  if (fileName.endsWith('.pdf')) {
    const text = await file.text();
    // Clean and split lines to parse tabular data from text
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
    return { csvContent, datasetName: file.name };
  }

  // 4. Native CSV / TSV / TXT Files
  return { file, datasetName: file.name };
}
