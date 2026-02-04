import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Local file storage implementation.
 * Stores files in the uploads directory and serves them via Express static middleware.
 */
class LocalStorage {
  constructor(options = {}) {
    this.uploadDir = options.uploadDir || path.join(process.cwd(), 'uploads');
    this.baseUrl = options.baseUrl || process.env.BASE_URL || 'http://localhost:3001';
  }

  /**
   * Ensure the upload directory exists
   */
  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload a file to local storage
   * @param {Object} file - Multer file object
   * @returns {Promise<{url: string, publicId: string}>}
   */
  async upload(file) {
    await this.ensureUploadDir();

    const ext = path.extname(file.originalname) || '.jpg';
    const publicId = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, publicId);

    await fs.writeFile(filePath, file.buffer);

    return {
      url: this.getUrl(publicId),
      publicId,
    };
  }

  /**
   * Delete a file from local storage
   * @param {string} publicId - The file's public ID (filename)
   * @returns {Promise<void>}
   */
  async delete(publicId) {
    const filePath = path.join(this.uploadDir, publicId);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, which is fine for delete operations
    }
  }

  /**
   * Get the URL for a file
   * @param {string} publicId - The file's public ID (filename)
   * @returns {string}
   */
  getUrl(publicId) {
    return `${this.baseUrl}/uploads/${publicId}`;
  }

  /**
   * Check if a file exists
   * @param {string} publicId - The file's public ID (filename)
   * @returns {Promise<boolean>}
   */
  async exists(publicId) {
    const filePath = path.join(this.uploadDir, publicId);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export default LocalStorage;
