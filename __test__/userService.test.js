const { registration, login, changeUserRole, updateAccount, uploadAvatar } = require('../src/services/userService');
const { createUser, getUserByUsername, getUser, updateUser } = require('../src/models/reimbursmentModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { S3Client } = require('@aws-sdk/client-s3');

jest.mock('../src/models/reimbursmentModel');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('@aws-sdk/client-s3');

describe('User Service', () => {



    describe('registration', () => {
        it('should register a new user successfully', async () => {
            getUserByUsername.mockResolvedValue(null);
            createUser.mockResolvedValue({ username: 'testuser', role: 'Employee', user_id: '123' });
            bcrypt.hash.mockResolvedValue('hashedpassword');

            const result = await registration({ username: 'testuser', password: 'password' });

            expect(result.success).toBe(true);
            expect(result.user.username).toBe('testuser');
        });

        it('should return error if username already exists', async () => {
            getUserByUsername.mockResolvedValue({ username: 'testuser' });

            const result = await registration({ username: 'testuser', password: 'password' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Username already exists.');
        });

        it('should return error if there is a database error while creating a user', async () => {
            getUserByUsername.mockResolvedValue(null);
            createUser.mockResolvedValue(false);

            const result = await registration({ username: 'testuser', password: 'password' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('DB error while creating user');
        });

        it('should return error if there is an unexpected error during registration', async () => {
            getUserByUsername.mockRejectedValue(new Error('Unexpected error'));

            const result = await registration({ username: 'testuser', password: 'password' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('An unexpected error occurred during registration.');
        });

    });

    describe('login', () => {
        it('should login successfully with correct credentials', async () => {
            getUserByUsername.mockResolvedValue({ username: 'testuser', password: 'hashedpassword', user_id: '123', role: 'Employee' });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');

            const result = await login({ username: 'testuser', password: 'password' });

            expect(result.success).toBe(true);
            expect(result.token).toBe('token');
        });

        it('should return error if username does not exist', async () => {
            getUserByUsername.mockResolvedValue(null);

            const result = await login({ username: 'testuser', password: 'password' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('No such username in database.');
        });

        it('should return error if password does not match', async () => {
            getUserByUsername.mockResolvedValue({ username: 'testuser', password: 'hashedpassword' });
            bcrypt.compare.mockResolvedValue(false);

            const result = await login({ username: 'testuser', password: 'password' });

            expect(result.success).toBe(false);
            expect(result.error).toBe("Password doesn't match.");
        });

        it('should return error if there is an unexpected error during login', async () => {
            getUserByUsername.mockRejectedValue(new Error('Unexpected error'));

            const result = await login({ username: 'testuser', password: 'password' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('An unexpected error occurred during login.');
        });
    });

    describe('changeUserRole', () => {
        it('should change user role successfully', async () => {
            getUser.mockResolvedValue({ user_id: '123', role: 'Employee' });
            updateUser.mockResolvedValue({ role: 'Manager' });

            const result = await changeUserRole('123', 'Manager');

            expect(result.success).toBe(true);
            expect(result.role).toBe('Manager');
        });

        it('should return error if user does not exist', async () => {
            getUser.mockResolvedValue(null);

            const result = await changeUserRole('123', 'Manager');

            expect(result.success).toBe(false);
            expect(result.error).toBe('No such username in database.');
        });

        it('should return error if user already has the role', async () => {
            getUser.mockResolvedValue({ user_id: '123', role: 'Manager' });

            const result = await changeUserRole('123', 'Manager');

            expect(result.success).toBe(false);
            expect(result.error).toBe('User already has that role');
        });

        it('should return error if there is a database error while updating the role', async () => {
            getUser.mockResolvedValue({ user_id: '123', role: 'Employee' });
            updateUser.mockResolvedValue(false);

            const result = await changeUserRole('123', 'Manager');

            expect(result.success).toBe(false);
            expect(result.error).toBe("Failed to update the user's role. Please try again.");
        });

        it('should return error if there is an unexpected error during role change', async () => {
            getUser.mockRejectedValue(new Error('Unexpected error'));

            const result = await changeUserRole('123', 'Manager');

            expect(result.success).toBe(false);
            expect(result.error).toBe('An unexpected error occurred during role changing.');
        });
    });

    describe('updateAccount', () => {
        it('should update user account successfully', async () => {
            getUser.mockResolvedValue({ user_id: '123', username: 'testuser' });
            updateUser.mockResolvedValue(true);

            const result = await updateAccount('123', { email: 'newemail@example.com' });

            expect(result.success).toBe(true);
            expect(result.message).toBe('User successfully updated.');
        });

        it('should return error if user does not exist', async () => {
            getUser.mockResolvedValue(null);

            const result = await updateAccount('123', { email: 'newemail@example.com' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('User not found in the database.');
        });

        it('should return error if trying to change username', async () => {
            getUser.mockResolvedValue({ user_id: '123', username: 'testuser' });

            const result = await updateAccount('123', { username: 'newusername' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Username cannot be changed.');
        });

        it('should return error if there is a database error while updating the user', async () => {
            getUser.mockResolvedValue({ user_id: '123', username: 'testuser' });
            updateUser.mockResolvedValue(false);

            const result = await updateAccount('123', { email: 'newemail@example.com' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to update the user. Please try again later.');
        });

        it('should return error if there is an unexpected error while updating user details', async () => {
            getUser.mockResolvedValue({ user_id: '123', username: 'testuser' });
            updateUser.mockRejectedValue(new Error('Unexpected error'));

            const result = await updateAccount('123', { email: 'newemail@example.com' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unexpected error while updating user details.');
        });
    });

    describe('uploadAvatar', () => {
        it('should upload avatar successfully', async () => {
            getUser.mockResolvedValue({ user_id: '123' });
            updateUser.mockResolvedValue({ profilePicture: '123/avatar/filename.jpg' });
            const mockSend = jest.fn().mockResolvedValue({});
            S3Client.prototype.send = mockSend;

            const result = await uploadAvatar('123', { originalname: 'filename.jpg', buffer: Buffer.from(''), mimeType: 'image/jpeg' });

            expect(result.success).toBe(true);
            expect(result.user.profilePicture).toBe('123/avatar/filename.jpg');
        });

        it('should return error if user does not exist', async () => {
            getUser.mockResolvedValue(null);

            const result = await uploadAvatar('123', { originalname: 'filename.jpg', buffer: Buffer.from(''), mimeType: 'image/jpeg' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('User not found');
        });

        it('should return error if failed to update user with avatar details', async () => {
            getUser.mockResolvedValue({ user_id: '123' });
            updateUser.mockResolvedValue(false);
            const mockSend = jest.fn().mockResolvedValue({});
            S3Client.prototype.send = mockSend;

            const result = await uploadAvatar('123', { originalname: 'filename.jpg', buffer: Buffer.from(''), mimeType: 'image/jpeg' });

            expect(result.success).toBe(false);
            expect(result.error).toBe("Failed to update the user's avatar. Please try again.");
        });

        it('should return error if there is an unexpected error during avatar upload', async () => {
            getUser.mockResolvedValue({ user_id: '123' });
            const mockSend = jest.fn().mockRejectedValue(new Error('Unexpected error'));
            S3Client.prototype.send = mockSend;

            const result = await uploadAvatar('123', { originalname: 'filename.jpg', buffer: Buffer.from(''), mimeType: 'image/jpeg' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unexpected error during avatar upload.');
        });
    });
});