const { chromium } = require('playwright');
const axios = require('axios');

async function enviarTelegram(mensaje) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(mensaje)}&parse_mode=Markdown`;
  try {
    await axios.get(url);
  } catch (e) {
    console.error("Error enviando a Telegram", e);
  }
}

(async () => {
  // Lanzamos el navegador simulando ser un usuario real
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  const query = "seiko";
  console.log(`Buscando ${query} en Wallapop...`);

  try {
    await page.goto(`https://es.wallapop.com/app/search?keywords=${query}&order_by=newest`, { waitUntil: 'networkidle' });
    
    // Esperamos un poco más por si acaso
    await page.waitForTimeout(5000); 

    // Intentamos localizar el título del primer anuncio
    const firstTitle = page.locator('[class*="ItemCard__title"]').first();
    const firstPrice = page.locator('[class*="ItemCard__price"]').first();

    const titleText = await firstTitle.innerText();
    const priceText = await firstPrice.innerText();
    const link = page.url();

    const aviso = `🚀 *¡Anuncio encontrado!* \n📦 ${titleText} \n💰 ${priceText} \n🔗 [Ver en Wallapop](${link})`;
    
    console.log("¡Éxito! Enviando a Telegram...");
    await enviarTelegram(aviso);

  } catch (error) {
    console.error("Vaya, no pude encontrar el anuncio:", error.message);
    await enviarTelegram("⚠️ El rastreador ha tenido un problema al leer Wallapop. Reintentando en la próxima ejecución.");
  }

  await browser.close();
})();