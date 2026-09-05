import { databaseService } from './services/database.js';

/**
 * Initialize the database with all required tables
 */
async function initializeDatabase() {
  console.log('🔧 Initializing PhishYou database...\n');
  
  try {
    await databaseService.initialize();
    console.log('✅ Database initialized successfully!');
    console.log('\nDatabase location: ./backend/data/phishyou.db');
    console.log('\nTables created:');
    console.log('  - campaigns');
    console.log('  - targets');
    console.log('  - email_interactions');
    console.log('  - campaign_events');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };
