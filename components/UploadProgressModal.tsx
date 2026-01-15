import React from 'react';
import { UploadProgress } from '../types';

interface UploadProgressModalProps {
  uploadProgress: UploadProgress;
  onClose: () => void;
}

const UploadProgressModal: React.FC<UploadProgressModalProps> = ({ uploadProgress, onClose }) => {
  if (!uploadProgress.isUploading && uploadProgress.status !== 'success' && uploadProgress.status !== 'error') {
    return null;
  }

  const getStatusIcon = () => {
    switch (uploadProgress.status) {
      case 'uploading':
        return (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-emerald-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-30"></div>
        
        <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-8 text-center">
            {getStatusIcon()}
            
            <h3 className="text-xl font-bold text-white mb-2">
              {uploadProgress.status === 'uploading' && 'Caricamento in corso...'}
              {uploadProgress.status === 'success' && 'Caricamento completato!'}
              {uploadProgress.status === 'error' && 'Errore nel caricamento'}
            </h3>
            
            <p className="text-sm text-white/50 truncate px-4 mb-6">
              {uploadProgress.fileName}
            </p>

            {uploadProgress.status === 'uploading' && (
              <>
                <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  {Math.round(uploadProgress.progress)}%
                </p>
              </>
            )}

            {uploadProgress.status === 'error' && uploadProgress.errorMessage && (
              <p className="text-sm text-red-400 mb-4">{uploadProgress.errorMessage}</p>
            )}

            {(uploadProgress.status === 'success' || uploadProgress.status === 'error') && (
              <button
                onClick={onClose}
                className="mt-4 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-purple-500/20"
              >
                Chiudi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadProgressModal;
