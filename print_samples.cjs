const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, 'ALMACEN.xlsx');

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('Muestras de filas 98 a 115:');
  console.log(JSON.stringify(rawData.slice(98, 115), null, 2));
} catch (err) {
  console.error(err);
}
