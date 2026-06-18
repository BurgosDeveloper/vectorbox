import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary con las variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Valida que las credenciales de Cloudinary estén configuradas.
 * @returns true si todas las credenciales están presentes
 */
export function validateCloudinaryConfig(): boolean {
  const { cloud_name, api_key, api_secret } = cloudinary.config();

  if (!cloud_name || !api_key || !api_secret) {
    console.error('❌ Cloudinary: Faltan credenciales de configuración.');
    return false;
  }

  console.log('  ✅ Cloudinary: Configuración validada');
  return true;
}

export default cloudinary;
