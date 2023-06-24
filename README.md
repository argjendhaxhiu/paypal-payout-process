# Job Payout Automation

This script automates the process of paying users for jobs they have completed on our platform using PayPal. The script runs on a one-hour interval and processes all jobs that have been marked as 'Accepted'.

## Dependencies

The script requires several Node.js modules:

- **Underscore.js**: Provides utility functions for working with JavaScript objects and arrays.
- **PayPal REST SDK**: Provides a way to interact with the PayPal API and make payouts.
- **Bluebird**: A promises library used to handle asynchronous code.
- **Mongoose**: A MongoDB object modeling tool to handle database transactions.

## Usage

This script is meant to be run as a background process on a server. It can be started with any process manager, such as PM2 or Forever.

Ensure that you have correctly configured your PayPal and MongoDB details in the `../server/config` file before running the script.

## Functions

The script includes several utility functions:

- `createBatchId()`: Generates a unique batch ID for each payout.
- `getPayoutJSONForJob(job)`: Constructs a `payoutJSON` object for a given job, which is sent to PayPal to create the payout.
- `getPayoutAmountForJob(job)`: Calculates the payout amount for a given job, based on the cost and the cut rate of the user.
- `getCutRateFor(user)`: Determines the cut rate for a user based on their promotions and feedbacks.
