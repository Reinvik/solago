const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, 'ALMACEN.xlsx');

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Filas brutas en Excel: ${rawData.length}`);
  
  const sections = [];
  let currentSection = null;
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const firstColVal = String(row['LISTA DE PRECIOS ALMACEN DONDE MAQUI'] || '').trim();
    const prodName = String(row['__EMPTY'] || '').trim();
    
    if (firstColVal && prodName && firstColVal.toLowerCase() !== 'codigo') {
      if (!currentSection) {
        currentSection = { start: i, firstItem: prodName, firstSku: firstColVal, count: 0 };
        sections.push(currentSection);
      }
      currentSection.count++;
    } else {
      currentSection = null;
    }
  }
  
  console.log('Secciones con datos encontradas en la hoja:');
  console.log(JSON.stringify(sections, null, 2));
} catch (err) {
  console.error(err);
}
