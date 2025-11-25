import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.CUSTOMER_APP_URL || 'http://localhost:5173/customer/menu/table';
const NUM_TABLES = parseInt(process.env.NUM_TABLES || '20', 10);
const OUTPUT_DIR = path.join(__dirname, 'qr-codes');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 Generating QR Codes for Restaurant Tables\n');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`🪑 Number of Tables: ${NUM_TABLES}`);
console.log(`📁 Output Directory: ${OUTPUT_DIR}\n`);

// Generate QR codes for all tables
async function generateQRCodes() {
  const promises = [];

  for (let tableNum = 1; tableNum <= NUM_TABLES; tableNum++) {
    const url = `${BASE_URL}/${tableNum}`;
    const filename = path.join(OUTPUT_DIR, `table-${tableNum}.png`);

    const promise = QRCode.toFile(filename, url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High error correction for damaged codes
    }).then(() => {
      console.log(`✓ Generated QR code for Table ${tableNum}`);
      return tableNum;
    }).catch((err) => {
      console.error(`✗ Failed to generate QR for Table ${tableNum}:`, err.message);
      return null;
    });

    promises.push(promise);
  }

  const results = await Promise.all(promises);
  const successful = results.filter(r => r !== null).length;

  console.log(`\n✨ Successfully generated ${successful}/${NUM_TABLES} QR codes`);
  console.log(`📂 QR codes saved to: ${OUTPUT_DIR}`);
  console.log('\n📋 Next steps:');
  console.log('   1. Print the QR code images');
  console.log('   2. Laminate them for durability');
  console.log('   3. Place them on corresponding tables');
  console.log('   4. Test scanning with a phone camera\n');
}

// Generate HTML preview page
function generatePreviewHTML() {
  const htmlPath = path.join(OUTPUT_DIR, 'preview.html');
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuickServe QR Codes - Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2d3748;
      margin-bottom: 10px;
      font-size: 32px;
    }
    .info {
      color: #718096;
      margin-bottom: 30px;
      font-size: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 30px;
      margin-top: 30px;
    }
    .qr-card {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      transition: all 0.3s ease;
      page-break-inside: avoid;
    }
    .qr-card:hover {
      border-color: #4299e1;
      box-shadow: 0 4px 12px rgba(66, 153, 225, 0.2);
      transform: translateY(-2px);
    }
    .qr-card img {
      width: 100%;
      max-width: 200px;
      height: auto;
      border-radius: 8px;
      margin: 0 auto 15px;
      display: block;
    }
    .table-label {
      font-size: 24px;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 8px;
    }
    .table-url {
      font-size: 12px;
      color: #a0aec0;
      word-break: break-all;
      font-family: 'Courier New', monospace;
    }
    .print-btn {
      background: #4299e1;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin: 20px 0;
      transition: background 0.3s;
    }
    .print-btn:hover {
      background: #3182ce;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .print-btn, .info { display: none; }
      .qr-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 QuickServe QR Codes</h1>
    <p class="info">
      Generated ${NUM_TABLES} QR codes for table ordering<br>
      Base URL: ${BASE_URL}
    </p>
    <button class="print-btn" onclick="window.print()">🖨️ Print All QR Codes</button>
    <div class="grid">
`;

  for (let i = 1; i <= NUM_TABLES; i++) {
    const url = `${BASE_URL}/${i}`;
    html += `
      <div class="qr-card">
        <img src="table-${i}.png" alt="Table ${i} QR Code">
        <div class="table-label">Table ${i}</div>
        <div class="table-url">${url}</div>
      </div>
    `;
  }

  html += `
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, html);
  console.log(`📄 Preview HTML created: ${htmlPath}`);
}

// Run the generator
generateQRCodes()
  .then(() => {
    generatePreviewHTML();
    console.log('🎉 All done! Open preview.html in your browser to see all QR codes.\n');
  })
  .catch((error) => {
    console.error('❌ Error generating QR codes:', error);
    process.exit(1);
  });
