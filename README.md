# Email Notification System

A Node.js application that extracts emails from MongoDB order data and sends promotional emails to customers using Resend.

## Features

- Connects to MongoDB to fetch order records
- Sends promotional emails with a 30% discount offer to customers
- Uses Resend for reliable email delivery
- Beautiful HTML email template with responsive design
- **Handles duplicate emails** by only sending to the most recent record for each email
- **Batch processing** to respect Resend's 100 email limit per request
- **URL filtering** to only send emails for specific course types (with course=beginner or course=advanced query parameters)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database with order records
- Resend API key

## Installation

1. Clone this repository or download the files
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=your-email@example.com
SITE_URL=https://www.skillsetmaster.com/
TEST_MODE=false
```

## Usage

Run the application with:

```bash
npm start
```

The application will:
1. Connect to your MongoDB database
2. Fetch all order records
3. Filter records to only include those with sourceUrl containing "course=beginner" or "course=advanced" query parameters
4. Remove duplicate emails, keeping only the most recent record for each
5. Process emails in batches of 100 (Resend's limit)
6. Send promotional emails to eligible customers
7. Log the results to the console

## Testing

To run in test mode without sending actual emails:

1. Set `TEST_MODE=true` in your `.env` file
2. Run the application: `npm start`

In test mode, email contents will be logged to the console, but no actual emails will be sent.

## Email Template

The application includes a responsive HTML email template with:
- Company branding
- Personalized greeting based on course type
- 30% discount offer
- Call-to-action button
- Mobile-friendly design

## Customization

- Modify the email template in `30dctemp/promotionalEmail.js`
- Adjust the sourceUrl filtering in the `shouldSendEmail()` function
- Change the batch size by modifying the `BATCH_SIZE` constant
- Modify the duplicate email handling logic in the main function

## License

ISC 