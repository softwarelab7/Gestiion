import { useState, useEffect, useRef } from 'react';
import { UploadZone } from './components/UploadZone';
import { ScrollToTop } from './components/ScrollToTop.tsx';
import { DataTable } from './components/DataTable';
import { DashboardStats } from './components/DashboardStats';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, FileText, LogOut, Search } from 'lucide-react';
import { useDebounce } from './hooks/useDebounce';
import ExcelWorker from './workers/excelWorker?worker'; // Vite worker import
import { saveInventory, getInventory, clearInventory } from './db';
import './App.css';


function App() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  // ... rest of component logic ...
  // Wait, wrapping requires moving the whole component logic into a child or wrapping the return.
  // Refactor: Move App logic to AppContent, make App the provider wrapper.

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new ExcelWorker();

    workerRef.current.onmessage = async (e) => {
      const { success, data, error } = e.data;
      if (success) {
        setData(data);
        setFilteredData(data); // Init filtered data
        await saveInventory(data); // Persist data
      } else {
        console.error("Worker Error:", error);
        alert("Error al procesar el archivo.");
      }
      setIsLoading(false);
    };

    // Restore data
    const restoreData = async () => {
      try {
        const savedData = await getInventory();
        if (savedData && savedData.length > 0) {
          setData(savedData);
          setFilteredData(savedData); // Init filtered data
        }
      } catch (error) {
        console.error("Error restoring data:", error);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreData();

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer && workerRef.current) {
        workerRef.current.postMessage({ fileData: arrayBuffer });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleReset = async () => {
    await clearInventory();
    setData([]);
    setFilteredData([]);
    setSearchTerm('');
  };

  if (isRestoring) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-app)' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="top-banner">
        <div className="top-banner-brand">
          <div style={{
            background: 'var(--blue-600)',
            padding: '0.4rem',
            borderRadius: '8px',
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

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {data.length > 0 && (
            <>
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
            </>
          )}
        </div>
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
              <>
                <DataTable
                  key="table"
                  data={data}
                  searchTerm={debouncedSearchTerm}
                  onFilteredDataChange={setFilteredData}
                />
                <DashboardStats data={filteredData} />
              </>
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

      <ScrollToTop />
    </div>
  );
}

export default App;
