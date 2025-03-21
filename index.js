require('dotenv').config();
const { MongoClient } = require('mongodb');
const { Resend } = require('resend');
const promotionalEmail = require('./30dctemp/promotionalEmail');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// MongoDB connection URI
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Maximum emails to send in one batch (Resend limit is 100)
const BATCH_SIZE = 100;

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db().collection('orders');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

async function fetchPaymentsData(collection) {
  try {
    // Find all payment records - we'll filter by status in the main function
    const cursor = collection.find({});
    return await cursor.toArray();
  } catch (error) {
    console.error('Error fetching payment data:', error);
    throw error;
  }
}

function shouldSendEmail(payment) {
  // Check if sourceUrl contains required patterns
  const sourceUrl = payment.sourceUrl || '';
  
  // Handle URLs with query parameters (e.g., /checkout?course=beginner)
  if (sourceUrl.includes('?course=')) {
    const courseParam = sourceUrl.split('?course=')[1];
    // Check if the course parameter is 'beginner' or 'advanced'
    return courseParam === 'beginner' || courseParam === 'advanced';
  }
  
  // Also handle direct path segments for compatibility
  return sourceUrl.includes('/beginner') || sourceUrl.includes('/advanced');
}

async function sendPromotionalEmail(customerData) {
  try {
    const { email, name } = customerData.customerDetails;
    const siteUrl = process.env.SITE_URL;
    
    // Get course type and other information for personalization
    const { courseType } = customerData;
    const utmSource = customerData.utmParameters?.utm_source || 'direct';
    
    const emailContent = promotionalEmail(name, siteUrl, courseType);
    
    const response = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: [email],
      subject: 'Complete Your Course Registration - 30 Days Coding',
      html: emailContent,
      tags: [
        {
          name: 'course_type',
          value: courseType
        },
        {
          name: 'utm_source',
          value: utmSource
        }
      ]
    });
    
    console.log(`Email sent to ${email}. Response:`, response);
    return response;
  } catch (error) {
    console.error(`Error sending email to ${customerData.customerDetails.email}:`, error);
    throw error;
  }
}

async function processBatch(batch) {
  console.log(`Processing batch of ${batch.length} emails...`);
  const promises = batch.map(payment => sendPromotionalEmail(payment));
  return Promise.all(promises);
}

async function main() {
  try {
    // Connect to MongoDB
    const collection = await connectToMongoDB();
    
    // Fetch payments data
    const paymentsData = await fetchPaymentsData(collection);
    console.log(`Found ${paymentsData.length} payment records to process`);
    
    // Filter payments based on sourceUrl criteria
    const eligiblePayments = paymentsData.filter(payment => shouldSendEmail(payment));
    console.log(`${eligiblePayments.length} payments match the sourceUrl criteria`);
    
    // Handle duplicate emails by creating a Map with email as key
    const emailMap = new Map();
    
    // Process each payment record, keeping only the most recent for each email
    eligiblePayments.forEach(payment => {
      const email = payment.customerDetails.email;
      
      // Get timestamp from MongoDB date format
      const currentDate = payment.createdAt?.$date?.$numberLong 
        ? Number(payment.createdAt.$date.$numberLong) 
        : new Date().getTime();
      
      // Compare with existing entry
      const existingDate = emailMap.get(email)?.createdAt?.$date?.$numberLong
        ? Number(emailMap.get(email).createdAt.$date.$numberLong)
        : 0;
      
      if (!emailMap.has(email) || currentDate > existingDate) {
        emailMap.set(email, payment);
      }
    });
    
    console.log(`Found ${emailMap.size} unique emails to send to`);
    
    // Convert Map back to array and prepare for batch processing
    const uniquePayments = Array.from(emailMap.values());
    
    // Process in batches of BATCH_SIZE
    for (let i = 0; i < uniquePayments.length; i += BATCH_SIZE) {
      const batch = uniquePayments.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(uniquePayments.length/BATCH_SIZE)}`);
      await processBatch(batch);
      
      // If we have more batches to process, wait a bit to avoid rate limits
      if (i + BATCH_SIZE < uniquePayments.length) {
        console.log('Waiting 5 seconds before processing next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('Email processing completed successfully');
  } catch (error) {
    console.error('Error in main process:', error);
  } finally {
    // Close the MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the application
main(); 