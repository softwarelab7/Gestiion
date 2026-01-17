import * as XLSX from 'xlsx';

self.onmessage = async (e: MessageEvent) => {
    const { fileData } = e.data;

    try {
        const wb = XLSX.read(fileData, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Smart Header Detection Logic
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        let maxScore = 0;
        let headerRowIndex = 0;
        const commonHeaders = ['código', 'codigo', 'nombre', 'referencia', 'refer', 'descripción', 'descripcion', 'precio', 'costo', 'stock', 'cantidad', 'tipo', 'categoría', 'categoria', 'inventario', 'impuesto', 'impues'];

        for (let i = 0; i < Math.min(rawData.length, 25); i++) {
            const row = rawData[i];
            if (!row) continue;

            const filledCols = row.filter(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '').length;
            let keywordScore = 0;

            row.forEach((cell: any) => {
                if (cell && typeof cell === 'string') {
                    const lowerCell = cell.toLowerCase();
                    if (commonHeaders.some(k => lowerCell.includes(k))) {
                        keywordScore += 10;
                    }
                }
            });

            const totalScore = filledCols + keywordScore;
            if (totalScore > maxScore) {
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
