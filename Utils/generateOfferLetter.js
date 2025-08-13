const fs = require('fs');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');

const templatePath = path.resolve(__dirname, '../templates/offerLetter.ejs');

async function generateOfferLetterPDF(data, outputPath) {
  try {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const finalHtml = ejs.render(templateHtml, data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(finalHtml, {
      waitUntil: ['load', 'domcontentloaded', 'networkidle0']
    });

    await page.pdf({
      path: outputPath,
      format: 'a4',
      landscape: true,
      printBackground: true
    });

    await browser.close();
    console.log(`✅ PDF generated at: ${outputPath}`);
  } catch (err) {
    console.error('❌ Failed to generate certificate PDF:', err);
    throw err; // Let calling function handle the error
  }
}

module.exports = generateOfferLetterPDF;
