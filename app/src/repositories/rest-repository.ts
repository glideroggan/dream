import { Entity, Repository } from '../services/repository-service';

// REST API configuration interface
export interface RestConfig {
  baseUrl: string;
  endpoints: {
    getAll: string;
    getById: string;
    create: string;
    update: string;
    delete: string;
  };
  headers?: HeadersInit;
}

// REST repository implementation for future use
export class RestRepository<T extends Entity> implements Repository<T> {
  protected config: RestConfig;

  constructor(config: RestConfig) {
    this.config = config;
  }

  // Default headers for all requests
  protected getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };
  }

  async getAll(): Promise<T[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.getAll}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<T | undefined> {
    try {
      const endpoint = this.config.endpoints.getById.replace(':id', id);
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (response.status === 404) {
        return undefined;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch item with id ${id}:`, error);
      throw error;
    }
  }

  async create(item: Omit<T, 'id'>): Promise<T> {
    try {
      const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.create}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(item)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    try {
      const endpoint = this.config.endpoints.update.replace(':id', id);
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });
      
      if (response.status === 404) {
        return undefined;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to update item with id ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const endpoint = this.config.endpoints.delete.replace(':id', id);
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Failed to delete item with id ${id}:`, error);
      throw error;
    }
  }
}
