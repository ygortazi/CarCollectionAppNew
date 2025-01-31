import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import { DocumentPickerAsset } from 'expo-document-picker';

export const generateExcelFile = async (data: any[], filename: string) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Collection");
    
    const colWidths = [
      { wch: 40 }, // name
      { wch: 20 }, // series
      { wch: 15 }, // seriesNumber
      { wch: 10 }, // year
      { wch: 15 }, // yearNumber
      { wch: 15 }, // color
      { wch: 15 }, // purchaseDate
      { wch: 15 }, // purchasePrice
      { wch: 20 }, // store
      { wch: 40 }, // notes
    ];
    worksheet['!cols'] = colWidths;

    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
    
    return true;
  } catch (error) {
    console.error('Excel generation error:', error);
    return false;
  }
};

export const parseExcelFile = async (asset: DocumentPickerAsset): Promise<any[]> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
    const workbook = XLSX.read(base64, { type: 'base64' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet);
  } catch (e) {
    const error = e as Error;
    throw new Error('Failed to parse Excel file: ' + (error.message || 'Unknown error'));
  }
};