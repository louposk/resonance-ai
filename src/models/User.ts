import { PoolClient } from 'pg';
import { User } from '../types';
import { randomBytes } from 'crypto';

export class UserModel {
  constructor(private client: PoolClient) {}

  async create(userData: {
    email: string;
    passwordHash: string;
    apiKey: string;
    isActive?: boolean;
  }): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash, api_key, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      userData.email,
      userData.passwordHash,
      userData.apiKey,
      userData.isActive !== undefined ? userData.isActive : true
    ];

    const result = await this.client.query(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await this.client.query(query, [email]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await this.client.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  async findByApiKey(apiKey: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE api_key = $1`;
    const result = await this.client.query(query, [apiKey]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  async updateApiKey(id: string, apiKey: string): Promise<User | null> {
    const query = `
      UPDATE users
      SET api_key = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.client.query(query, [id, apiKey]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const query = `
      UPDATE users
      SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.client.query(query, [id, passwordHash]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<User | null> {
    const query = `
      UPDATE users
      SET is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.client.query(query, [id, isActive]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM users WHERE id = $1`;
    const result = await this.client.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  generateApiKey(): string {
    return `music_api_${randomBytes(32).toString('hex')}`;
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      apiKey: row.api_key,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}