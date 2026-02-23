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

describe('Auth Routes', () => {
  const mockUser = {
    userID: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'hashedpassword' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        userID: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 if user not found', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password' });

      expect(response.status).toBe(401);
    });

    it('should return 400 if email or password missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out');
      
      // Check if cookie is cleared (set to empty/expired)
      const setCookie = response.headers['set-cookie'][0];
      expect(setCookie).toMatch(/connect.sid=;/);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info if authenticated', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const agent = request.agent(app);

      // Login first
      await agent
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'hashedpassword' });

      // Then get me
      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        userID: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Not authenticated');
    });
  });
});
