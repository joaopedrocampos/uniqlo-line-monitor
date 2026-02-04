import fs from 'fs/promises';
import path from 'path';
import { LocalStorage } from '../src/services/storage/index.js';

describe('LocalStorage', () => {
  let storage;
  const testUploadDir = path.join(process.cwd(), 'test-uploads');

  beforeAll(async () => {
    storage = new LocalStorage({
      uploadDir: testUploadDir,
      baseUrl: 'http://test.local',
    });
  });

  afterAll(async () => {
    // Clean up test upload directory
    try {
      const files = await fs.readdir(testUploadDir);
      for (const file of files) {
        await fs.unlink(path.join(testUploadDir, file));
      }
      await fs.rmdir(testUploadDir);
    } catch (error) {
      // Directory might not exist, which is fine
    }
  });

  describe('upload', () => {
    it('should upload a file and return url and publicId', async () => {
      const mockFile = {
        buffer: Buffer.from('test image content'),
        originalname: 'test-image.jpg',
      };

      const result = await storage.upload(mockFile);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('publicId');
      expect(result.url).toContain('http://test.local/uploads/');
      expect(result.publicId).toMatch(/\.jpg$/);
    });

    it('should create the upload directory if it does not exist', async () => {
      const customDir = path.join(process.cwd(), 'test-uploads-new');
      const customStorage = new LocalStorage({
        uploadDir: customDir,
        baseUrl: 'http://test.local',
      });

      const mockFile = {
        buffer: Buffer.from('test content'),
        originalname: 'test.png',
      };

      await customStorage.upload(mockFile);

      const exists = await fs.access(customDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Cleanup
      const files = await fs.readdir(customDir);
      for (const file of files) {
        await fs.unlink(path.join(customDir, file));
      }
      await fs.rmdir(customDir);
    });

    it('should handle files without extensions', async () => {
      const mockFile = {
        buffer: Buffer.from('test content'),
        originalname: 'noextension',
      };

      const result = await storage.upload(mockFile);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('publicId');
    });
  });

  describe('delete', () => {
    it('should delete an existing file', async () => {
      // First upload a file
      const mockFile = {
        buffer: Buffer.from('to be deleted'),
        originalname: 'delete-me.jpg',
      };

      const { publicId } = await storage.upload(mockFile);

      // Verify it exists
      const existsBefore = await storage.exists(publicId);
      expect(existsBefore).toBe(true);

      // Delete it
      await storage.delete(publicId);

      // Verify it's gone
      const existsAfter = await storage.exists(publicId);
      expect(existsAfter).toBe(false);
    });

    it('should not throw when deleting a non-existent file', async () => {
      await expect(storage.delete('non-existent-file.jpg')).resolves.not.toThrow();
    });
  });

  describe('getUrl', () => {
    it('should return the correct URL for a publicId', () => {
      const publicId = 'test-file-123.jpg';
      const url = storage.getUrl(publicId);

      expect(url).toBe('http://test.local/uploads/test-file-123.jpg');
    });
  });

  describe('exists', () => {
    it('should return true for existing files', async () => {
      const mockFile = {
        buffer: Buffer.from('exists test'),
        originalname: 'exists.jpg',
      };

      const { publicId } = await storage.upload(mockFile);
      const exists = await storage.exists(publicId);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      const exists = await storage.exists('definitely-not-here.jpg');
      expect(exists).toBe(false);
    });
  });
});
