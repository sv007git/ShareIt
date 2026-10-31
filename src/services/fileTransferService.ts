/**
 * Chunked Peer-to-Peer File Transfer Service for ShareIt
 * Efficiently slices and transmits files over WebRTC DataChannel (or signaling fallback)
 * with explicit user Accept/Reject verification, progress calculation, and cancellation.
 */

import { FileMetadata, FileTransferState } from '../signaling/types';
import { formatBytes } from '../utils/formatters';

const CHUNK_SIZE = 16384; // 16 KB chunks for high reliability and compatibility

export class FileTransferService {
  private activeTransfers: Map<string, FileTransferState> = new Map();
  private receivedChunks: Map<string, ArrayBuffer[]> = new Map();
  private sendDataFn: (data: string | ArrayBuffer, targetPeerId?: string) => boolean;
  private onStateChangeCallback: (transfers: FileTransferState[]) => void;
  private currentAborts: Map<string, boolean> = new Map();

  constructor(
    sendDataFn: (data: string | ArrayBuffer, targetPeerId?: string) => boolean,
    onStateChange: (transfers: FileTransferState[]) => void
  ) {
    this.sendDataFn = sendDataFn;
    this.onStateChangeCallback = onStateChange;
  }

  private notify() {
    this.onStateChangeCallback(Array.from(this.activeTransfers.values()));
  }

  /**
   * Initiate file transfer offer to a target peer or all peers in room
   */
  public async prepareAndSendFile(
    file: File,
    senderPeerId: string,
    senderName: string,
    targetPeerId?: string
  ): Promise<string> {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    const metadata: FileMetadata = {
      fileId,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      totalChunks,
      senderPeerId,
      senderName
    };

    const state: FileTransferState = {
      fileId,
      name: file.name,
      size: file.size,
      mimeType: metadata.mimeType,
      progress: 0,
      speed: 'Waiting for acceptance...',
      status: 'pending',
      isSender: true,
      senderPeerId,
      senderName
    };

    this.activeTransfers.set(fileId, state);
    this.notify();

    // Send metadata announcement to peers
    const message = JSON.stringify({
      type: 'file-offer',
      targetPeerId,
      metadata
    });

    this.sendDataFn(message, targetPeerId);

    // Save file reference for when peer accepts
    (window as any)[`__pending_file_${fileId}`] = file;

    return fileId;
  }

  /**
   * Handle incoming file offer from remote peer
   */
  public handleFileOffer(metadata: FileMetadata): void {
    const state: FileTransferState = {
      fileId: metadata.fileId,
      name: metadata.name,
      size: metadata.size,
      mimeType: metadata.mimeType,
      progress: 0,
      speed: '0 KB/s',
      status: 'pending', // Do NOT automatically accept incoming files
      isSender: false,
      senderPeerId: metadata.senderPeerId,
      senderName: metadata.senderName
    };

    this.activeTransfers.set(metadata.fileId, state);
    this.receivedChunks.set(metadata.fileId, new Array(metadata.totalChunks));
    this.notify();
  }

  /**
   * User explicitly accepts incoming file
   */
  public acceptTransfer(fileId: string): void {
    const transfer = this.activeTransfers.get(fileId);
    if (!transfer || transfer.status !== 'pending') return;

    transfer.status = 'transferring';
    this.notify();

    const responseMsg = JSON.stringify({
      type: 'file-response',
      fileId,
      accepted: true,
      targetPeerId: transfer.senderPeerId
    });

    this.sendDataFn(responseMsg, transfer.senderPeerId);
  }

  /**
   * User explicitly rejects incoming file
   */
  public rejectTransfer(fileId: string): void {
    const transfer = this.activeTransfers.get(fileId);
    if (!transfer) return;

    transfer.status = 'rejected';
    this.notify();

    const responseMsg = JSON.stringify({
      type: 'file-response',
      fileId,
      accepted: false,
      targetPeerId: transfer.senderPeerId
    });

    this.sendDataFn(responseMsg, transfer.senderPeerId);
  }

  /**
   * Handle response from receiver (accepted or rejected)
   */
  public handleFileResponse(fileId: string, accepted: boolean, responderPeerId: string): void {
    const transfer = this.activeTransfers.get(fileId);
    if (!transfer) return;

    if (!accepted) {
      transfer.status = 'rejected';
      transfer.speed = 'Rejected by recipient';
      this.notify();
      delete (window as any)[`__pending_file_${fileId}`];
      return;
    }

    const file = (window as any)[`__pending_file_${fileId}`] as File;
    if (!file) return;

    transfer.status = 'transferring';
    this.notify();

    // Begin chunked transmission
    this.transmitFileChunks(file, fileId, responderPeerId);
  }

  /**
   * Send chunks sequentially with backpressure handling
   */
  private async transmitFileChunks(file: File, fileId: string, targetPeerId?: string): Promise<void> {
    const transfer = this.activeTransfers.get(fileId);
    if (!transfer) return;

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let chunkIndex = 0;
    const startTime = Date.now();
    let bytesSent = 0;

    const readChunk = (start: number, end: number): Promise<ArrayBuffer> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file.slice(start, end));
      });
    };

    while (chunkIndex < totalChunks) {
      if (this.currentAborts.get(fileId)) {
        transfer.status = 'cancelled';
        this.notify();
        return;
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkData = await readChunk(start, end);

      // Packet header: 8 bytes fileId prefix, 4 bytes chunkIndex, followed by payload
      const headerMsg = JSON.stringify({
        type: 'file-chunk-meta',
        fileId,
        chunkIndex,
        totalChunks
      });

      // Send header then raw chunk
      this.sendDataFn(headerMsg, targetPeerId);
      this.sendDataFn(chunkData, targetPeerId);

      bytesSent += chunkData.byteLength;
      chunkIndex++;

      // Calculate progress and transfer rate
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const rate = elapsedSeconds > 0 ? bytesSent / elapsedSeconds : 0;
      transfer.progress = Math.round((chunkIndex / totalChunks) * 100);
      transfer.speed = `${formatBytes(rate)}/s`;

      // Batch state update every 10 chunks or on final chunk
      if (chunkIndex % 10 === 0 || chunkIndex === totalChunks) {
        this.notify();
      }

      // Small throttle to avoid choking the WebRTC buffer
      await new Promise(r => setTimeout(r, 8));
    }

    transfer.status = 'completed';
    transfer.progress = 100;
    transfer.speed = 'Finished';
    delete (window as any)[`__pending_file_${fileId}`];
    this.notify();
  }

  /**
   * Handle incoming raw chunk metadata
   */
  private lastChunkMeta: { fileId: string; chunkIndex: number; totalChunks: number } | null = null;

  public handleIncomingMessage(data: any): void {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'file-offer') {
          this.handleFileOffer(parsed.metadata);
        } else if (parsed.type === 'file-response') {
          this.handleFileResponse(parsed.fileId, parsed.accepted, parsed.targetPeerId);
        } else if (parsed.type === 'file-chunk-meta') {
          this.lastChunkMeta = parsed;
        } else if (parsed.type === 'file-cancelled') {
          const t = this.activeTransfers.get(parsed.fileId);
          if (t) {
            t.status = 'cancelled';
            this.notify();
          }
        }
      } catch (_) {}
    } else if (data instanceof ArrayBuffer && this.lastChunkMeta) {
      // Incoming binary chunk
      const { fileId, chunkIndex, totalChunks } = this.lastChunkMeta;
      const transfer = this.activeTransfers.get(fileId);
      const chunks = this.receivedChunks.get(fileId);

      if (transfer && chunks) {
        chunks[chunkIndex] = data;
        const receivedCount = chunks.filter(Boolean).length;
        transfer.progress = Math.round((receivedCount / totalChunks) * 100);

        if (receivedCount % 10 === 0 || receivedCount === totalChunks) {
          this.notify();
        }

        if (receivedCount === totalChunks) {
          // All chunks received, assemble blob
          const blob = new Blob(chunks, { type: transfer.mimeType });
          transfer.blobUrl = URL.createObjectURL(blob);
          transfer.status = 'completed';
          transfer.progress = 100;
          transfer.speed = 'Ready to download';
          this.notify();
        }
      }
    }
  }

  /**
   * Cancel ongoing transfer
   */
  public cancelTransfer(fileId: string): void {
    this.currentAborts.set(fileId, true);
    const transfer = this.activeTransfers.get(fileId);
    if (transfer) {
      transfer.status = 'cancelled';
      this.notify();
      this.sendDataFn(JSON.stringify({ type: 'file-cancelled', fileId }));
    }
  }

  public getTransfers(): FileTransferState[] {
    return Array.from(this.activeTransfers.values());
  }
}
