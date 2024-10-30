const { mkdir } = require('fs/promises');
const { existsSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
}

async function setup() {
  try {
    const dataDir = join(process.cwd(), 'data');
    const uploadsDir = join(process.cwd(), 'uploads');

    // Create directories if they don't exist
    await ensureDir(dataDir);
    await ensureDir(uploadsDir);

    // Run initialization scripts
    console.log('\nInitializing database and creating admin account...');
    execSync('npm run init', { stdio: 'inherit' });

    console.log('\nSetup completed successfully.');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setup();