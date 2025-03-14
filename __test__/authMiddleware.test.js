const authenticateToken = require('../src/middleware/authMiddleware');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');




describe("Authentication middleware testing", () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: jest.fn(() => res),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    test("should return success:false, error:token required", () => {
        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Token required"
        });
        expect(next).not.toHaveBeenCalled();
    });

    test("should return success:false, error:invalid or expired tocken", () => {
        req.headers['authorization'] = 'Bearer tocken-invalid';
        jwt.verify.mockImplementation((token, secret, callback) => {
            callback(new Error('Invalid token'), null);
        });

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Invalid or expired tocken"
        });
        expect(next).not.toHaveBeenCalled();
    });

    test("should call next()", () => {
        req.headers['authorization'] = 'Bearer tocken-valid';
        jwt.verify.mockImplementation((token, secret, callback) => {
            callback(null, { username: 'user', password: "pass" });
        });

        authenticateToken(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('tocken-valid', process.env.SECRET_KEY, expect.any(Function));
        expect(req.user).toEqual({ username: "user", password: "pass" });

        expect(next).toHaveBeenCalled();
    });
});