import { execSync } from 'child_process';

export default async () => {
  console.log('\n🔧 Setting up E2E test environment...\n');
  
  try {
    // Run Prisma migrations
    console.log('📦 Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('✅ E2E setup complete!\n');
  } catch (error) {
    console.error('❌ E2E setup failed:', error);
    process.exit(1);
  }
};
