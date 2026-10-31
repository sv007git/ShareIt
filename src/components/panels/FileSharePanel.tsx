import React, { useRef } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle, Clock, Ban } from 'lucide-react';
import { FileTransferState } from '../../signaling/types';
import { formatBytes } from '../../utils/formatters';
import { Button } from '../common/Button';

export interface FileSharePanelProps {
  isOpen: boolean;
  onClose: () => void;
  transfers: FileTransferState[];
  onSendFile: (file: File) => void;
  onAcceptTransfer: (fileId: string) => void;
  onRejectTransfer: (fileId: string) => void;
  onCancelTransfer: (fileId: string) => void;
}

export const FileSharePanel: React.FC<FileSharePanelProps> = ({
  isOpen,
  onClose,
  transfers,
  onSendFile,
  onAcceptTransfer,
  onRejectTransfer,
  onCancelTransfer,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSendFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSendFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 md:w-96 bg-surface-900 border-l border-surface-800 shadow-2xl flex flex-col z-40 animate-slide-up sm:animate-fade-in text-surface-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-800">
        <div>
          <h3 className="font-bold text-white text-base">P2P File Transfer</h3>
          <p className="text-xs text-surface-400">Direct, chunked peer-to-peer data channel transfers</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
          aria-label="Close file transfer panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Upload Drop Zone */}
      <div className="p-4 border-b border-surface-800">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-surface-700 hover:border-brand-500 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-surface-950/40 hover:bg-surface-950/70"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-white">Click or drag a file to send</p>
          <p className="text-[11px] text-surface-400 mt-0.5">Documents, images, slides & archives</p>
        </div>
      </div>

      {/* Transfers List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {transfers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-surface-500 text-xs px-4">
            <p>No active file transfers.</p>
            <p className="mt-1">Files sent will appear here with real-time progress.</p>
          </div>
        ) : (
          transfers.map((t) => (
            <div
              key={t.fileId}
              className="bg-surface-950/60 rounded-2xl p-3.5 border border-surface-800 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate" title={t.name}>
                    {t.name}
                  </p>
                  <p className="text-[11px] text-surface-400">
                    {formatBytes(t.size)} &bull; {t.isSender ? 'Outgoing' : `From ${t.senderName}`}
                  </p>
                </div>

                {/* Status icon / badge */}
                <div>
                  {t.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {t.status === 'transferring' && <Clock className="w-4 h-4 text-brand-400 animate-spin" />}
                  {t.status === 'pending' && <AlertCircle className="w-4 h-4 text-amber-400" />}
                  {t.status === 'rejected' && <Ban className="w-4 h-4 text-surface-500" />}
                </div>
              </div>

              {/* Explicit Incoming File Offer: Prompt user to Accept or Decline */}
              {!t.isSender && t.status === 'pending' && (
                <div className="p-2.5 bg-brand-500/10 rounded-xl border border-brand-500/20 space-y-2">
                  <p className="text-[11px] text-brand-300">
                    <strong>{t.senderName}</strong> wants to send you this file. Accept download?
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs py-1"
                      onClick={() => onAcceptTransfer(t.fileId)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs py-1"
                      onClick={() => onRejectTransfer(t.fileId)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              {/* Progress bar during transfer */}
              {(t.status === 'transferring' || t.status === 'pending') && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 transition-all duration-150"
                      style={{ width: `${t.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-surface-400">
                    <span>{t.progress}%</span>
                    <span>{t.speed}</span>
                  </div>
                </div>
              )}

              {/* Completed: Download button */}
              {t.status === 'completed' && !t.isSender && t.blobUrl && (
                <a
                  href={t.blobUrl}
                  download={t.name}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              )}

              {/* Cancel Button */}
              {t.status === 'transferring' && (
                <button
                  onClick={() => onCancelTransfer(t.fileId)}
                  className="text-[10px] text-accent-rose hover:underline"
                >
                  Cancel transfer
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
