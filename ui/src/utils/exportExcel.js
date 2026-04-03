/**
 * Dynamically imports xlsx and exports data to an Excel file.
 * Keeps ~1.2MB xlsx library out of the main bundle.
 */
export const exportToExcel = async (data, sheetName = 'Sheet1', fileName = 'export') => {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${Date.now()}.xlsx`);
};
