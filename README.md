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
- **REST API** for triggering email sending operations
- **Retry logic** for handling temporary failures (3 retries with delay)

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
MONGO_URI_SKILLSET=mongodb+srv://username:password@cluster.mongodb.net/skillset_database
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@30dayscoding.com
FROM_EMAIL_SKILLSET=noreply@skillsetmaster.com
SITE_URL=https://www.30dayscoding.com/
SKILLSET_URL=https://www.skillsetmaster.com/
PORT=3000
```

## Usage

### Command Line Mode

#### For 30 Days Coding:

Run the application with:

```bash
npm start
```

or explicitly:

```bash
node index.js
```

#### For SkillSet Master:

Run the application with:

```bash
npm run start:skillset
```

or:

```bash
node index.js skillset
```

#### For Both Platforms:

Run both email processes sequentially:

```bash
npm run start:all
```

or:

```bash
node index.js all
```

### API Mode

Start the application in API-only mode:

```bash
npm run start:api
```

or:

```bash
node index.js api-only
```

This will start an Express server with the following endpoints:

- `GET /health` - Health check endpoint
- `POST /api/send-emails/30dc` - Trigger 30 Days Coding emails
- `POST /api/send-emails/skillset` - Trigger SkillSet Master emails
- `POST /api/send-emails/all` - Trigger both email processes

Example API usage:

```bash
# Health check
curl http://localhost:3000/health

# Trigger 30DC emails
curl -X POST http://localhost:3000/api/send-emails/30dc

# Trigger SkillSet emails
curl -X POST http://localhost:3000/api/send-emails/skillset

# Trigger both
curl -X POST http://localhost:3000/api/send-emails/all
```

## What the Application Does

The application will:
1. Connect to the appropriate MongoDB database
2. Fetch all order records
3. Determine course types based on sourceUrl patterns
4. Remove duplicate emails, keeping only the most recent record for each
5. Process emails in batches of 100 (Resend's limit)
6. Send promotional emails to eligible customers
7. Log the results to the console
8. Apply retry logic (3 attempts) if sending fails

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

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

Options include:
- Traditional VPS/Dedicated Server
- Heroku
- AWS Elastic Beanstalk
- Docker

## Customization

- Modify the 30 Days Coding email template in `30dctemp/promotionalEmail.js`
- Modify the SkillSet Master email template in `skillsettemp/skillsetEmail.js`
- Adjust the URL pattern detection in the main functions
- Change the batch size by modifying the `BATCH_SIZE` constant
- Modify the retry logic by changing `MAX_RETRIES` and `RETRY_DELAY` constants

## License

ISC 