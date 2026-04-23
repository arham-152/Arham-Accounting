import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Link as LinkIcon, FileUp, AlertCircle, ExternalLink } from 'lucide-react';
import { extractSheetInfo } from '../services/dataService';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (url: string, syncUrl?: string) => void;
  onFileUpload: (file: File) => void;
  currentSyncUrl?: string;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, onConnect, onFileUpload, currentSyncUrl }) => {
  const [url, setUrl] = useState('');
  const [syncUrl, setSyncUrl] = useState(currentSyncUrl || '');
  const [error, setError] = useState('');
  const [showSyncSetup, setShowSyncSetup] = useState(false);

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
    onConnect(url, syncUrl);
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
            <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <LinkIcon className="text-accent-gold" size={24} />
              <h2 className="text-xl font-bold font-display text-text-primary">Connect Financial Data</h2>
            </div>
            
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Link your live Google Spreadsheet or upload a CSV file to monitor your financials in real-time.
            </p>
            
            <div className="bg-surface-brighter rounded-xl p-4 mb-6 border border-border-main">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Setup Instructions</div>
              <ul className="text-xs text-text-secondary space-y-2.5">
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0">1</div>
                  <span>Open your sheet and click <strong className="text-text-primary font-bold">Share</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0">2</div>
                  <div>
                    <span className="font-medium">Set <b>General access</b> to "Anyone with the link" as Viewer</span>
                    <p className="text-[10px] text-text-muted mt-1 italic">Note: If hosted on Netlify, use <b>File → Share → Publish to web</b> for best results.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent-gold/20 text-accent-gold flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0">3</div>
                  <span>Click <strong className="text-text-primary font-bold">Copy link</strong> and paste it below</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Google Sheet CSV Export URL..."
                className="flex-1 bg-surface-brighter border border-border-main text-text-primary text-sm px-4 py-2.5 rounded-xl outline-none focus:border-accent-gold transition-colors font-mono min-w-0 placeholder:text-text-muted/50"
              />
            </div>

            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 flex justify-between items-center">
               <span>Sync Settings (For Adding Transactions)</span>
               <button 
                 type="button" 
                 onClick={() => setShowSyncSetup(!showSyncSetup)}
                 className="text-accent-gold hover:underline decoration-dotted"
               >
                 {showSyncSetup ? 'Hide setup' : 'Show setup guide'}
               </button>
            </div>

            <div className="flex flex-col gap-2 mb-2">
              <input 
                type="text" 
                value={syncUrl}
                onChange={(e) => setSyncUrl(e.target.value)}
                placeholder="Google Apps Script Web App URL (Optional)..."
                className="flex-1 bg-surface-brighter border border-border-main text-text-primary text-sm px-4 py-2.5 rounded-xl outline-none focus:border-accent-gold transition-colors font-mono min-w-0 placeholder:text-text-muted/50"
              />
              <p className="text-[9px] text-text-muted italic mb-2">
                Provide this URL to enable adding transactions directly from the dashboard.
              </p>
            </div>

            <AnimatePresence>
              {showSyncSetup && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="p-4 bg-surface-brightest rounded-xl border border-dashed border-accent-gold/30 text-[10px] text-text-secondary space-y-3">
                    <p className="font-bold text-accent-gold">How to Enable "Add Transaction":</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Open your Spreadsheet → <b>Extensions</b> → <b>Apps Script</b></li>
                      <li>Paste the code below into <code>Code.gs</code></li>
                      <li>Click <b>Deploy</b> → <b>New Deployment</b> → Type: <b>Web App</b></li>
                      <li>Who has access: <b>Anyone</b></li>
                      <li>Copy the <b>Web App URL</b> and paste it above!</li>
                    </ol>
                    <div className="relative group">
                       <pre className="p-3 bg-black/40 rounded-lg font-mono text-[9px] overflow-x-auto border border-border-main text-income select-all">
{`function doPost(e) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DashBoard");
  const d = JSON.parse(e.postData.contents);
  const sr = s.getLastRow();
  s.appendRow([sr, d.date, d.name, d.amount, d.category, d.type, d.from, d.to, d.notes]);
  return ContentService.createTextOutput("OK");
}`}
                       </pre>
                       <span className="absolute top-2 right-2 text-[8px] bg-accent-gold/20 text-accent-gold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Select & Copy</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <button 
              onClick={handleConnect}
              className="bg-accent-gold text-black w-full px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all active:scale-95 whitespace-nowrap mb-6 shadow-lg"
            >
              Update Connections
            </button>
            
            {error && (
              <div className="flex items-center gap-2 text-expense text-[11px] font-bold mb-4 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            
            <div className="text-[10px] text-text-muted font-mono mb-6 italic">
              Your data stays local in the session and is not sent to any external server.
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-main" />
              <span className="text-[10px] font-bold text-text-muted uppercase">OR</span>
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
