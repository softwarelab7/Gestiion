import { useState, useEffect, useRef, useCallback } from 'react';
import { UploadZone } from './components/UploadZone';
import { ScrollToTop } from './components/ScrollToTop.tsx';
import { DataTable } from './components/DataTable';
import { DashboardStats } from './components/DashboardStats';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, FileText, LogOut, Palette, Check } from 'lucide-react';
import ExcelWorker from './workers/excelParserV2?worker'; // Vite worker import
import { saveInventory, getInventory, clearInventory } from './db';
import { useAppStore } from './store';
import './index.css';

function App() {
  const { data, setData, filteredData, setFilteredData, isLoading, setIsLoading, themeColor, setThemeColor } = useAppStore();

  const [isRestoring, setIsRestoring] = useState(true);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const PRESET_COLORS = [
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Sky', hex: '#0ea5e9' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Slate', hex: '#475569' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Dark', hex: '#1e293b' },
  ];

  useEffect(() => {
    // Initialize worker
    workerRef.current = new ExcelWorker();

    workerRef.current.onmessage = async (e) => {
      const payload = e.data;

      // Handle debug logs from worker
      if (payload.type === 'log') {
        console.warn("DEBUG_LOG:", payload.message);
        return;
      }

      const { success, data, error, detectedHeaderRow } = payload;
      if (success) {
        console.log(`[App] Worker successfully parsed data. Detected header at row: ${detectedHeaderRow}`);
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
  }, [setData, setFilteredData, setIsLoading]);

  // Close theme menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showThemeSelector && themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showThemeSelector]);

  const handleFileUpload = useCallback((file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer && workerRef.current) {
        workerRef.current.postMessage({ fileData: arrayBuffer });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [setIsLoading]);

  const handleReset = useCallback(async () => {
    await clearInventory();
    setData([]);
    setFilteredData([]);
  }, [setData, setFilteredData]);

  if (isRestoring) {
    return (
      <div className="flex h-screen justify-center items-center bg-[#f8fafc]">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans transition-colors duration-700 bg-[#f8fafc] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <header className="sticky top-0 z-50 transition-all duration-500 bg-blue-500/10 backdrop-blur-3xl backdrop-saturate-150 border-b border-blue-500/10 shadow-[0_8px_30px_rgba(59,130,246,0.08)]">
        <div className="w-full max-w-[95%] mx-auto py-2.5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative bg-gradient-to-br from-indigo-500 to-blue-600 p-2 rounded-xl shadow-lg flex items-center justify-center ring-1 ring-white/20">
                <Package size={20} className="text-white" />
              </div>
            </motion.div>
            <div className="flex flex-col">
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-bold text-xl tracking-tighter leading-none text-slate-900"
              >
                Gestión
              </motion.h1>
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-[9px] uppercase tracking-[0.2em] font-bold mt-1 text-slate-500"
              >
                Explorador de Datos
              </motion.span>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative" ref={themeMenuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-xl border transition-all shadow-sm ${showThemeSelector ? 'text-white' : 'bg-white/50 text-slate-600 border-white/20 hover:bg-white hover:text-slate-900'}`}
                style={showThemeSelector ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                title="Color de Tabla"
              >
                <Palette size={18} strokeWidth={2} />
              </motion.button>
              
              <AnimatePresence>
                {showThemeSelector && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-[120%] right-0 border shadow-2xl p-4 z-[100] min-w-[200px] rounded-2xl backdrop-blur-3xl transition-all duration-300 bg-white/90 border-slate-200"
                  >
                    <h4 className="text-[10px] font-bold mb-3 uppercase tracking-widest text-slate-400">Temas de Tabla</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color.hex}
                          onClick={() => {
                            setThemeColor(color.hex);
                            setShowThemeSelector(false);
                          }}
                          className="group relative w-full aspect-square rounded-lg transition-all hover:scale-110 flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {themeColor === color.hex && (
                            <Check size={14} className="text-white drop-shadow-md" />
                          )}
                          <div className="absolute inset-0 rounded-lg ring-2 ring-black/5 group-hover:ring-black/10 transition-all" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {data.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 items-center"
              >
                <div className="w-px h-6 mx-1 bg-slate-200/50" />
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-rose-600 to-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-600/20 font-bold text-xs border-none group"
                  onClick={handleReset}
                >
                  <LogOut size={14} strokeWidth={2.5} />
                  <span className="hidden sm:inline uppercase tracking-widest text-[9px]">Salir</span>
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[95%] mx-auto py-8 relative z-10">
        <main className="w-full">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center py-16"
              >
                <div className="loader border-blue-500 border-t-transparent opacity-50"></div>
                <p className="mt-4 font-medium text-slate-500">Procesando datos...</p>
              </motion.div>
            ) : data.length === 0 ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <UploadZone onFileUpload={handleFileUpload} />
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.15 }
                  }
                }}
                className="flex flex-col gap-6"
              >
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } } }}>
                  <DataTable
                    data={data}
                    searchTerm=""
                    onFilteredDataChange={setFilteredData}
                  />
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } } }}>
                  <DashboardStats data={filteredData} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <footer className="mt-auto py-8 text-center text-sm bg-transparent transition-colors duration-500 text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <FileText size={14} />
          <span className="font-medium">Gestor de Inventario © 2026 (v2.2)</span>
          <span className="mx-2 opacity-50">•</span>
          <span>Experiencia de Datos Moderna</span>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}

export default App;
