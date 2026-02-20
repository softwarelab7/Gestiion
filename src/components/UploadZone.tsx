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
      className="glass-panel"
      style={{ padding: '1.5rem' }}
    >
      <div
        className="upload-zone"
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
        <div style={{ position: 'relative' }}>
          <Upload size={48} />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
              zIndex: -1
            }}
          />
        </div>
        <div className="upload-zone-text">
          <h3>Suelte su archivo Excel aquí</h3>
          <p>O haga clic para buscar en su computadora (.xlsx, .xls)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '1rem' }}>
          <FileSpreadsheet size={16} />
          <span>Soporta hojas de cálculo modernas y antiguas</span>
        </div>
      </div>
    </motion.div>
  );
};
