
import { MediaItem } from '../types';
import { logger } from './loggerService';

// Mock Media Database
let MEDIA_LIBRARY: MediaItem[] = [
  {
    id: 'media-1',
    url: 'https://picsum.photos/400/400?random=1',
    name: 'Ashwagandha.jpg',
    type: 'image',
    size: 250,
    uploadedBy: 'admin-1',
    status: 'approved',
    createdAt: new Date().toISOString(),
    metadata: { title: 'Ashwagandha Product', alt: 'Herbal root powder' }
  },
  {
    id: 'media-2',
    url: 'https://picsum.photos/400/400?random=2',
    name: 'Shilajit.jpg',
    type: 'image',
    size: 500,
    uploadedBy: 'admin-1',
    status: 'approved',
    createdAt: new Date().toISOString(),
    metadata: { title: 'Shilajit Resin', alt: 'Black resin' }
  }
];

// Helper: Compress Image (Rule H: Image compression, Auto-resize)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If not an image, read as normal data URL
    if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Auto-resize rule
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to 70% quality (Rule H)
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const mediaService = {
  getAllMedia: (): MediaItem[] => {
    return MEDIA_LIBRARY;
  },
  
  getUserMedia: (userId: string): MediaItem[] => {
    return MEDIA_LIBRARY.filter(m => m.uploadedBy === userId);
  },

  uploadFile: async (file: File, uploadedBy: string, isAdmin = false): Promise<MediaItem> => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const compressedDataUrl = await compressImage(file);
        const newItem: MediaItem = {
            id: `media-${Date.now()}`,
            url: compressedDataUrl,
            name: file.name,
            type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'document',
            size: Math.round(file.size / 1024),
            uploadedBy,
            status: isAdmin ? 'approved' : 'pending',
            createdAt: new Date().toISOString(),
            metadata: { title: file.name, alt: '', tags: [] }
        };
        MEDIA_LIBRARY.unshift(newItem);
        logger.log('INFO', `Media Uploaded: ${file.name}`, { userId: uploadedBy });
        return newItem;
    } catch (e) {
        logger.log('ERROR', 'Image Compression Failed', { error: e });
        throw new Error('Image processing failed');
    }
  },

  replaceFile: async (id: string, newFile: File, userId: string): Promise<MediaItem> => {
    const idx = MEDIA_LIBRARY.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Media not found');

    const oldItem = MEDIA_LIBRARY[idx];
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    const compressedDataUrl = await compressImage(newFile);
            
    const versions = oldItem.versions || [];
    versions.push({ url: oldItem.url, createdAt: oldItem.createdAt, size: oldItem.size });
    
    const updatedItem: MediaItem = {
        ...oldItem,
        url: compressedDataUrl,
        name: newFile.name,
        size: Math.round(newFile.size / 1024),
        createdAt: new Date().toISOString(), // Update timestamp
        versions,
        uploadedBy: userId // Last modified by
    };
    
    MEDIA_LIBRARY[idx] = updatedItem;
    logger.log('INFO', `Media Replaced: ${oldItem.name}`, { userId });
    return updatedItem;
  },

  updateMetadata: async (id: string, metadata: MediaItem['metadata']): Promise<void> => {
    const item = MEDIA_LIBRARY.find(m => m.id === id);
    if (item) {
      item.metadata = { ...item.metadata, ...metadata };
      logger.log('INFO', 'Media Metadata Updated', { requestData: { id, metadata } });
    }
  },
  
  updateStatus: async (id: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> => {
      const item = MEDIA_LIBRARY.find(m => m.id === id);
      if (item) {
          item.status = status;
          logger.log('INFO', `Media Status Updated: ${status}`, { requestData: { id, status } });
      }
  },

  deleteMedia: async (id: string): Promise<void> => {
    MEDIA_LIBRARY = MEDIA_LIBRARY.filter(m => m.id !== id);
    logger.log('WARNING', 'Media Deleted', { requestData: { id } });
  }
};
