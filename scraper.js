const { chromium } = require('playwright');
const axios = require('axios');

// Función para enviar mensajes a Telegram con reporte de errores
async function enviarTelegram(mensaje) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  try {
    const response = await axios.post(url, {
      chat_id: chatId,
      text: mensaje,
      parse_mode: 'Markdown'
    });
    console.log("Respuesta de Telegram:", response.data.ok ? "¡Enviado con éxito!" : "Error en el envío");
  } catch (e) {
    // Si hay un error con el Token o el Chat ID, lo veremos aquí
    console.error("Error detallado de Telegram:", e.response ? e.response.data : e.message);
  }
}

(async () => {
  // Configuramos el navegador para que parezca un usuario real
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  const query = "seiko";
  console.log(`Buscando "${query}" en Wallapop...`);

  try {
    // Vamos a Wallapop ordenando por los más nuevos
    await page.goto(`https://es.wallapop.com/app/search?keywords=${query}&order_by=newest`, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Esperamos 5 segundos extra para que carguen las imágenes y títulos
    await page.waitForTimeout(5000); 

    // Localizamos el primer título y precio de la lista
    const firstTitle = page.locator('[class*="ItemCard__title"]').first();
    const firstPrice = page.locator('[class*="ItemCard__price"]').first();

    const titleText = await firstTitle.innerText();
    const priceText = await firstPrice.innerText();
    const link = page.url();

    // Montamos el mensaje
    const aviso = `🚀 *¡Anuncio encontrado!* \n📦 ${titleText} \n💰 ${priceText} \n🔗 [Ver en Wallapop](${link})`;
    
    console.log(`Encontrado: ${titleText} - ${priceText}`);
    await enviarTelegram(aviso);

  } catch (error) {
    console.error("No se pudo extraer el anuncio:", error.message);
    // Opcional: avisar a Telegram si el scraper falla
    // await enviarTelegram("⚠️ Wallapop ha bloqueado el acceso o no hay anuncios nuevos.");
  }

  await browser.close();
})();