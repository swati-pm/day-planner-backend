import { createClient, Client } from '@libsql/client';

// Create database connection
let db: Client;

export const getDatabase = (): Client => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

// Database migration functions
const runMigrations = async (): Promise<void> => {
  try {
    console.log('Running database migrations...');
    
            // Migration 1: Remove userId column from tasks table if it exists
        try {
          // Check if userId column exists
          const result = await db.execute('PRAGMA table_info(tasks)');
          const columns = result.rows.map((row: any) => row.name);
          
          if (columns.includes('userId')) {
            console.log('Removing userId column from tasks table...');
            
            // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
            // First, create a backup of existing tasks without userId
            await db.execute(`
              CREATE TABLE tasks_backup AS 
              SELECT id, title, description, completed, priority, dueDate, createdAt, updatedAt 
              FROM tasks
            `);
            
            // Drop the original table
            await db.execute('DROP TABLE tasks');
            
            // Recreate the tasks table without userId
            await db.execute(`
              CREATE TABLE tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                completed BOOLEAN NOT NULL DEFAULT 0,
                priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
                dueDate TEXT,
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
              )
            `);
            
            // Restore the data
            await db.execute(`
              INSERT INTO tasks (id, title, description, completed, priority, dueDate, createdAt, updatedAt)
              SELECT id, title, description, completed, priority, dueDate, createdAt, updatedAt 
              FROM tasks_backup
            `);
            
            // Drop the backup table
            await db.execute('DROP TABLE tasks_backup');
            
            console.log('Removed userId column from tasks table');
          }
        } catch (migrationError) {
          console.log('Migration 1 (remove userId column) skipped or already applied:', migrationError);
        }
    
    console.log('Database migrations completed');
  } catch (error) {
    console.error('Migration error:', error);
    // Don't throw - migrations are optional
  }
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    // Get libSQL connection parameters from environment
    const url = process.env.LIBSQL_URL || 'file:data/planner.db';
    const authToken = process.env.LIBSQL_AUTH_TOKEN;

    // Create libSQL client
    db = createClient({
      url,
      authToken: authToken || undefined,
    });

    console.log(`Connected to libSQL database at: ${url}`);
    console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);

    // Enable foreign keys (for local SQLite compatibility)
    if (url.startsWith('file:')) {
      await db.execute('PRAGMA foreign_keys = ON');
    }

    // Create tables
    const createTablesQueries = [
      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        dueDate TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    // Create indexes
    const createIndexesQueries = [
      'CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks(dueDate)'
    ];

    // Execute table creation queries
    for (const query of createTablesQueries) {
      await db.execute(query);
    }

    // Run database migrations for existing tables
    await runMigrations();

    // Execute index creation queries
    for (const query of createIndexesQueries) {
      await db.execute(query);
    }

    console.log('Database tables and indexes created successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Utility function to run database queries
export const runQuery = async (query: string, params: any[] = []): Promise<any> => {
  try {
    const result = await db.execute({ sql: query, args: params });
    return {
      lastInsertRowid: result.lastInsertRowid,
      changes: result.rowsAffected || 0,
      rows: result.rows
    };
  } catch (error) {
    console.error('Error executing query:', query, error);
    throw error;
  }
};

// Utility function to get single row
export const getRow = async (query: string, params: any[] = []): Promise<any> => {
  try {
    const result = await db.execute({ sql: query, args: params });
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error executing query:', query, error);
    throw error;
  }
};

// Utility function to get all rows
export const getAllRows = async (query: string, params: any[] = []): Promise<any[]> => {
  try {
    const result = await db.execute({ sql: query, args: params });
    return result.rows;
  } catch (error) {
    console.error('Error executing query:', query, error);
    throw error;
  }
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    db.close();
    console.log('Database connection closed');
  }
};
