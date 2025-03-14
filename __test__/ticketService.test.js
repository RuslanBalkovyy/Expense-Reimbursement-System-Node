const { createTicket, getTicket, getAllTicketsByStatus,
    getAllTicketsByUserId, getAllTicketsForAdmin, updateTicket
} = require("../src/models/ticketModel");
const { getUser } = require("../src/models/userModel");
const { submitTicket,
    getPendingTickets,
    processTicket,
    viewTicketsAsEmployee
} = require("../src/services/ticketService");

jest.mock("../src/models/ticketModel");
jest.mock("../src/models/userModel");
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mocked-uuid'),
}));

describe("submitTicket", () => {
    //TODO

    const mockTicket = { amount: 300, description: "test description" };

    test("should return success:false, error:user does not exit", async () => {
        getUser.mockResolvedValue(null);
        console.log(await getUser(1));

        const response = await submitTicket(mockTicket, 1);

        expect(response).toMatchObject({ success: false, error: "User does not exist." });
        expect(getUser).toHaveBeenCalledWith(1);

    });

    test("should return success:false, error:database issue", async () => {
        createTicket.mockResolvedValue(null);
        getUser.mockResolvedValue(true);

        const response = await submitTicket(mockTicket, 1);

        expect(response).toMatchObject({ success: false, error: "Failed to create ticket due to a database issue." });

    });

    test("sould return success:true, ticket:ticket", async () => {
        createTicket.mockResolvedValue(mockTicket);
        getUser.mockResolvedValue(true);

        const response = await submitTicket(mockTicket, 1);

        expect(response).toMatchObject({
            success: true, ticket: {
                ticket_id: 'mocked-uuid',
                amount: mockTicket.amount,
                description: mockTicket.description,
                status: "Pending",
                created_at: expect.any(String)
            }
        });

    });

    test("should return success:false, error:unexpected error", async () => {
        createTicket.mockRejectedValue(new Error("Dynamo DB error"));
        getUser.mockResolvedValue(true);

        const response = await submitTicket(mockTicket, 1);

        expect(response).toMatchObject({ success: false, error: "An unexpected error occurred during ticket submission." });


    });

});

describe("getPendingTicket", () => {
    //TODO

    test("should return success:false, error:no pending ticket", async () => {

    });

    test("should return success:true, ticket", async () => {

    });

    test("should return success:false, unexpected error", async () => {

    });
});

describe("processTicket", () => {
    //TODO

    test("should return success:false, invatil action", async () => {

    });
    test("should return false, error:cannot be processed, not exist", async () => {

    });
    test("should return false, error: already processed", async () => {

    });
    test("should return success:true, ticket", async () => {

    });
    test("should return success:false, failed to process", async () => {

    });
});

describe("viewTicketAsEmployee", () => {
    //TODO

    test("should return success:false, error:user not exist", async () => {

    });
    test("should return success:false, error:no previous ticekt found", async () => {

    });
    test("should return success:true, ticket.map", async () => {

    });
    test("should return success:false,error:unexpected error", async () => {

    });
});