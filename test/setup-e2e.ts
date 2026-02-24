import { execSync } from 'child_process';

export default async () => {
  console.log('\n🔧 Setting up E2E test environment...\n');
  
  try {
    // Generate Prisma Client first
    console.log('📦 Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push schema to database (works for both dev and CI)
    console.log('📦 Pushing Prisma schema to database...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit' });
    
    console.log('✅ E2E setup complete!\n');
  } catch (error) {
    console.error('❌ E2E setup failed:', error);
    process.exit(1);
  }
};
