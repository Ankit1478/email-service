# Email Notification Service

A comprehensive notification service for sending automated emails and WhatsApp messages to customers who have started but not completed the checkout process for 30 Days Coding and SkillSet Master courses.

## Overview

This application monitors payment records in MongoDB databases and automatically sends reminder emails and WhatsApp notifications to users who have created but not completed payment for various courses. The service supports two different platforms:

- **30 Days Coding**: For beginner and advanced coding courses
- **SkillSet Master**: For various specialized skill courses (AI Tools, Data Analytics, ChatGPT, etc.)

## Features

- **Multi-platform Support**: Handles both 30 Days Coding and SkillSet Master platforms
- **Email Notifications**: Sends customized HTML emails to customers with pending payments
- **WhatsApp Notifications**: Sends WhatsApp messages for more immediate engagement (with 10-minute delay check)
- **Batch Processing**: Processes customers in batches to respect API rate limits
- **Deduplication**: Handles duplicate customer records by only sending to the most recent
- **Retry Logic**: Implements robust retry mechanisms for API requests
- **RESTful API**: Exposes endpoints to trigger notification processes

## Prerequisites

- Node.js (v12 or higher recommended)
- MongoDB instances (separate for 30 Days Coding and SkillSet)
- [Resend.com](https://resend.com) API key for email delivery
- [Interakt.ai](https://interakt.ai) API key for WhatsApp messaging

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server configuration
PORT=3000

# MongoDB connections
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/30dc
MONGO_URI_SKILLSET=mongodb+srv://<username>:<password>@<cluster-url>/skillset

# Email configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@example.com
FROM_EMAIL_SKILLSET=noreply@skillsetmaster.com

# Website URLs
SITE_URL=https://www.30dayscoding.com
SKILLSET_URL=https://www.skillsetmaster.com

# WhatsApp configuration (Interakt.ai)
INTERAKT_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
INTERAKT_API_KEY_SKILLSET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd email-notification-service

# Install dependencies
npm install
```

## Project Structure

```
├── index.js                 # Main application file
├── 30dctemp/                # Email templates for 30 Days Coding
│   └── promotionalEmail.js  # Email template for 30DC
├── skillsettemp/            # Email templates for SkillSet Master
│   └── skillsetEmail.js     # Email template for SkillSet
├── .env                     # Environment variables (create this)
└── README.md                # This documentation
```

## Usage

### Start the API Server

```bash
# Start with default 30 Days Coding route execution
npm start

# Start with SkillSet route execution
npm start skillset

# Start with both routes execution
npm start all

# Start in API-only mode (no automatic execution)
npm start api-only
```

### Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/send-emails/30dc` | GET | Send emails for 30 Days Coding |
| `/api/send-emails/skillset` | GET | Send emails for SkillSet Master |
| `/api/send-emails/all` | GET | Send emails for both platforms |
| `/api/send-whatsapp/30dc` | GET | Send WhatsApp notifications for 30 Days Coding |
| `/api/send-whatsapp/skillset` | GET | Send WhatsApp notifications for SkillSet Master |
| `/whatsapp-notifi/bothskillsettand30dc` | GET | Send WhatsApp notifications for both platforms |
| `/api/send-all/30dc` | GET | Send both email and WhatsApp notifications for 30 Days Coding |
| `/api/send-all/skillset` | GET | Send both email and WhatsApp notifications for SkillSet Master |

## Email Templates

The application uses custom HTML email templates:
- `30dctemp/promotionalEmail.js` - Template for 30 Days Coding courses
- `skillsettemp/skillsetEmail.js` - Template for SkillSet Master courses

These templates support dynamic content including:
- Customer name
- Course type
- Pricing information (original price, discounted price, savings)
- Dynamic checkout links

## WhatsApp Integration

WhatsApp messages are sent through Interakt.ai's API using predefined templates:
- `30dc_notification_di` - Template for 30 Days Coding
- `skillset_notification` - Template for SkillSet Master

The service implements a 10-minute delay check to avoid sending notifications to very recent records.

## Notification Logic

### Email Eligibility
A record is eligible for email notification if:
1. The payment status is "created" (not "paid")
2. The course type can be determined from the `sourceUrl` or `courseType` field

### WhatsApp Eligibility
A record is eligible for WhatsApp notification if:
1. The payment status is "created" (not "paid")
2. The record is older than 10 minutes
3. The customer has a valid phone number
4. The course type can be determined

## Production Deployment

For production deployment, consider:

1. Using a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "notification-service" -- api-only
   ```

2. Setting up monitoring and alerts:
   ```bash
   pm2 install pm2-logrotate
   pm2 monitor
   ```

3. Using a reverse proxy like Nginx for SSL termination and security

## Troubleshooting

Common issues and solutions:

1. **Connection errors to MongoDB**
   - Check connection strings in .env file
   - Verify MongoDB instance is running and accessible
   - Check network/firewall settings

2. **API errors from Resend or Interakt**
   - Verify API keys are valid and properly formatted
   - Check usage limits on the respective platforms
   - Ensure templates are approved and active

3. **No eligible records found**
   - Verify MongoDB collections contain records with "created" status
   - Check the filtering logic in the code

## Development and Extending

To add a new notification platform:
1. Create a new connection function for the database
2. Add template files for the new platform
3. Create handlers for eligibility, sending, and batch processing
4. Add new routes to the Express application

## License

[Specify your license information here]

## Contact

[Your contact information or support details] 