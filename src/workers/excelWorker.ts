import * as XLSX from 'xlsx';

self.onmessage = async (e: MessageEvent) => {
    const { fileData } = e.data;

    try {
        const wb = XLSX.read(fileData, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Smart Header Detection Logic
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
        self.postMessage({ type: 'log', message: `[V4] Analyzing Excel, Rows: ${rawData.length}` });

        let headerRowIndex = 0;
        let bestScore = 0;
        const commonHeaders = [
            'código', 'codigo', 'nombre', 'referencia', 'refer', 'descripción', 'descripcion',
            'precio', 'costo', 'stock', 'cantidad', 'tipo', 'categoría', 'categoria',
            'inventario', 'impuesto', 'impues', 'estado', 'status', 'unidad', 'medida',
            'marca', 'modelo', 'ean', 'sku', 'valor', 'total'
        ];

        // Search deeper if needed (up to row 100)
        const searchRange = Math.min(rawData.length, 100);
        for (let i = 0; i < searchRange; i++) {
            const row = rawData[i];
            if (!row || !Array.isArray(row)) continue;

            // Trim and clean cells for better detection
            const cleanRow = row.map(c => c?.toString().trim().toLowerCase() || "");
            const filledCells = cleanRow.filter(c => c !== "");

            if (filledCells.length === 0) continue;

            let currentHits = 0;
            cleanRow.forEach((cellStr: string) => {
                if (cellStr && (commonHeaders.includes(cellStr) || commonHeaders.some(h => cellStr.startsWith(h) || h.startsWith(cellStr)))) {
                    currentHits++;
                }
            });

            // Score calculation:
            // - Huge weight on keywords (2000 each)
            // - Medium weight on number of columns (50 each)
            // - Massive penalty for title-like rows (low columns or low hits)
            let rowScore = (currentHits * 2000) + (filledCells.length * 50);

            if (filledCells.length < 3 && currentHits < 2) {
                rowScore -= 20000;
            }

            // Diagnostic log for any promising row
            if (currentHits > 0 || filledCells.length > 5) {
                self.postMessage({
                    type: 'log',
                    message: `Row ${i} analysis: hits=${currentHits}, cols=${filledCells.length}, score=${rowScore} | Sample: [${filledCells.slice(0, 4).join(', ')}]`
                });
            }

            if (rowScore > bestScore) {
                bestScore = rowScore;
                headerRowIndex = i;
            }
        }

        self.postMessage({ type: 'log', message: `[V4] Final decision: row ${headerRowIndex} (score ${bestScore})` });

        const jsonData = XLSX.utils.sheet_to_json(ws, {
            range: headerRowIndex,
            defval: ""
        });

        self.postMessage({ success: true, data: jsonData });

    } catch (error) {
        self.postMessage({ success: false, error: (error as Error).message });
    }
};
