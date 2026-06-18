import cloudinary from '../config/cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  bytes?: number;
  format?: string;
}

/**
 * Sube una imagen a Cloudinary en una carpeta específica.
 * @param filePath Ruta local del archivo o stream a subir
 * @param folder Carpeta de destino en Cloudinary (por defecto: 'subliacrilico/products')
 */
export async function uploadImage(
  filePath: string,
  folder: string = 'subliacrilico/products'
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
    });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      bytes: result.bytes,
      format: result.format,
    };
  } catch (error) {
    console.error('❌ Cloudinary: Error al subir imagen:', error);
    throw error;
  }
}

/**
 * Sube un video a Cloudinary en una carpeta específica.
 * @param filePath Ruta local del archivo o stream a subir
 * @param folder Carpeta de destino en Cloudinary (por defecto: 'subliacrilico/products')
 */
export async function uploadVideo(
  filePath: string,
  folder: string = 'subliacrilico/products'
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'video',
    });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      bytes: result.bytes,
      format: result.format,
    };
  } catch (error) {
    console.error('❌ Cloudinary: Error al subir video:', error);
    throw error;
  }
}

/**
 * Elimina un recurso (imagen o video) de Cloudinary.
 * @param publicId ID público del recurso en Cloudinary
 * @param resourceType Tipo de recurso ('image' | 'video')
 */
export async function deleteAsset(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error(`❌ Cloudinary: Error al eliminar recurso (${resourceType}) ${publicId}:`, error);
    throw error;
  }
}
