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

    test("should return success:false, error:no pending ticket", async () => {
        getAllTicketsByStatus.mockResolvedValue([]);
        const response = await getPendingTickets();

        expect(getAllTicketsByStatus).toHaveBeenCalledWith("Pending");
        expect(response).toMatchObject({ success: false, error: "No pending tickets available for processing." });
    });

    test("should return success:true, ticket", async () => {
        getAllTicketsByStatus.mockResolvedValue([{ ticket_id: 1, created_at: "1" }, { ticket_id: 2, created_at: "2" }]);

        const respone = await getPendingTickets();

        expect(respone).toMatchObject({
            success: true,
            tickets: expect.any(Array)
        })
    });

    test("should return success:false, unexpected error", async () => {
        getAllTicketsByStatus.mockRejectedValue(new Error("Dynamo DB error"));

        const response = await getPendingTickets();
        expect(response).toMatchObject({ success: false, error: "An unexpected error occurred during retrieving tickets." });
    });
});

describe("processTicket", () => {
    //FIXME add user id to the request and new test case for trying to process own ticket 
    test("should return success:false, invatil action", async () => {
        const response = await processTicket(1, "Pending");
        expect(response).toMatchObject({ success: false, error: "Invalid action. Tickets can only be Approved or Denied." });
    });
    test("should return false, error:cannot be processed, not exist", async () => {
        getTicket.mockResolvedValue(null);

        const response = await processTicket(1, "Approved");

        expect(response).toMatchObject({ success: false, error: "Ticket cannot be processed. Either it does not exist or it is already processed." });
        expect(getTicket).toHaveBeenCalledWith(1);
    });

    test("should return false, error: already processed", async () => {
        getTicket.mockResolvedValue({ ticket_id: 1, statuf: "Denied" });

        const response = await processTicket(1, "Approved");

        expect(response).toMatchObject({ success: false, error: "Ticket cannot be processed. Either it does not exist or it is already processed." });
        expect(getTicket).toHaveBeenCalledWith(1);
    });

    test("should return success:true, ticket", async () => {
        getTicket.mockResolvedValue({ ticket_id: 1, status: "Pending" });
        updateTicket.mockResolvedValue({ status: "Approved" });

        const response = await processTicket(1, "Approved");

        expect(getTicket).toHaveBeenCalledWith(1);
        expect(updateTicket).toHaveBeenCalledWith(1, "Approved");
        expect(response).toMatchObject({ success: true, ticket: { status: "Approved" } });
    });

    test("should return success:false, failed to process", async () => {
        getTicket.mockRejectedValue(new Error("Dynamo DB error"));

        const response = await processTicket(1, "Approved");

        expect(response).toMatchObject({ success: false, error: "Failed to process ticket. Please try again later." });
    });
});

describe("viewTicketAsEmployee", () => {
    //TODO add cases for filtering by type 
    test("should return success:false, error:user not exist", async () => {
        getUser.mockResolvedValue(null);

        const response = await viewTicketsAsEmployee(1);

        expect(response).toMatchObject({ success: false, error: "User does not exist." });
    });


    test("should return success:false, error:no previous ticekt found", async () => {
        getUser.mockResolvedValue({ user_id: 1 });
        getAllTicketsByUserId.mockResolvedValue(null);

        const response = await viewTicketsAsEmployee(1);

        expect(response).toMatchObject({ success: false, error: "No previous tickets found." });
    });


    test("should return success:true, ticket.map", async () => {
        getUser.mockResolvedValue({ user_id: 1 });
        getAllTicketsByUserId.mockResolvedValue([{
            ticket_id: 1,
            amount: 200,
            description: "test description 1",
            status: "Approved",
            created_at: "1"
        },
        {
            ticket_id: 2,
            amount: 10000,
            description: "test description 2",
            status: "Denied",
            created_at: "2"
        }]);

        const response = await viewTicketsAsEmployee(1);

        expect(response).toMatchObject({ success: true, tickets: expect.arrayContaining([expect.any(Object)], [expect.any(Object)]) });
    });


    test("should return success:false,error:unexpected error", async () => {
        getUser.mockRejectedValue(new Error("Dynamo DB error"));

        const response = await viewTicketsAsEmployee(1);

        expect(response).toMatchObject({ success: false, error: "An unexpected error occurred while retrieving tickets." });
    });
});