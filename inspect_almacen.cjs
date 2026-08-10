const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, 'ALMACEN.xlsx');
console.log('Ruta del excel:', excelPath);

try {
  const workbook = XLSX.readFile(excelPath);
  console.log('Hojas encontradas:', workbook.SheetNames);
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log('Total filas en Excel:', data.length);
  
  if (data.length > 0) {
    console.log('Columnas del Excel:', Object.keys(data[0]));
    console.log('Primeras 3 filas de ejemplo:', JSON.stringify(data.slice(0, 3), null, 2));
  } else {
    console.log('La hoja está vacía.');
  }
} catch (err) {
  console.error('Error al leer el archivo Excel:', err);
}
