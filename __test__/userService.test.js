const { registration, login } = require('../src/services/userService');
const { createUser, getUserByUsername } = require('../src/models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


jest.mock('../src/models/userModel');
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mocked-uuid'),
}));
jest.mock('bcrypt');
jest.mock("jsonwebtoken")



describe("registration", () => {
    const mockUser = { user_id: 1, username: "username", password: "password", role: "Employee" };

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test("should return success:false and error:username already exist", async () => {
        getUserByUsername.mockResolvedValue(mockUser);

        const response = await registration({ username: "username", password: "password" }
        );
        expect(getUserByUsername).toHaveBeenCalledWith("username");
        expect(response).toMatchObject({ success: false, error: "Username already exists." });
    });

    test("should return success:true and user object", async () => {
        getUserByUsername.mockResolvedValue(null);
        createUser.mockResolvedValue(mockUser);

        const response = await registration({ username: "username", password: "password" }
        );
        expect(response).toMatchObject({ success: true, user: { username: "username", role: "Employee", user_id: 1 } });
    });

    test("Error during registration", async () => {
        getUserByUsername.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('<hashed_password>');

        createUser.mockRejectedValue(new Error("Dynamo DB error"));


        const response = await registration({ username: "username", password: "password" }
        );
        expect(response).toEqual({ success: false, error: "An unexpected error occurred during registration." });

        expect(createUser).toHaveBeenCalledWith({
            username: "username",
            password: "<hashed_password>",
            user_id: "mocked-uuid",
            role: "Employee"
        })
    });

});

describe("login", () => {
    //TODO

    const mockUser = { username: "username", password: "Password" };

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test("no username in db", async () => {
        getUserByUsername.mockResolvedValue(null);

        const response = await login(mockUser);
        expect(response).toMatchObject({
            success: false,
            error: "No such username in database."
        });
    });


    test("password match", async () => {
        getUserByUsername.mockResolvedValue({ username: "username", password: "password", user_id: 1, role: "Employee" });
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue("sometoken");

        const response = await login(mockUser);


        expect(response).toMatchObject({
            success: true, user: { username: "username", user_id: 1, role: "Employee" },
            token: "sometoken"
        });

    });

    test("password doesn't match", async () => {
        getUserByUsername.mockResolvedValue({ username: "username", password: "password", user_id: 1, role: "Employee" });
        bcrypt.compare.mockResolvedValue(false);

        const response = await login(mockUser);

        expect(response).toMatchObject({ success: false, error: "Password doesn't match." });
    });

    test("error during login", async () => {
        getUserByUsername.mockRejectedValue(new Error("Dynamo DB error"));

        const response = await login(mockUser);

        expect(response).toEqual({ success: false, error: "An unexpected error occurred during login." });
    });
});