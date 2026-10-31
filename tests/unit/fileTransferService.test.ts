import { describe, it, expect, vi } from 'vitest';
import { FileTransferService } from '../../src/services/fileTransferService';
import { FileMetadata } from '../../src/signaling/types';

describe('FileTransferService', () => {
  it('prepares file and marks status as pending', async () => {
    const sendDataMock = vi.fn().mockReturnValue(true);
    const onStateChangeMock = vi.fn();

    const service = new FileTransferService(sendDataMock, onStateChangeMock);

    const testBlob = new Blob(['Hello ShareIt World WebRTC file transfer'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

    const fileId = await service.prepareAndSendFile(testFile, 'peer-1', 'Alice');

    expect(fileId).toBeDefined();
    expect(sendDataMock).toHaveBeenCalledTimes(1);

    const transfers = service.getTransfers();
    expect(transfers.length).toBe(1);
    expect(transfers[0].name).toBe('test.txt');
    expect(transfers[0].status).toBe('pending');
    expect(transfers[0].isSender).toBe(true);
  });

  it('receives incoming file offer in pending state without automatic acceptance', () => {
    const sendDataMock = vi.fn().mockReturnValue(true);
    const onStateChangeMock = vi.fn();

    const service = new FileTransferService(sendDataMock, onStateChangeMock);

    const metadata: FileMetadata = {
      fileId: 'file-123',
      name: 'architecture.pdf',
      size: 1048576,
      mimeType: 'application/pdf',
      totalChunks: 64,
      senderPeerId: 'peer-2',
      senderName: 'Bob'
    };

    service.handleFileOffer(metadata);

    const transfers = service.getTransfers();
    expect(transfers.length).toBe(1);
    expect(transfers[0].status).toBe('pending');
    expect(transfers[0].isSender).toBe(false);
    expect(transfers[0].name).toBe('architecture.pdf');
  });

  it('allows user to reject incoming file transfer', () => {
    const sendDataMock = vi.fn().mockReturnValue(true);
    const onStateChangeMock = vi.fn();

    const service = new FileTransferService(sendDataMock, onStateChangeMock);

    const metadata: FileMetadata = {
      fileId: 'file-456',
      name: 'large_archive.zip',
      size: 50000000,
      mimeType: 'application/zip',
      totalChunks: 3000,
      senderPeerId: 'peer-2',
      senderName: 'Bob'
    };

    service.handleFileOffer(metadata);
    service.rejectTransfer('file-456');

    const transfers = service.getTransfers();
    expect(transfers[0].status).toBe('rejected');
    expect(sendDataMock).toHaveBeenCalledWith(
      expect.stringContaining('"accepted":false'),
      'peer-2'
    );
  });
});
