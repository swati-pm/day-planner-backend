import { v4 as uuidv4 } from 'uuid';
import { runQuery, getRow, getAllRows } from '../database/init';
import { User, CreateUserRequest, UpdateUserRequest } from '../types';

const mapRowToUser = (row: any): User => {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture,
    verified: Boolean(row.verified),
    googleId: row.googleId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
};

export const createUser = async (userData: CreateUserRequest): Promise<User> => {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const query = `
    INSERT INTO users (id, email, name, picture, verified, googleId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    id,
    userData.email,
    userData.name,
    userData.picture || null,
    userData.verified ? 1 : 0,
    userData.googleId || null,
    now,
    now
  ];

  try {
    await runQuery(query, params);
    
    return {
      id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      verified: userData.verified || false,
      googleId: userData.googleId,
      createdAt: now,
      updatedAt: now
    };
  } catch (error) {
    throw error;
  }
};

export const findUserById = async (id: string): Promise<User | null> => {
  const query = 'SELECT * FROM users WHERE id = ?';
  const row = await getRow(query, [id]);
  
  if (!row) {
    return null;
  }
  
  return mapRowToUser(row);
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const query = 'SELECT * FROM users WHERE email = ?';
  const row = await getRow(query, [email]);
  
  if (!row) {
    return null;
  }
  
  return mapRowToUser(row);
};

export const findUserByGoogleId = async (googleId: string): Promise<User | null> => {
  const query = 'SELECT * FROM users WHERE googleId = ?';
  const row = await getRow(query, [googleId]);
  
  if (!row) {
    return null;
  }
  
  return mapRowToUser(row);
};

export const findOrCreateUserByGoogle = async (googleProfile: {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified?: boolean;
}): Promise<User> => {
  // First try to find by Google ID
  let user = await findUserByGoogleId(googleProfile.id);
  
  if (user) {
    return user;
  }
  
  // Then try to find by email
  user = await findUserByEmail(googleProfile.email);
  
  if (user) {
    // Update with Google ID if user exists but doesn't have Google ID
    if (!user.googleId) {
      user = await updateUser(user.id, { 
        googleId: googleProfile.id,
        picture: googleProfile.picture,
        verified: googleProfile.verified
      });
      return user!;
    }
    return user;
  }
  
  // Create new user
  return createUser({
    email: googleProfile.email,
    name: googleProfile.name,
    picture: googleProfile.picture,
    verified: googleProfile.verified,
    googleId: googleProfile.id
  });
};

export const updateUser = async (id: string, updateData: UpdateUserRequest): Promise<User | null> => {
  const existingUser = await findUserById(id);
  if (!existingUser) {
    return null;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (updateData.name !== undefined) {
    updates.push('name = ?');
    params.push(updateData.name);
  }

  if (updateData.picture !== undefined) {
    updates.push('picture = ?');
    params.push(updateData.picture);
  }

  if (updateData.verified !== undefined) {
    updates.push('verified = ?');
    params.push(updateData.verified ? 1 : 0);
  }

  if (updates.length === 0) {
    return existingUser;
  }

  updates.push('updatedAt = ?');
  params.push(new Date().toISOString());
  params.push(id);

  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  await runQuery(query, params);

  return findUserById(id);
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const query = 'DELETE FROM users WHERE id = ?';
  const result = await runQuery(query, [id]);
  return (result.changes || 0) > 0;
};

export const getAllUsers = async (): Promise<User[]> => {
  const query = 'SELECT * FROM users ORDER BY createdAt DESC';
  const rows = await getAllRows(query, []);
  return rows.map(row => mapRowToUser(row));
};
