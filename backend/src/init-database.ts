import { pathToFileURL } from 'url';
import { databaseService } from './services/database.js';

/**
 * Initialize the PhishYou database with all required collections.
 * Run directly via `npm run init-db`.
 */
export async function initializeDatabase(): Promise<void> {
  console.log('🔧 Initializing PhishYou database...\n');
  await databaseService.initialize();

  const users = await databaseService.countUsers();
  console.log('✅ Database initialized successfully!');
  console.log(`\nDatabase location: ${databaseService.location}`);
  console.log('\nCollections ready:');
  console.log('  - users');
  console.log('  - campaigns');
  console.log('  - targets');
  console.log('  - email_interactions');
  console.log('  - campaign_events');
  console.log(`\nExisting user accounts: ${users}`);
}

async function main(): Promise<void> {
  try {
    await initializeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run only when executed directly (cross-platform, unlike a raw file:// compare).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
