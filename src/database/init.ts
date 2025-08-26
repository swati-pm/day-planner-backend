import { createClient, Client } from '@libsql/client';

// Create database connection
let db: Client;

export const getDatabase = (): Client => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
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
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        googleId TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        verified BOOLEAN NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        dueDate TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    // Create indexes
    const createIndexesQueries = [
      'CREATE INDEX IF NOT EXISTS idx_users_googleId ON users(googleId)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_userId ON tasks(userId)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks(dueDate)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(userId, completed)'
    ];

    // Execute table creation queries
    for (const query of createTablesQueries) {
      await db.execute(query);
    }

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
