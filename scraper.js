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
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Ejemplo: Búsqueda de "Seiko" en Wallapop
  const query = "seiko";
  await page.goto(`https://es.wallapop.com/app/search?keywords=${query}&filters_source=search_box&order_by=newest`);
  
  // Esperamos a que carguen los productos
  await page.waitForTimeout(5000); 

  // Extraemos el primer producto (el más reciente)
  const product = await page.locator('header').first(); 
  const title = await page.locator('.ItemCard__title').first().innerText();
  const price = await page.locator('.ItemCard__price').first().innerText();
  const link = await page.url();

  const aviso = `🚀 *¡Nuevo anuncio en Wallapop!* \n📦 ${title} \n💰 ${price} \n🔗 [Ver anuncio](${link})`;
  
  console.log("Enviando aviso...");
  await enviarTelegram(aviso);

  await browser.close();
})();