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
            className="bg-surface border border-border-hover w-full max-w-lg rounded-2xl p-6 sm:p-8 relative shadow-2xl z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
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
                    <p className="text-[9px] text-text-muted mb-1 bg-yellow-500/10 p-1 rounded border border-yellow-500/20">
                      ⚠️ <strong>Crucial:</strong> Use a <strong>Computer Browser</strong>. Mobile apps do not show "Extensions".
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 leading-relaxed">
                      <li>Open your Sheet on a Desktop → <b>Extensions</b> → <b>Apps Script</b></li>
                      <li>Delete all existing code and paste the code block below</li>
                      <li>Click <b>Deploy</b> (top right) → <b>New Deployment</b></li>
                      <li>Select Type: <b>Web App</b></li>
                      <li>Execute as: <b>Me</b> | Who has access: <b>Anyone</b> (Essential!)</li>
                      <li>Click <b>Deploy</b>, Authorize access, and copy the <b>Web App URL</b></li>
                    </ol>
                      <div className="bg-surface-brighter border border-border-main p-4 rounded-xl space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-income/20 text-income flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">1</div>
                          <div>
                            <p className="font-bold text-xs uppercase tracking-wider text-text-main mb-1">Publish for Static Hosting</p>
                            <p className="text-[10px] text-text-muted leading-relaxed">
                              If you are using Cloudflare/Netlify, you MUST go to <strong className="text-accent-gold">File &gt; Share &gt; Publish to web</strong>. 
                              Select <strong className="text-accent-gold">CSV</strong> format and click Publish. Copy THAT link and use it in Step 4 below.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-income/20 text-income flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">2</div>
                          <div>
                            <p className="font-bold text-xs uppercase tracking-wider text-text-main mb-1">Apps Script Access</p>
                            <p className="text-[10px] text-text-muted leading-relaxed">
                              When deploying the script, set <strong className="text-accent-gold">"Who has access"</strong> to <strong className="text-accent-gold">"Anyone"</strong>. 
                              If you select "Anyone with Google Account", the app will be blocked by CORS on static hosts.
                            </p>
                          </div>
                        </div>
                      </div>
                    <div className="relative group max-h-48 overflow-y-auto custom-scrollbar rounded-lg border border-border-main scrollbar-thin">
                       <pre className="p-3 bg-black/40 font-mono text-[9px] text-income select-all leading-relaxed whitespace-pre">
{`function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("Could not access active spreadsheet. Check permissions.");
    
    // Use "Active" sheet, or fallback to the FIRST sheet if "Active" doesn't exist
    let s = ss.getSheetByName("Active");
    if (!s) {
       s = ss.getSheets()[0];
       console.warn("Sheet 'Active' not found, using first sheet: " + s.getName());
    }
    
    if (!e.postData || !e.postData.contents) throw new Error("No data received");
    const d = JSON.parse(e.postData.contents);
    const date = d.date || new Date().toISOString().split('T')[0];

    // Find first empty row by checking Column B (Date)
    const lastRow = s.getLastRow();
    const data = s.getRange(1, 2, Math.max(lastRow, 10)).getValues();
    let targetRow = 1;
    
    // Scan from bottom to find last entry in Column B
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][0]) {
        targetRow = i + 2;
        break;
      }
    }
    
    // Ensure we don't write before header area (Start at row 5 as per standard template)
    if (targetRow < 5) targetRow = 5;

    // A=SR, B=Date, C=Name, D=Amount, E=Category, F=Type, G=From, H=To, I=Notes
    // We update B through I. 
    const range = s.getRange(targetRow, 2, 1, 8); 
    range.setValues([[
      date, 
      d.name, 
      d.amount, 
      d.category, 
      d.type, 
      d.from, 
      d.to, 
      d.notes
    ]]);
    
    // Auto-increment SR in Column A if empty
    const srCell = s.getRange(targetRow, 1);
    if (!srCell.getValue()) {
      srCell.setValue(targetRow - 4); // Assuming header ends at row 4
    }
    
    return ContentService.createTextOutput("OK - Saved to " + s.getName() + " row " + targetRow)
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}`}
                       </pre>
                       <span className="absolute top-2 right-2 text-[8px] bg-accent-gold/20 text-accent-gold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Select & Copy Code</span>
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
