import { AuthService } from '../../../src/services/AuthService';
import { UserModel } from '../../../src/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../../src/models/User');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserModel: jest.Mocked<UserModel>;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  const mockJwt = jwt as jest.Mocked<typeof jwt>;

  beforeEach(() => {
    mockUserModel = new UserModel(null as any) as jest.Mocked<UserModel>;
    authService = new AuthService(mockUserModel);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockHashedPassword = 'hashed-password';
      const mockApiKey = 'generated-api-key';
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        passwordHash: mockHashedPassword,
        apiKey: mockApiKey,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserModel.findByEmail.mockResolvedValueOnce(null);
      mockBcrypt.hash.mockResolvedValueOnce(mockHashedPassword as never);
      mockUserModel.create.mockResolvedValueOnce(mockUser);

      const result = await authService.register(userData.email, userData.password);

      expect(mockUserModel.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        email: userData.email,
        passwordHash: mockHashedPassword,
        apiKey: expect.any(String),
        isActive: true
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          apiKey: mockUser.apiKey,
          isActive: mockUser.isActive
        }
      });
    });

    it('should throw error if user already exists', async () => {
      const existingUser = {
        id: 'existing-user',
        email: 'test@example.com',
        passwordHash: 'hash',
        apiKey: 'key',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserModel.findByEmail.mockResolvedValueOnce(existingUser);

      await expect(
        authService.register('test@example.com', 'password123')
      ).rejects.toThrow('User already exists');

      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      await expect(
        authService.register('invalid-email', 'password123')
      ).rejects.toThrow('Invalid email format');
    });

    it('should validate password strength', async () => {
      await expect(
        authService.register('test@example.com', '123')
      ).rejects.toThrow('Password must be at least 8 characters');
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 'user-123',
        email: userData.email,
        passwordHash: 'hashed-password',
        apiKey: 'user-api-key',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockToken = 'jwt-token';

      mockUserModel.findByEmail.mockResolvedValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValueOnce(true as never);
      mockJwt.sign.mockReturnValueOnce(mockToken as never);

      const result = await authService.login(userData.email, userData.password);

      expect(mockUserModel.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(userData.password, mockUser.passwordHash);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          apiKey: mockUser.apiKey,
          isActive: mockUser.isActive
        },
        token: mockToken
      });
    });

    it('should throw error if user not found', async () => {
      mockUserModel.findByEmail.mockResolvedValueOnce(null);

      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is incorrect', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        apiKey: 'key',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserModel.findByEmail.mockResolvedValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValueOnce(false as never);

      await expect(
        authService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user is inactive', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        apiKey: 'key',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserModel.findByEmail.mockResolvedValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValueOnce(true as never);

      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('Account is deactivated');
    });
  });

  describe('validateApiKey', () => {
    it('should return user for valid API key', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hash',
        apiKey: 'valid-api-key',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserModel.findByApiKey.mockResolvedValueOnce(mockUser);

      const result = await authService.validateApiKey('valid-api-key');

      expect(mockUserModel.findByApiKey).toHaveBeenCalledWith('valid-api-key');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        apiKey: mockUser.apiKey,
        isActive: mockUser.isActive
      });
    });

    it('should return null for invalid API key', async () => {
      mockUserModel.findByApiKey.mockResolvedValueOnce(null);

      const result = await authService.validateApiKey('invalid-api-key');

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hash',
        apiKey: 'valid-api-key',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserModel.findByApiKey.mockResolvedValueOnce(mockUser);

      const result = await authService.validateApiKey('valid-api-key');

      expect(result).toBeNull();
    });
  });

  describe('generateApiKey', () => {
    it('should generate new API key for user', async () => {
      const userId = 'user-123';
      const newApiKey = 'new-api-key';
      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        passwordHash: 'hash',
        apiKey: newApiKey,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserModel.updateApiKey.mockResolvedValueOnce(mockUpdatedUser);

      const result = await authService.generateApiKey(userId);

      expect(mockUserModel.updateApiKey).toHaveBeenCalledWith(userId, expect.any(String));
      expect(result.apiKey).toBe(newApiKey);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', async () => {
      const token = 'valid-jwt-token';
      const decodedPayload = {
        userId: 'user-123',
        email: 'test@example.com'
      };

      mockJwt.verify.mockReturnValueOnce(decodedPayload as never);

      const result = await authService.verifyToken(token);

      expect(mockJwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(result).toEqual(decodedPayload);
    });

    it('should throw error for invalid token', async () => {
      const token = 'invalid-token';

      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken(token)).rejects.toThrow('Invalid token');
    });
  });
});