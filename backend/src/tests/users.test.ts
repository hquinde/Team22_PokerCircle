import request from 'supertest';
import app from '../app';
import UserModel from '../models/User';

// Mock UserModel and pg
jest.mock('../models/User');
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    on: jest.fn(),
    end: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn(),
    })),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('User Search Routes', () => {
  const mockUsers = [
    { userID: 'user-123', username: 'Logan', email: 'logan@example.com' },
    { userID: 'user-456', username: 'logan_poker', email: 'logan2@example.com' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/search', () => {
    it('should return 200 with search results for valid query', async () => {
      // Mock search to return plain objects with userID and username
      (UserModel.search as jest.Mock).mockResolvedValue(mockUsers.map(u => ({
        userID: u.userID,
        username: u.username
      })));

      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'logan' });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0]).toEqual({
        id: 'user-123',
        displayName: 'Logan',
      });
      expect(response.body.results[1]).toEqual({
        id: 'user-456',
        displayName: 'logan_poker',
      });
      expect(UserModel.search).toHaveBeenCalledWith('logan');
    });

    it('should return 400 for query too short (2 chars)', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'lo' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Query too short');
      expect(UserModel.search).not.toHaveBeenCalled();
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .get('/api/users/search');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Query too short');
    });

    it('should return 200 with empty results when no users found', async () => {
      (UserModel.search as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.results).toEqual([]);
      expect(UserModel.search).toHaveBeenCalledWith('nonexistent');
    });
  });
});
