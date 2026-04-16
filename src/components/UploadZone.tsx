import React from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileUpload }) => {
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onFileUpload(file);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 max-w-3xl mx-auto mt-12"
    >
      <div
        className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer bg-slate-50/30 gap-6 group"
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input
          type="file"
          id="fileInput"
          hidden
          accept=".xlsx, .xls"
          onChange={onFileInputChange}
        />
        <div className="relative">
          <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
            <Upload size={40} className="text-blue-500" strokeWidth={1.5} />
          </div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full -z-10"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
            }}
          />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-800">Suelte su archivo Excel aquí</h3>
          <p className="text-slate-500 text-sm">O haga clic para buscar en su computadora (.xlsx, .xls)</p>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm mt-2 bg-slate-100/50 px-4 py-2 rounded-full">
          <FileSpreadsheet size={16} />
          <span className="font-medium">Soporta hojas de cálculo modernas y antiguas</span>
        </div>
      </div>
    </motion.div>
  );
};
