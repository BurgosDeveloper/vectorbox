import axios from 'axios';

let cachedRate = 45.0;

/**
 * Obtiene la tasa de cambio de USDT a VES desde Binance P2P.
 * Utiliza un fallback si la llamada directa falla.
 */
export const getBinanceRate = async (): Promise<number> => {
  try {
    console.log('[EXCHANGE-RATE] Consultando tasa de cambio en Binance P2P...');
    
    const response = await axios.post(
      'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
      {
        asset: 'USDT',
        fiat: 'VES',
        merchantCheck: false,
        page: 1,
        payTypes: [],
        publisherType: null,
        rows: 1,
        tradeType: 'BUY',
      },
      {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Content-Type': 'application/json',
        },
      }
    );

    const price = response.data?.data?.[0]?.adv?.price;
    if (price) {
      const parsedRate = parseFloat(price);
      if (!isNaN(parsedRate) && parsedRate > 0) {
        cachedRate = parsedRate;
        console.log(`[EXCHANGE-RATE] Tasa obtenida de Binance P2P: ${parsedRate} VES/USDT`);
        return parsedRate;
      }
    }

    throw new Error('Formato de respuesta de Binance P2P inválido o vacío');
  } catch (error: any) {
    console.warn(`[EXCHANGE-RATE] Falló la consulta directa a Binance P2P (${error.message}). Intentando API secundaria de respaldo...`);

    try {
      const fallbackResponse = await axios.get(
        'https://raw.githubusercontent.com/fhedor/dolar-ve/master/dolar.json',
        { timeout: 5000 }
      );

      const data = fallbackResponse.data;
      // Tratar de obtener la tasa Binance, promedio o BCV en ese orden de prioridad
      const rate = data?.binance?.price || data?.promedio?.price || data?.bcv?.price;

      if (rate) {
        const parsedRate = parseFloat(rate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          cachedRate = parsedRate;
          console.log(`[EXCHANGE-RATE] Tasa obtenida del fallback: ${parsedRate} VES/USDT`);
          return parsedRate;
        }
      }

      throw new Error('Formato de respuesta del fallback inválido o vacío');
    } catch (fallbackError: any) {
      console.error(`[EXCHANGE-RATE] El fallback también falló (${fallbackError.message}). Usando tasa en caché: ${cachedRate} VES/USDT`);
      return cachedRate;
    }
  }
};
