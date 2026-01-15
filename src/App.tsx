import { useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadZone } from './components/UploadZone';
import { DataTable } from './components/DataTable';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, FileText, LogOut, Search } from 'lucide-react';
import './App.css';

function App() {
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (file: File) => {
    setIsLoading(true);


    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      // Smart Header Detection
      // 1. Get raw data as array of arrays
      const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // 2. Find the row with the most *filled* columns + keyword match in the first 25 rows
      let maxScore = 0;
      let headerRowIndex = 0;
      const debugRows: string[] = [];
      const commonHeaders = ['código', 'codigo', 'nombre', 'referencia', 'refer', 'descripción', 'descripcion', 'precio', 'costo', 'stock', 'cantidad', 'tipo', 'categoría', 'categoria', 'inventario', 'impuesto', 'impues'];

      for (let i = 0; i < Math.min(rawData.length, 25); i++) {
        const row = rawData[i];
        if (!row) continue;

        // Count non-empty cells
        const filledCols = row.filter(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '').length;

        // Keyword matching score
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
        debugRows.push(`Row ${i}: ${filledCols} filled, Score ${totalScore}`);

        if (totalScore > maxScore) {
          maxScore = totalScore;
          headerRowIndex = i;
        }
      }

      console.log('Debug Rows:', debugRows);
      console.log('Selected Header Row:', headerRowIndex);


      // 3. Parse specific range starting from detected header
      // If we found a header row > 0, we use that.
      const jsonData = XLSX.utils.sheet_to_json(ws, {
        range: headerRowIndex,
        defval: "" // Default value for empty cells
      });

      // Simulate loading for better UX feel
      setTimeout(() => {
        setData(jsonData);
        setIsLoading(false);
      }, 800);
    };
    reader.readAsBinaryString(file);
  };

  const handleReset = () => {
    setData([]);

  };

  return (

    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="top-banner">
        <div className="top-banner-brand">
          <div style={{
            background: 'var(--blue-600)',
            padding: '0.4rem',
            borderRadius: '8px', /* Sharper corners for industrial look */
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={20} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Gestión de Inventario
            </motion.h1>
          </div>
        </div>

        {data.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search
                size={16}
                className="text-slate-400"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="search-input"
                placeholder="BUSCAR DATOS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <button
              className="btn btn-icon"
              onClick={handleReset}
              title="Salir"
              style={{
                background: 'white',
                border: '1px solid var(--slate-200)'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="app-container">
        <main className="main-content" style={{ padding: 0 }}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem' }}
              >
                <div className="loader"></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Procesando datos...</p>
              </motion.div>
            ) : data.length === 0 ? (
              <UploadZone key="upload" onFileUpload={handleFileUpload} />
            ) : (
              <DataTable
                key="table"
                data={data}
                searchTerm={searchTerm}

              />
            )}
          </AnimatePresence>
        </main>
      </div>

      <footer style={{
        marginTop: 'auto',
        padding: '1.5rem 0',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.875rem',
        background: 'var(--bg-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <FileText size={14} />
          <span>Gestor de Inventario © 2026 - Experiencia de Datos Moderna</span>
        </div>
      </footer>
    </div >
  );
}

export default App;
