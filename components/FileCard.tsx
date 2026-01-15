import React from 'react';
import { AppFile } from '../types';

interface FileCardProps {
  file: AppFile;
  onDownload: (file: AppFile) => void;
  readOnly?: boolean;
}

const FileCard: React.FC<FileCardProps> = ({ file, onDownload, readOnly = false }) => {
  const getFileIcon = () => {
    switch (file.type) {
      case 'image':
        return (
          <div className="w-full h-24 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-pink-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        );
      case 'pdf':
        return (
          <div className="w-full h-24 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-full h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        );
    }
  };

  const getTypeLabel = () => {
    switch (file.type) {
      case 'image': return 'Immagine';
      case 'pdf': return 'PDF';
      case 'text': return 'Testo';
      default: return 'File';
    }
  };

  const getTypeColor = () => {
    switch (file.type) {
      case 'image': return 'from-pink-500 to-rose-500';
      case 'pdf': return 'from-red-500 to-orange-500';
      case 'text': return 'from-blue-500 to-cyan-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div 
      onClick={() => !readOnly && onDownload(file)}
      className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/5 ${!readOnly ? 'cursor-pointer' : ''}`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300"></div>
      
      {/* File Icon */}
      <div className="p-3">
        {getFileIcon()}
      </div>

      {/* File Info */}
      <div className="px-3 pb-3">
        <p className="text-white font-medium text-sm truncate mb-1" title={file.name}>
          {file.name}
        </p>
        <div className="flex items-center justify-between">
          <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-gradient-to-r ${getTypeColor()} text-white`}>
            {getTypeLabel()}
          </span>
          <span className="text-[10px] text-white/40">
            {new Date(file.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Download indicator */}
      {!readOnly && (
        <div className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default FileCard;
