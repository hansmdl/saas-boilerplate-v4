const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[copy-generated] Source path does not exist: ${src}`);
    return;
  }
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((child) => {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const root = path.join(__dirname, '..');
const generatedSrc = path.join(root, 'src', 'generated');
const generatedDest = path.join(root, 'dist', 'src', 'generated');

copyRecursiveSync(generatedSrc, generatedDest);
console.log('[copy-generated] Copied Prisma client to dist');
