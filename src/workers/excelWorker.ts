import * as XLSX from 'xlsx';

self.onmessage = async (e: MessageEvent) => {
    const { fileData } = e.data;

    try {
        const wb = XLSX.read(fileData, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Smart Header Detection Logic
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];

        let maxScore = -1;
        let headerRowIndex = 0;
        const commonHeaders = [
            'código', 'codigo', 'nombre', 'referencia', 'refer', 'descripción', 'descripcion',
            'precio', 'costo', 'stock', 'cantidad', 'tipo', 'categoría', 'categoria',
            'inventario', 'impuesto', 'impues', 'estado', 'status', 'unidad', 'medida'
        ];

        // Search deeper (up to 40 rows) for headers in corporate reports
        for (let i = 0; i < Math.min(rawData.length, 40); i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;

            const filledCells = row.filter(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '');
            const filledCount = filledCells.length;

            // Penalty: Title rows usually have 1 or 2 big merged cells or just a few words
            if (filledCount < 3) continue;

            let keywordScore = 0;
            row.forEach((cell: any) => {
                if (cell && typeof cell === 'string') {
                    const lowerCell = cell.toLowerCase().trim();
                    // Exact matches or very close matches get high priority
                    if (commonHeaders.some(k => lowerCell === k || lowerCell.startsWith(k))) {
                        keywordScore += 25; // High weight for structural keywords
                    } else if (commonHeaders.some(k => lowerCell.includes(k))) {
                        keywordScore += 10; // Medium weight for partial matches
                    }
                }
            });

            // Density Score: Headers usually have many adjacent filled cells
            const densityScore = filledCount * 2;

            const totalScore = densityScore + keywordScore;

            // Tie-breaker: Prefer the deeper row (headers usually follow titles/logos)
            if (totalScore >= maxScore && totalScore > 0) {
                maxScore = totalScore;
                headerRowIndex = i;
            }
        }

        const jsonData = XLSX.utils.sheet_to_json(ws, {
            range: headerRowIndex,
            defval: ""
        });

        self.postMessage({ success: true, data: jsonData });

    } catch (error) {
        self.postMessage({ success: false, error: (error as Error).message });
    }
};
