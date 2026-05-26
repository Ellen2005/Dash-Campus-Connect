#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const baseDir = '.';

// Create directories
const directories = [
  'src/app/api/admin/fields',
  'src/app/api/admin/levels',
  'src/app/api/admin/students',
  'src/app/api/communities',
  'src/app/api/auth/registration-fields'
];

directories.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  }
});

// Create files with content
const files = {
  'src/app/api/admin/fields/route.ts': require('./api-content/admin-fields'),
  'src/app/api/admin/levels/route.ts': require('./api-content/admin-levels'),
  'src/app/api/admin/students/route.ts': require('./api-content/admin-students'),
  'src/app/api/communities/route.ts': require('./api-content/communities'),
  'src/app/api/auth/registration-fields/route.ts': require('./api-content/registration-fields')
};

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(baseDir, filePath);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Created: ${filePath}`);
});

console.log('\n✅ All API files created successfully!');
