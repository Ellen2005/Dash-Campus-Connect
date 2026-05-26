const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();
const dirs = [
  'src/app/api/admin/fields',
  'src/app/api/admin/levels',
  'src/app/api/admin/students',
  'src/app/api/communities',
  'src/app/api/auth/registration-fields'
];

dirs.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${fullPath}`);
  }
});

console.log('All directories created successfully');
