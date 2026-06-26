import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure upload directories exist
export const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Saves a base64 encoded file string locally.
 * @param base64String Data URI scheme string (e.g. data:image/png;base64,iVBOR...)
 * @param folder Subfolder name inside uploads (e.g., "thumbnails", "videos", "resources")
 * @returns Relative URL to access the file (e.g. /uploads/thumbnails/abcdef.png)
 */
export const saveBase64File = async (base64String: string, folder: string): Promise<string> => {
  // If it's already a URL, return it (useful for seeds/updates)
  if (base64String.startsWith('http://') || base64String.startsWith('https://') || base64String.startsWith('/uploads/')) {
    return base64String;
  }

  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 input string');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Deduce file extension
    let extension = 'bin';
    if (mimeType.includes('image/png')) extension = 'png';
    else if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) extension = 'jpg';
    else if (mimeType.includes('image/gif')) extension = 'gif';
    else if (mimeType.includes('video/mp4')) extension = 'mp4';
    else if (mimeType.includes('application/pdf')) extension = 'pdf';
    else if (mimeType.includes('text/plain')) extension = 'txt';

    const filename = `${crypto.randomUUID()}.${extension}`;
    const targetFolder = path.join(UPLOADS_DIR, folder);
    ensureDirExists(targetFolder);

    const filepath = path.join(targetFolder, filename);
    await fs.promises.writeFile(filepath, buffer);

    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error('[STORAGE ERROR] Failed to save base64 file:', error);
    throw new Error('Failed to upload file.');
  }
};

/**
 * Deletes a file from the upload directory
 * @param fileUrl Relative URL (e.g. /uploads/thumbnails/abcdef.png)
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!fileUrl.startsWith('/uploads/')) return;
  
  try {
    const relativePath = fileUrl.replace('/uploads/', '');
    const filepath = path.join(UPLOADS_DIR, relativePath);
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
    }
  } catch (error) {
    console.error('[STORAGE ERROR] Failed to delete file:', error);
  }
};
