import * as XLSX from 'xlsx';

self.onmessage = async (e: MessageEvent) => {
    const { fileData } = e.data;

    try {
        const wb = XLSX.read(fileData, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
        
        let headerRowIndex = 0;
        let maxScore = -1;

        const headerKeywords = [
            'codigo', 'código', 'cod', 'sku', 'ean', 'upc', 'id',
            'nombre', 'producto', 'articulo', 'artículo', 'desc', 'descripcion', 'descripción',
            'referencia', 'ref', 'tipo', 'categoria', 'categoría', 'marca', 'modelo',
            'precio', 'costo', 'valor', 'total', 'moneda', 'impuesto', 'iva',
            'stock', 'cantidad', 'cant', 'inventario', 'disponible', 'saldo',
            'estado', 'status', 'unidad', 'medida', 'peso', 'color', 'talla',
            'fábrica', 'fabrica', 'linea', 'grupo'
        ];

        // Scan the first 200 rows to find the best header row
        for (let i = 0; i < Math.min(rawData.length, 200); i++) {
            const row = rawData[i];
            if (!row || !Array.isArray(row)) continue;
            
            const strRow = row.map(c => c?.toString().trim().toLowerCase() || "");
            const filledCount = strRow.filter(c => c !== "").length;
            
            // Ignore rows with less than 2 columns (usually main titles like "Listado de productos")
            if (filledCount < 2) continue; 

            let keywordHits = 0;
            for (const cell of strRow) {
                if (!cell || cell.length < 2) continue;
                if (headerKeywords.includes(cell)) {
                    keywordHits += 10; // Exact match is very strong
                } else if (headerKeywords.some(kw => cell.includes(kw))) {
                    keywordHits += 2; // Partial match
                }
            }

            // Score based on number of columns and keyword matches
            let score = (filledCount * 50) + (keywordHits * 100);

            // Massive bonus if the next row also has data (headers are usually followed immediately by data)
            const nextRow = rawData[i + 1];
            if (nextRow && Array.isArray(nextRow)) {
                const nextFilledCount = nextRow.filter(c => c?.toString().trim() !== "").length;
                if (nextFilledCount >= 2) {
                    score += 500;
                }
            }

            if (score > maxScore) {
                maxScore = score;
                headerRowIndex = i;
            }
        }

        // Fallback if nothing matched well
        if (maxScore === -1) {
            const fallbackIndex = rawData.findIndex(r => r && Array.isArray(r) && r.filter(c => c?.toString().trim() !== "").length >= 3);
            headerRowIndex = fallbackIndex !== -1 ? fallbackIndex : 0;
        }

        const headerRow = rawData[headerRowIndex] || [];
        const headers: string[] = [];
        const headerCounts: Record<string, number> = {};

        let firstDataCol = 0;
        let lastDataCol = headerRow.length - 1;

        // Find actual start of data to ignore leading empty columns
        for (let i = 0; i < headerRow.length; i++) {
            if (headerRow[i]?.toString().trim() !== "") {
                firstDataCol = i;
                break;
            }
        }

        // Find actual end of data
        for (let i = headerRow.length - 1; i >= 0; i--) {
            if (headerRow[i]?.toString().trim() !== "") {
                lastDataCol = i;
                break;
            }
        }

        // Build unique headers
        for (let idx = firstDataCol; idx <= lastDataCol; idx++) {
            let val = headerRow[idx]?.toString().trim();
            if (!val) {
                val = `Columna_${idx + 1}`; // Better fallback name than __EMPTY
            }
            
            if (headerCounts[val]) {
                const newHeader = `${val} (${headerCounts[val]})`;
                headers.push(newHeader);
                headerCounts[val]++;
            } else {
                headers.push(val);
                headerCounts[val] = 1;
            }
        }

        const cleanedData = [];
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || !Array.isArray(row)) continue;
            
            // Skip completely empty rows
            if (row.every(c => c === "" || c == null)) continue;

            const obj: Record<string, unknown> = {};
            let hasRealData = false;
            
            // Capture leading columns that might not have headers (before firstDataCol)
            for (let j = 0; j < firstDataCol; j++) {
                const val = row[j];
                if (val !== undefined && val !== null && val !== "") {
                    obj[`Columna_${j + 1}`] = val;
                    hasRealData = true;
                }
            }

            // Map values to headers
            for (let j = 0; j < headers.length; j++) {
                const val = row[j + firstDataCol];
                const key = headers[j];
                
                if (val !== undefined && val !== null && val !== "") {
                    obj[key] = val;
                    hasRealData = true;
                }
            }
            
            // Capture trailing columns that might not have headers
            for (let j = firstDataCol + headers.length; j < row.length; j++) {
                const val = row[j];
                if (val !== undefined && val !== null && val !== "") {
                    obj[`Columna_${j + 1}`] = val;
                    hasRealData = true;
                }
            }

            if (hasRealData) {
                cleanedData.push(obj);
            }
        }

        self.postMessage({ success: true, data: cleanedData, detectedHeaderRow: headerRowIndex });

    } catch (error) {
        self.postMessage({ success: false, error: (error as Error).message });
    }
};
