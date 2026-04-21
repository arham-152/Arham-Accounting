import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Link as LinkIcon, FileUp, AlertCircle, ExternalLink } from 'lucide-react';
import { extractSheetInfo } from '../services/dataService';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (url: string) => void;
  onFileUpload: (file: File) => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, onConnect, onFileUpload }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (!url.trim()) {
      setError('Please provide a URL.');
      return;
    }
    
    // Validate if it's a direct CSV or a Google Sheet link
    const { id } = extractSheetInfo(url);
    if (!id && !url.includes('docs.google.com') && !url.toLowerCase().endsWith('.csv')) {
      setError('Invalid URL. Please provide a Google Sheet link or a CSV URL.');
      return;
    }
    
    setError('');
    onConnect(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface border border-border-hover w-full max-w-lg rounded-2xl p-6 sm:p-8 relative shadow-2xl z-10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <LinkIcon className="text-accent-gold" size={24} />
              <h2 className="text-xl font-bold font-display">Connect Financial Data</h2>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Link your live Google Spreadsheet or upload a CSV file to monitor your financials in real-time.
            </p>
            
            <div className="bg-surface-brighter rounded-xl p-4 mb-6 border border-border-main">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Setup Instructions</div>
              <ul className="text-xs text-gray-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0">1</div>
                  <span>Open your sheet and click <strong className="text-gray-200">Share</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0">2</div>
                  <div>
                    <span>Set <b>General access</b> to "Anyone with the link" as Viewer</span>
                    <p className="text-[10px] text-gray-500 mt-1 italic">Note: If hosted on Netlify, use <b>File → Share → Publish to web</b> for best results.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0">3</div>
                  <span>Click <strong className="text-gray-200">Copy link</strong> and paste it below</span>
                </li>
              </ul>
            </div>
            
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 bg-surface-brighter border border-border-main text-gray-200 text-sm px-4 py-2.5 rounded-xl outline-none focus:border-accent-gold transition-colors font-mono"
              />
              <button 
                onClick={handleConnect}
                className="bg-accent-gold text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-all active:scale-95"
              >
                Connect
              </button>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-expense text-[11px] font-bold mb-4 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            
            <div className="text-[10px] text-gray-500 font-mono mb-6">
              Your data stays local in the session and is not sent to any external server.
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-main" />
              <span className="text-[10px] font-bold text-gray-600 uppercase">OR</span>
              <div className="flex-1 h-px bg-border-main" />
            </div>
            
            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => document.getElementById('file-upload-dialog')?.click()}
                className="flex items-center gap-2 text-income font-bold text-sm hover:text-green-400 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-income/10 flex items-center justify-center group-hover:bg-income/20">
                  <FileUp size={20} />
                </div>
                <span>Import Local CSV File</span>
              </button>
              <input 
                type="file" 
                id="file-upload-dialog" 
                className="hidden" 
                accept=".csv"
                onChange={handleFileChange}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
