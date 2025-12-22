const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4322/hadith');
  await page.waitForTimeout(3000); // Wait for Mermaid to render
  await page.screenshot({ path: '/Users/zerbasta/mki/hadith-screenshot.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved to /Users/zerbasta/mki/hadith-screenshot.png');
})();
