const authorizeRole = require("../src/middleware/roleMiddleware");


describe("Role middleware testing", () => {

    let req, res, next;

    beforeEach(() => {
        req = {};
        res = { status: jest.fn(() => res), json: jest.fn() };
        next = jest.fn();
    });

    test("should return success:false, error:access denied", () => {
        req.user = { username: "user", role: "Employee" };

        authorizeRole("Manager")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: `Access denied. You must be a Manager to access this route.` });
        expect(next).not.toHaveBeenCalled();
    });

    test("should call next", () => {
        req.user = { username: "user", role: "Manager" };

        authorizeRole("Manager")(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test("should handle malformed req.user gracefully when role is missing", () => {
        req.user = { username: "user" };

        authorizeRole("Manager")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: "Access denied. You must be a Manager to access this route."
        });
        expect(next).not.toHaveBeenCalled();
    });
});