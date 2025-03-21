const { submitTicket, getPendingTickets, processTicket, viewTicketsAsEmployee, uploadReceipt, loadTicketsWithSignedUrls } = require('../src/services/ticketService');
const { createTicket, getTicket, getTicketsByStatus, getTicketsByUserId, getTicketsByUserAndType, updateTicket, getUser } = require('../src/models/reimbursmentModel');
const { S3Client } = require("@aws-sdk/client-s3");




jest.mock('../src/services/ticketService', () => ({
    ...jest.requireActual('../src/services/ticketService'),
    loadTicketsWithSignedUrls: jest.fn(),
}));

jest.mock('../src/models/reimbursmentModel');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');


describe('Ticket Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('submitTicket', () => {
        it('should submit a ticket successfully', async () => {
            const userId = 'user123';
            const ticket = { description: 'Test ticket' };
            const user = { id: userId };
            const createdTicket = { ticket_id: 'ticket123', description: 'Test ticket', status: 'Pending' };

            getUser.mockResolvedValue(user);
            createTicket.mockResolvedValue(createdTicket);

            const result = await submitTicket(ticket, userId);

            expect(result.success).toBe(true);
            expect(result.ticket).toEqual(createdTicket);
        });

        it('should return an error if user does not exist', async () => {
            const userId = 'user123';
            const ticket = { description: 'Test ticket' };

            getUser.mockResolvedValue(null);

            const result = await submitTicket(ticket, userId);

            expect(result.success).toBe(false);
            expect(result.error).toBe('User does not exist.');
        });

        it('should return an error if ticket creation fails', async () => {
            const userId = 'user123';
            const ticket = { description: 'Test ticket' };
            const user = { id: userId };

            getUser.mockResolvedValue(user);
            createTicket.mockResolvedValue(false);

            const result = await submitTicket(ticket, userId);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to create ticket.');
        });

        it('should return an error if an unexpected error occurs', async () => {
            const userId = 'user123';
            const ticket = { description: 'Test ticket' };

            getUser.mockRejectedValue(new Error('Unexpected error'));

            const result = await submitTicket(ticket, userId);

            expect(result.success).toBe(false);
            expect(result.error).toBe('An unexpected error occurred during ticket submission.');
        });
    });

    describe('getPendingTickets', () => {
        it('should retrieve pending tickets successfully', async () => {
            const tickets = [{ ticket_id: 'ticket123', status: 'Pending', receiptFileName: [] }];
            const signedTickets = [
                {
                    ticket_id: 'ticket123',
                    status: 'Pending',
                    receiptFileName: [],
                },
            ];

            getTicketsByStatus.mockResolvedValue(tickets);
            loadTicketsWithSignedUrls.mockResolvedValue(signedTickets);

            const result = await getPendingTickets();

            expect(result.success).toBe(true);
            expect(result.tickets).toEqual(signedTickets);
        });

        it('should return an error if no pending tickets are found', async () => {
            getTicketsByStatus.mockResolvedValue([]);

            const result = await getPendingTickets();

            expect(result.success).toBe(false);
            expect(result.error).toBe('No pending tickets available for processing.');
        });
        it('should return an error if an unexpected error occurs', async () => {
            getTicketsByStatus.mockRejectedValue(new Error('Unexpected error'));

            const result = await getPendingTickets();

            expect(result.success).toBe(false);
            expect(result.error).toBe('An unexpected error occurred during retrieving tickets.');
        });

    });

    describe('processTicket', () => {
        it('should process a ticket successfully', async () => {
            const ticketId = 'ticket123';
            const userId = 'user123';
            const action = 'Approved';
            const ticket = { ticket_id: ticketId, status: 'Pending', userId: 'user456' };
            const updatedTicket = { ticket_id: ticketId, status: action };

            getTicket.mockResolvedValue(ticket);
            updateTicket.mockResolvedValue(updatedTicket);

            const result = await processTicket(ticketId, userId, action);

            expect(result.success).toBe(true);
            expect(result.ticket).toEqual(updatedTicket);
        });

        it('should return an error if ticket does not exist or is already processed', async () => {
            const ticketId = 'ticket123';
            const userId = 'user123';
            const action = 'Approved';

            getTicket.mockResolvedValue(null);

            const result = await processTicket(ticketId, userId, action);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Ticket cannot be processed. Either it does not exist or it is already processed.');
        });

        it('should return an error if user tries to process their own ticket', async () => {
            const ticketId = 'ticket123';
            const userId = 'user123';
            const action = 'Approved';
            const ticket = { ticket_id: ticketId, status: 'Pending', userId: userId };

            getTicket.mockResolvedValue(ticket);

            const result = await processTicket(ticketId, userId, action);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Ticket cannot be processed. Not allowed to process own ticket.');
        });
    });

    describe('viewTicketsAsEmployee', () => {
        it('should retrieve tickets for a user successfully', async () => {
            const userId = 'user123';
            const tickets = [{ ticket_id: 'ticket123', userId }];
            const signedTickets = [
                {
                    ticket_id: 'ticket123',
                    userId: 'user123',
                },
            ];
            const user = { id: userId };

            getUser.mockResolvedValue(user);
            getTicketsByUserId.mockResolvedValue(tickets);


            const result = await viewTicketsAsEmployee(userId);

            expect(result.success).toBe(true);
            expect(result.tickets).toEqual(signedTickets);
        });


        it('should return an error if user does not exist', async () => {
            const userId = 'user123';

            getUser.mockResolvedValue(null);

            const result = await viewTicketsAsEmployee(userId);

            expect(result.success).toBe(false);
            expect(result.error).toBe('User does not exist.');
        });

        it('should retrieve tickets successfully by user ID and type', async () => {
            const userId = 'user123';
            const type = 'Pending';
            const tickets = [{ ticket_id: 'ticket123', userId, type }];
            const signedTickets = [
                {
                    ticket_id: 'ticket123',
                    userId: 'user123',
                    type: 'Pending',
                },
            ];
            const user = { id: userId };

            getUser.mockResolvedValue(user);
            getTicketsByUserAndType.mockResolvedValue(tickets);

            const result = await viewTicketsAsEmployee(userId, type);

            expect(result.success).toBe(true);
            expect(result.tickets).toEqual(signedTickets);
        });

        it('should return an error if no tickets are found', async () => {
            const userId = 'user123';
            const type = 'Pending';
            const user = { id: userId };

            getUser.mockResolvedValue(user);
            getTicketsByUserAndType.mockResolvedValue([]);

            const result = await viewTicketsAsEmployee(userId, type);

            expect(result.success).toBe(false);
            expect(result.error).toBe('No previous tickets found for the user.');
        });
    });

    describe('uploadReceipt', () => {
        it('should upload a receipt successfully', async () => {
            const userId = 'user123';
            const ticketId = 'ticket123';
            const file = { originalname: 'receipt.jpg', buffer: Buffer.from(''), mimeType: 'image/jpeg' };
            const ticket = { ticket_id: ticketId, user_id: userId, receiptFileName: [] };
            const response = { ticket_id: ticketId, receiptFileName: [`${userId}/${ticketId}/receipt.jpg`] };

            getTicket.mockResolvedValue(ticket);
            S3Client.prototype.send.mockResolvedValue({});

            const result = await uploadReceipt(userId, ticketId, file);

            expect(result.success).toBe(true);
            expect(result.ticket).toEqual(response);
        });

        it('should return an error if ticket does not exist or user ID does not match', async () => {
            const userId = 'user123';
            const ticketId = 'ticket123';
            const file = { originalname: 'receipt.jpg', buffer: Buffer.from(''), mimeType: 'image/jpeg' };

            getTicket.mockResolvedValue(null);

            const result = await uploadReceipt(userId, ticketId, file);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Ticket not found or user ID does not match');
        });

        it('should return an error if receipt upload fails', async () => {


            const userId = 'user123';
            const ticketId = 'ticket123';
            const file = { originalname: 'receipt.jpg', buffer: Buffer.from(''), mimeType: 'image/jpeg' };
            const ticket = { ticket_id: ticketId, user_id: userId, receiptFileName: [] };

            getTicket.mockResolvedValue(ticket);
            S3Client.prototype.send.mockRejectedValue(new Error('Upload failed'));

            const result = await uploadReceipt(userId, ticketId, file);


            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to upload receipt');
        });
    });
});