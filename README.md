# paypal-payout-process

Payout Process using Paypal

Description
This is a Payout Process that uses PayPal to manage payouts. It performs various operations including job status checking, payout preparation, and error handling. It works with MongoDB using Mongoose for job data management and uses the Bluebird library for promise handling. It is designed to run a payout operation every hour.

Installation and Setup
Clone the repository to your local machine.
Install the necessary dependencies with npm install.
Dependencies
Node.js: Server-side JavaScript runtime.
PayPal-rest-sdk: Official PayPal SDK for Node.js.
Bluebird: Promise library.
Mongoose: MongoDB object modeling tool.
Underscore.js: JavaScript utility library.
A MongoDB database with a compatible schema is also required.
Usage
Ensure MongoDB is running.
Update the config file located in the server directory with your PayPal and MongoDB details.
Run the script using node script_name.js.
Functions
This script includes the following functions:

createBatchId(): Generates a random batch ID.
getPayoutJSONForJob(job): Prepares the payout JSON for a specific job.
getPayoutAmountForJob(job): Calculates the payout amount for a job.
getCutRateFor(user): Determines the cut rate for a user.
initializePayoutJSON(): Initializes a new payout JSON object.
createPayouts(jobs, payoutJSON): Creates payouts for all accepted jobs.
saveJobsAndOwners(jobs): Saves all updated job statuses and owners.
processPayouts(): Main function for processing payouts at an interval.

License
This project is licensed under the terms of the MIT license.
