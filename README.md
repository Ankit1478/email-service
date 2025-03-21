# Email Notification System

A Node.js application that extracts emails from MongoDB order data and sends promotional emails to customers using Resend. Supports both 30 Days Coding and SkillSet Master platforms.

## Features

- Connects to MongoDB to fetch order records
- Sends promotional emails with discount offers to customers
- Uses Resend for reliable email delivery
- Beautiful HTML email templates with responsive design
- **Handles duplicate emails** by only sending to the most recent record for each email
- **Batch processing** to respect Resend's 100 email limit per request
- **URL filtering** to identify course types based on URL patterns
- **Multiple platforms support** for both 30 Days Coding and SkillSet Master

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
SITE_URL=https://www.30dayscoding.com/
SKILLSET_URL=https://www.skillsetmaster.com/
FROM_EMAIL_SKILLSET=noreply@skillsetmaster.com
TEST_MODE=false
```

## Usage

### For 30 Days Coding:

Run the application with:

```bash
npm start
```

or explicitly:

```bash
node index.js
```

### For SkillSet Master:

Run the application with:

```bash
node index.js skillset
```

The application will:
1. Connect to the appropriate MongoDB database
2. Fetch all order records
3. Determine course types based on sourceUrl patterns
4. Remove duplicate emails, keeping only the most recent record for each
5. Process emails in batches of 100 (Resend's limit)
6. Send promotional emails to eligible customers
7. Log the results to the console

## Email Templates

### 30 Days Coding Template
- Basic and Advanced course types
- Personalized greeting
- Discount offer
- Call-to-action button
- Mobile-friendly design

### SkillSet Master Template
Supports multiple course types:
- AI Tools Mastery (`/ai`)
- Data Analytics (`/data-analyst`)
- ChatGPT and Prompt Engineering (`/chatgpt`)
- Study Abroad (`/studyabroad`)
- LinkedIn Growth (`/linkedin`)
- Make websites and apps with AI (`/ai-apps`)
- Immigrants Success System (`/immigrants`)
- Video Editing (`/video-editing`)

Each template is personalized based on the course type detected from the sourceUrl.

## Testing

To run in test mode without sending actual emails:

1. Set `TEST_MODE=true` in your `.env` file
2. Run the application: `npm start` or `node index.js skillset`

In test mode, email contents will be logged to the console, but no actual emails will be sent.

## Customization

- Modify the 30 Days Coding email template in `30dctemp/promotionalEmail.js`
- Modify the SkillSet Master email template in `skillsettemp/skillsetEmail.js`
- Adjust the URL pattern detection in the main functions
- Change the batch size by modifying the `BATCH_SIZE` constant
- Modify the duplicate email handling logic in the main functions

## License

ISC 