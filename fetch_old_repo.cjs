const fs = require('fs');
const path = require('path');
const https = require('https');

const commitSha = 'bc33b5a330bbc945e77e6734f7268ef307a81918';
const baseUrl = `https://raw.githubusercontent.com/softwarelab7/Gestiion/${commitSha}/`;

const filesToFetch = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'index.html',
  'eslint.config.js',
  'src/App.css',
  'src/App.tsx',
  'src/db.ts',
  'src/index.css',
  'src/main.tsx',
  'src/vite-env.d.ts',
  'src/components/DashboardStats.tsx',
  'src/components/DataTable.tsx',
  'src/components/FilterComponents.tsx',
  'src/components/ScrollToTop.tsx',
  'src/components/UploadZone.tsx',
  'src/hooks/useDebounce.ts',
  'src/workers/excelWorker.ts'
];

function downloadFile(filePath) {
  return new Promise((resolve, reject) => {
    const url = baseUrl + filePath;
    const dest = path.join(__dirname, filePath);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Saved ${filePath}`);
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${filePath}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    for (const file of filesToFetch) {
      await downloadFile(file);
    }
    console.log('All files downloaded successfully.');
  } catch (err) {
    console.error('Error downloading files:', err);
  }
}

main();
