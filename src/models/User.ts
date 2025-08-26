import { v4 as uuidv4 } from 'uuid';
import { runQuery, getRow, getAllRows } from '../database/init';

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  verified?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  picture?: string;
  verified?: boolean;
}

const mapRowToUser = (row: any): User => {
  return {
    id: row.id,
    googleId: row.googleId,
    email: row.email,
    name: row.name,
    picture: row.picture,
    verified: Boolean(row.verified),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
};

export const createUser = async (userData: CreateUserRequest): Promise<User> => {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const query = `
    INSERT INTO users (id, googleId, email, name, picture, verified, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    id,
    userData.googleId,
    userData.email,
    userData.name,
    userData.picture || null,
    userData.verified ? 1 : 0,
    now,
    now
  ];

  try {
    await runQuery(query, params);
    
    return {
      id,
      googleId: userData.googleId,
      email: userData.email,
      name: userData.name,
      picture: userData.picture || null,
      verified: userData.verified || false,
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

export const findUserByGoogleId = async (googleId: string): Promise<User | null> => {
  const query = 'SELECT * FROM users WHERE googleId = ?';
  const row = await getRow(query, [googleId]);
  
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

export const findOrCreateUserByGoogle = async (googleProfile: {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified?: boolean;
}): Promise<User> => {
  // First try to find existing user by Google ID
  let user = await findUserByGoogleId(googleProfile.id);
  
  if (user) {
    // Update user info in case it changed
    const updateData: UpdateUserRequest = {
      name: googleProfile.name,
      picture: googleProfile.picture,
      verified: googleProfile.verified
    };
    
    const updatedUser = await updateUser(user.id, updateData);
    return updatedUser || user;
  }
  
  // If no user found by Google ID, check by email
  user = await findUserByEmail(googleProfile.email);
  
  if (user) {
    // Link the Google account to existing user
    const updateQuery = 'UPDATE users SET googleId = ?, updatedAt = ? WHERE id = ?';
    await runQuery(updateQuery, [googleProfile.id, new Date().toISOString(), user.id]);
    
    const updatedUser = await findUserById(user.id);
    return updatedUser!;
  }
  
  // Create new user
  const newUserData: CreateUserRequest = {
    googleId: googleProfile.id,
    email: googleProfile.email,
    name: googleProfile.name,
    picture: googleProfile.picture,
    verified: googleProfile.verified || false
  };
  
  return await createUser(newUserData);
};
