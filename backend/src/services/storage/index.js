/**
 * Storage service factory
 *
 * This module exports the current storage implementation.
 * To switch from LocalStorage to Cloudinary, simply change the import and export below.
 *
 * Current: LocalStorage (files stored in ./uploads/)
 * Future: CloudinaryStorage (files stored in Cloudinary CDN)
 */

import LocalStorage from './LocalStorage.js';

// Create singleton instance with default configuration
const storage = new LocalStorage({
  baseUrl: process.env.BASE_URL || 'http://localhost:3001',
});

export default storage;

// Also export the class for testing purposes
export { LocalStorage };
