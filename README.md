# Expense Reimbursement System (ERS) - Node

## Description

Foundation Revature is a ticketing reimbursement system designed to streamline the process of submitting, reviewing, and managing reimbursement requests. This project demonstrates foundational programming concepts, modular design, and integration with cloud services.

## Table of Contents

- [Installation](#installation)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rbalk/FoundationRevature.git
   ```
2. Navigate to the project directory:
   ```bash
   cd FoundationRevature
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and configure the following environment variables:
   ```env
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_DEFAULT_REGION=your_aws_region
   S3_BUCKET_NAME=your_s3_bucket_name
   SECRET_KEY=your_jwt_secret_key
   ```
5. Start the application:
   ```bash
   npm start
   ```

## Database Setup

This project uses AWS DynamoDB as the database. Follow these steps to set up the database:

1. Create a DynamoDB table named `ReimbursmentTable` with the following attributes:
   - **Partition Key (PK):** String
   - **Sort Key (SK):** String
2. Add a Global Secondary Index (GSI) for querying by username:
   - **Index Name:** `UsernameIndex`
   - **Partition Key:** `username`
3. Ensure your AWS credentials have the necessary permissions to access DynamoDB and S3.

## API Endpoints

### User Endpoints

- **POST /users/register**  
  Register a new user.  
  **Request Body:**

  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- **POST /users/login**  
  Authenticate a user and return a JWT token.  
  **Request Body:**

  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- **GET /users/account**  
  Retrieve the authenticated user's account details.  
  **Headers:**  
  `Authorization: Bearer <token>`

- **PUT /users/account**  
  Update the authenticated user's account details.  
  **Headers:**  
  `Authorization: Bearer <token>`  
  **Request Body:**

  ```json
  {
    "name": "string",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zip": "string"
    }
  }
  ```

- **POST /users/avatar**  
  Upload a profile picture for the authenticated user.  
  **Headers:**  
  `Authorization: Bearer <token>`  
  **Form Data:**  
  `image: <file>`

- **PATCH /users/:user_id**  
  Change a user's role (Manager only).  
  **Headers:**  
  `Authorization: Bearer <token>`  
  **Request Body:**
  ```json
  {
     "role": "Employee" | "Manager"
  }
  ```

### Ticket Endpoints

- **POST /tickets**  
  Submit a new ticket.  
  **Headers:**  
  `Authorization: Bearer <token>`  
  **Request Body:**

  ```json
  {
     "amount": "number",
     "description": "string",
     "type": "Travel" | "Lodging" | "Food" | "Other"
  }
  ```

- **GET /tickets/history**  
  View the authenticated user's ticket history.  
  **Headers:**  
  `Authorization: Bearer <token>`  
  **Query Parameters:**  
  `type: Travel | Lodging | Food | Other` (optional)

- **GET /tickets/pending**  
  View all pending tickets (Manager only).  
  **Headers:**  
  `Authorization: Bearer <token>`

- **PATCH /tickets/:ticketId**  
  Approve or deny a ticket (Manager only).  
  **Headers:**  
  `Authorization: Bearer <token>`  
  **Request Body:**

  ```json
  {
     "action": "Approved" | "Denied"
  }
  ```

- **POST /tickets/:ticketId/receipts**  
  Upload a receipt for a ticket.  
  **Headers:**  
  `Authorization: Bearer <token>`  
  **Form Data:**  
  `image: <file>`

## Usage

1. Start the application:
   ```bash
   npm start
   ```
2. Use tools like Postman or cURL to interact with the API endpoints.
3. Authenticate using the `/users/login` endpoint to obtain a JWT token.
4. Use the token in the `Authorization` header for protected routes.

## Features

- User authentication with JWT.
- Role-based access control (Employee and Manager).
- Ticket submission, approval, and history tracking.
- Receipt upload with AWS S3 integration.
- Modular and scalable codebase.
