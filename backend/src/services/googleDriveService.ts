import axios from 'axios';
import { Readable } from 'stream';

export interface GoogleDriveDownloadResult {
  stream: Readable;
  contentType: string;
  contentDisposition: string;
}

export function extractDriveFileId(input: string): string {
  if (!input) return '';
  // Check if it's already an ID (no slashes)
  if (!input.includes('/') && input.length > 10) return input;
  
  // Try to match /file/d/ID/view or ?id=ID
  const matchD = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  const matchId = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  return input;
}

/**
 * Obtiene el flujo binario (Stream) de un archivo en Google Drive de forma pública y segura,
 * junto con su tipo de contenido y cabecera de disposición original.
 * @param fileId El ID del archivo de Google Drive (o la URL completa)
 * @returns Objeto con el flujo, contentType y contentDisposition
 */
export async function downloadFileStream(fileId: string): Promise<GoogleDriveDownloadResult> {
  const extractedId = extractDriveFileId(fileId);
  const url = `https://drive.google.com/uc?export=download&id=${extractedId}`;

  try {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const contentType = (response.headers['content-type'] as string) || 'application/octet-stream';
    const contentDisposition = (response.headers['content-disposition'] as string) || '';

    return {
      stream: response.data,
      contentType,
      contentDisposition,
    };
  } catch (error) {
    console.error(`❌ Google Drive Service: Error al descargar el archivo con ID ${fileId}:`, error);
    throw error;
  }
}
