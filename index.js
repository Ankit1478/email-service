require('dotenv').config();
const { MongoClient } = require('mongodb');
const { Resend } = require('resend');
const express = require('express');
const axios = require('axios');
const promotionalEmail = require('./30dctemp/promotionalEmail');
const skillsetEmail = require('./skillsettemp/skillsetEmail');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json());

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// MongoDB connection URIs
const uri = process.env.MONGODB_URI;
const skillsetUri = process.env.MONGO_URI_SKILLSET;
const client = new MongoClient(uri);
const skillsetClient = new MongoClient(skillsetUri);

// Maximum emails to send in one batch (Resend limit is 100)
const BATCH_SIZE = 100;
const WHATSAPP_BATCH_SIZE = 100; // Maximum WhatsApp messages to send in one batch

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second delay between retries

/**
 * Helper function to implement retry logic
 * @param {Function} fn - The async function to retry
 * @param {Array} args - Arguments to pass to the function
 * @returns {Promise} - Result of the function call
 */
async function withRetry(fn, ...args) {
  let lastError;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn(...args);
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY}ms...`);
      
      if (attempt < MAX_RETRIES) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  console.error(`All ${MAX_RETRIES} retry attempts failed`);
  throw lastError;
}

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
  // Skip if status is "paid"
  if (payment.status === "paid") {
    return false;
  }
  
  // Only proceed if status is "created"
  if (payment.status !== "created") {
    return false;
  }
  
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
    
    // Log payment status
    console.log(`Sending email to ${email} with payment status: ${customerData.status}`);
    
    // Get course type and other information for personalization
    const courseType = customerData.courseType || 'beginner'; // Default to beginner if not specified
    const utmSource = customerData.utmParameters?.utm_source || 'direct';
    
    // Extract and format price information if needed
    let priceData = {};
    
    // Extract amount from MongoDB document if present
    if (customerData.amount) {
      let actualAmount = 0;
      
      // Handle MongoDB number format if present
      if (customerData.amount.$numberInt) {
        actualAmount = parseInt(customerData.amount.$numberInt, 10);
      } else if (typeof customerData.amount === 'number') {
        actualAmount = customerData.amount;
      } else if (typeof customerData.amount === 'string') {
        actualAmount = parseInt(customerData.amount, 10);
      }
      
      // Convert from paise to rupees (if needed)
      const actualPrice = actualAmount / 100;
      
      // Calculate original price and savings based on course type
      let originalPrice = 0;
      if (courseType === 'advanced') {
        originalPrice = Math.ceil(actualPrice * 1.25); // 25% higher for advanced
      } else {
        originalPrice = Math.ceil(actualPrice * 1.5); // 50% higher for beginner
      }
      
      // Calculate savings
      const savings = originalPrice - actualPrice;
      
      // Format prices with commas and currency symbol
      const formatPrice = (price) => {
        return '₹' + price.toLocaleString('en-IN');
      };
      
      // Create price data object with formatted values
      priceData = {
        price: formatPrice(actualPrice),
        originalPrice: formatPrice(originalPrice),
        savings: formatPrice(savings)
      };
    }
    
    const emailContent = promotionalEmail(name, siteUrl, courseType, priceData);
   
    // Use the retry logic for sending emails
    const sendEmailWithRetry = async () => {
      return await resend.emails.send({
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
    };
    
    const response = await withRetry(sendEmailWithRetry);
    console.log(`Email sent to ${email} for course type: ${courseType}. Response:`, response);
    return response;
  } catch (error) {
    console.error(`Error sending email to ${customerData.customerDetails.email} after all retry attempts:`, error);
    throw error;
  }
}

async function processBatch(batch) {
  console.log(`Processing batch of ${batch.length} emails...`);
  
  const results = {
    successful: [],
    failed: []
  };
  
  // Process each email individually to better handle errors
  for (const payment of batch) {
    try {
      const result = await sendPromotionalEmail(payment);
      results.successful.push({
        email: payment.customerDetails.email,
        id: result.id
      });
    } catch (error) {
      // This error occurs after all retry attempts
      results.failed.push({
        email: payment.customerDetails.email,
        error: error.message
      });
    }
  }
  
  // Log summary of successes and failures
  console.log(`Batch complete. Successfully sent: ${results.successful.length}, Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('Failed emails:', results.failed.map(f => f.email).join(', '));
  }
  
  return results;
}

async function main() {
  try {
    // Connect to MongoDB
    const collection = await connectToMongoDB();
    
    // Fetch payments data
    const paymentsData = await fetchPaymentsData(collection);
    console.log(`Found ${paymentsData.length} payment records to process`);
    
    // Count by status
    const statusCounts = {
      created: 0,
      paid: 0,
      other: 0
    };
    
    paymentsData.forEach(payment => {
      if (payment.status === "created") statusCounts.created++;
      else if (payment.status === "paid") statusCounts.paid++;
      else statusCounts.other++;
    });
    
    console.log(`Payment status breakdown - Created: ${statusCounts.created}, Paid: ${statusCounts.paid}, Other: ${statusCounts.other}`);
    console.log(`Only processing payments with status "created" and ignoring "paid" status`);
    
    // Filter payments based on sourceUrl criteria and status
    const eligiblePayments = paymentsData.filter(payment => shouldSendEmail(payment));
    console.log(`${eligiblePayments.length} payments match the criteria for sending emails (correct status and course type)`);
    
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

// New function for SkillSet email route
async function connectToSkillSetMongoDB() {
  try {
    await skillsetClient.connect();
    console.log('Connected to SkillSet MongoDB');
    return skillsetClient.db().collection('orders');
  } catch (error) {
    console.error('Error connecting to SkillSet MongoDB:', error);
    throw error;
  }
}

async function fetchSkillSetOrders(collection) {
  try {
    const cursor = collection.find({});
    return await cursor.toArray();
  } catch (error) {
    console.error('Error fetching SkillSet orders:', error);
    throw error;
  }
}

function getCourseTypeFromSourceUrl(sourceUrl) {
  if (!sourceUrl) return 'default';
  
  // Handle URLs with query parameters (e.g., /checkout?course=ai)
  if (sourceUrl.includes('?course=')) {
    const courseParam = sourceUrl.split('?course=')[1];
    // Extract just the course part if there are additional parameters
    const cleanCourseParam = courseParam.split('&')[0];
    return cleanCourseParam;
  }
  
  // Check for AI route
  if (sourceUrl.includes('/ai')) return 'ai';
  
  // Check for Data Analyst route
  if (sourceUrl.includes('/data-analyst')) return 'data-analyst';
  
  // Check for ChatGPT route
  if (sourceUrl.includes('/chatgpt')) return 'chatgpt';
  
  // Check for Study Abroad route
  if (sourceUrl.includes('/studyabroad')) return 'studyabroad';
  
  // Check for LinkedIn route
  if (sourceUrl.includes('/linkedin')) return 'linkedin';
  
  // Check for AI Apps route
  if (sourceUrl.includes('/ai-apps')) return 'ai-apps';
  
  // Check for Immigrants route
  if (sourceUrl.includes('/immigrants')) return 'immigrants';
  
  // Check for Video Editing route
  if (sourceUrl.includes('/video-editing')) return 'video-editing';
  
  // Default case
  return 'default';
}

function shouldSendSkillSetEmail(order) {
  // Skip if status is "paid"
  if (order.status === "paid") {
    return false;
  }
  
  // Only proceed if status is "created"
  if (order.status !== "created") {
    return false;
  }

  // First check if courseType is explicitly specified in the order
  if (order.courseType) {
    return true;
  }
  
  // Otherwise check the sourceUrl
  const sourceUrl = order.sourceUrl || '';
  
  // Check for query parameter pattern
  if (sourceUrl.includes('?course=')) {
    return true;
  }
  
  // Check for path-based course types
  return sourceUrl.includes('/ai') ||
         sourceUrl.includes('/data-analyst') ||
         sourceUrl.includes('/chatgpt') ||
         sourceUrl.includes('/studyabroad') ||
         sourceUrl.includes('/linkedin') ||
         sourceUrl.includes('/ai-apps') ||
         sourceUrl.includes('/immigrants') ||
         sourceUrl.includes('/video-editing');
}

async function sendSkillSetEmail(orderData) {
  try {
    const { email, name } = orderData.customerDetails;
    const siteUrl = process.env.SKILLSET_URL;
    
    // Log payment status
    console.log(`Sending SkillSet email to ${email} with payment status: ${orderData.status}`);
    
    // Get course type - first try from orderData.courseType, then from sourceUrl
    let courseType = orderData.courseType || '';
    
    // If courseType is not specified in the order data, determine it from the sourceUrl
    if (!courseType) {
      const sourceUrl = orderData.sourceUrl || '';
      courseType = getCourseTypeFromSourceUrl(sourceUrl);
    }
    
    // Extract and format price information
    let priceData = {};
    
    // Extract amount from MongoDB document
    let actualAmount = 0;
    if (orderData.amount) {
      // Handle MongoDB number format if present
      if (orderData.amount.$numberInt) {
        actualAmount = parseInt(orderData.amount.$numberInt, 10);
      } else if (typeof orderData.amount === 'number') {
        actualAmount = orderData.amount;
      } else if (typeof orderData.amount === 'string') {
        actualAmount = parseInt(orderData.amount, 10);
      }
    }
    
    // Convert from paise to rupees (if needed)
    const actualPrice = actualAmount / 100;
    
    // Calculate original price (approximately 30% higher)
    const originalPrice = Math.ceil(actualPrice * 1.3);
    
    // Calculate savings
    const savings = originalPrice - actualPrice;
    
    // Format prices with commas and currency symbol
    const formatPrice = (price) => {
      return '₹' + price.toLocaleString('en-IN');
    };
    
    // Create price data object with formatted values
    priceData = {
      price: formatPrice(actualPrice),
      originalPrice: formatPrice(originalPrice),
      savings: formatPrice(savings)
    };
    
    // Generate email content with dynamic price data
    const emailContent = skillsetEmail(name, siteUrl, courseType, priceData);
    
    
    
    // Extract UTM parameters if available
    const utmSource = orderData.urlParameters?.utm_source || 
                      orderData.utmParameters?.utm_source || 
                      'direct';
    
    // Use the retry logic for sending emails
    const sendEmailWithRetry = async () => {
      return await resend.emails.send({
        from: process.env.FROM_EMAIL_SKILLSET,
        to: [email],
        subject: `Complete Your ${courseType.toUpperCase()} Course Registration - SkillSet Master`,
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
    };
    
    const response = await withRetry(sendEmailWithRetry);
    
    console.log(`SkillSet email sent to ${email} for course type: ${courseType}. Response:`, response);
    return response;
  } catch (error) {
    console.error(`Error sending SkillSet email to ${orderData.customerDetails.email} after all retry attempts:`, error);
    throw error;
  }
}

async function processSkillSetBatch(batch) {
  console.log(`Processing batch of ${batch.length} SkillSet emails...`);
  
  const results = {
    successful: [],
    failed: []
  };
  
  // Process each email individually to better handle errors
  for (const order of batch) {
    try {
      const result = await sendSkillSetEmail(order);
      results.successful.push({
        email: order.customerDetails.email,
        id: result.id
      });
    } catch (error) {
      // This error occurs after all retry attempts
      results.failed.push({
        email: order.customerDetails.email,
        error: error.message
      });
    }
  }
  
  // Log summary of successes and failures
  console.log(`SkillSet batch complete. Successfully sent: ${results.successful.length}, Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('Failed SkillSet emails:', results.failed.map(f => f.email).join(', '));
  }
  
  return results;
}

async function skillSetEmailRoute() {
  try {
    // Connect to MongoDB
    const collection = await connectToSkillSetMongoDB();
    
    // Fetch orders data
    const ordersData = await fetchSkillSetOrders(collection);
    console.log(`Found ${ordersData.length} SkillSet orders to process`);
    
    // Count by status
    const statusCounts = {
      created: 0,
      paid: 0,
      other: 0
    };
    
    ordersData.forEach(order => {
      if (order.status === "created") statusCounts.created++;
      else if (order.status === "paid") statusCounts.paid++;
      else statusCounts.other++;
    });
    
    console.log(`Order status breakdown - Created: ${statusCounts.created}, Paid: ${statusCounts.paid}, Other: ${statusCounts.other}`);
    console.log(`Only processing orders with status "created" and ignoring "paid" status`);
    
    // Filter orders based on criteria and status
    const eligibleOrders = ordersData.filter(order => shouldSendSkillSetEmail(order));
    console.log(`${eligibleOrders.length} orders match the criteria for sending emails (correct status and course type)`);
    
    // Handle duplicate emails by creating a Map with email as key
    const emailMap = new Map();
    
    // Process each order record, keeping only the most recent for each email
    eligibleOrders.forEach(order => {
      const email = order.customerDetails.email;
      
      // Get timestamp from MongoDB date format
      const currentDate = order.createdAt?.$date?.$numberLong 
        ? Number(order.createdAt.$date.$numberLong) 
        : new Date().getTime();
      
      // Compare with existing entry
      const existingDate = emailMap.get(email)?.createdAt?.$date?.$numberLong
        ? Number(emailMap.get(email).createdAt.$date.$numberLong)
        : 0;
      
      if (!emailMap.has(email) || currentDate > existingDate) {
        emailMap.set(email, order);
      }
    });
    
    console.log(`Found ${emailMap.size} unique emails to send to in SkillSet`);
    
    // Convert Map back to array and prepare for batch processing
    const uniqueOrders = Array.from(emailMap.values());
    
    // Process in batches of BATCH_SIZE
    for (let i = 0; i < uniqueOrders.length; i += BATCH_SIZE) {
      const batch = uniqueOrders.slice(i, i + BATCH_SIZE);
      console.log(`Processing SkillSet batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(uniqueOrders.length/BATCH_SIZE)}`);
      await processSkillSetBatch(batch);
      
      // If we have more batches to process, wait a bit to avoid rate limits
      if (i + BATCH_SIZE < uniqueOrders.length) {
        console.log('Waiting 5 seconds before processing next SkillSet batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('SkillSet email processing completed successfully');
  } catch (error) {
    console.error('Error in SkillSet email process:', error);
  } finally {
    // Close the MongoDB connection
    await skillsetClient.close();
    console.log('SkillSet MongoDB connection closed');
  }
}

/**
 * Check if a record's createdAt timestamp is at least 10 minutes old
 * @param {Object} record - The database record to check
 * @returns {Boolean} - True if record is older than 10 minutes, false otherwise
 */
function isOlderThanTenMinutes(record) {
  // Get the createdAt timestamp
  let createdAtTime;
  
  // Handle different datetime formats from MongoDB
  if (typeof record.createdAt === 'string') {
    // ISO format string: "2025-03-22T10:47:50.059+00:00"
    createdAtTime = new Date(record.createdAt);
  } else if (record.createdAt instanceof Date) {
    // Date object
    createdAtTime = record.createdAt;
  } else if (record.createdAt?.$date) {
    // MongoDB extended JSON format
    if (typeof record.createdAt.$date === 'string') {
      createdAtTime = new Date(record.createdAt.$date);
    } else if (record.createdAt.$date.$numberLong) {
      createdAtTime = new Date(Number(record.createdAt.$date.$numberLong));
    } else {
      console.log('Unrecognized createdAt format:', record.createdAt);
      return false; // Unknown format, skip to be safe
    }
  } else {
    console.log('Missing or invalid createdAt field:', record.createdAt);
    return false; // Missing timestamp, skip to be safe
  }
  
  // Get current time in UTC
  const currentTime = new Date();
  
  // Calculate the difference in milliseconds
  const differenceMs = currentTime - createdAtTime;
  
  // Convert to minutes
  const differenceMinutes = differenceMs / (1000 * 60);
  
  // Check if older than 10 minutes
  return differenceMinutes >= 10;
}

// Filter function for WhatsApp notifications with time check specifically for SkillSet
function shouldSendSkillSetWhatsApp(order) {
  const debug = false; // Set to true when you need detailed logging
  const orderId = order.orderId || 'unknown';
  
  // First check if status is "created"
  if (order.status !== "created") {
    debug && console.log(`Order ${orderId} - Status check failed: ${order.status}`);
    return false;
  }
  
  // Then check if the record is older than 10 minutes
  const isOlder = isOlderThanTenMinutes(order);
  if (!isOlder) {
    debug && console.log(`Order ${orderId} - Time check failed`);
    return false;
  }
  
  // Then check for course type without rechecking status
  // First check if courseType is explicitly specified in the order
  if (order.courseType) {
    debug && console.log(`Order ${orderId} - Passed with courseType: ${order.courseType}`);
    return true;
  }
  
  // Otherwise check the sourceUrl
  const sourceUrl = order.sourceUrl || '';
  
  // Check for query parameter pattern
  if (sourceUrl.includes('?course=')) {
    debug && console.log(`Order ${orderId} - Passed with course query param in URL: ${sourceUrl}`);
    return true;
  }
  
  // Check for path-based course types
  const hasCourseInPath = sourceUrl.includes('/ai') ||
         sourceUrl.includes('/data-analyst') ||
         sourceUrl.includes('/chatgpt') ||
         sourceUrl.includes('/studyabroad') ||
         sourceUrl.includes('/linkedin') ||
         sourceUrl.includes('/ai-apps') ||
         sourceUrl.includes('/immigrants') ||
         sourceUrl.includes('/video-editing');
         
  debug && console.log(`Order ${orderId} - Path check result: ${hasCourseInPath ? 'passed' : 'failed'} - URL: ${sourceUrl}`);
  
  return hasCourseInPath;
}

// Filter function for WhatsApp notifications with time check
function shouldSendWhatsAppNotification(record) {
  // First check if status is "created"
  if (record.status !== "created") {
    return false;
  }
  
  // Then check if the record is older than 10 minutes
  return isOlderThanTenMinutes(record);
}

/**
 * Sends a WhatsApp notification to the customer using Interakt.ai API
 * @param {Object} customerData - The customer data with contact and course information
 * @returns {Promise} - Response from Interakt.ai API
 */
async function sendWhatsAppNotification(customerData) {
  try {
    // Extract customer data
    const { name, phone } = customerData.customerDetails;
    
    // Log payment status
    console.log(`Processing WhatsApp notification for ${name} with payment status: ${customerData.status}`);
    
    // If no phone number is available, skip
    if (!phone) {
      console.log(`No phone number found for customer ${name}, skipping WhatsApp notification`);
      return { status: 'skipped', reason: 'no_phone_number' };
    }
    
    // Clean the phone number (remove +91 if present, spaces, etc.)
    let phoneNumber = phone.toString().trim();
    if (phoneNumber.startsWith('+91')) {
      phoneNumber = phoneNumber.substring(3);
    }
    // Remove any non-numeric characters
    phoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Validate phone number (should be 10 digits for India)
    if (phoneNumber.length !== 10) {
      console.log(`Invalid phone number for customer ${name}: ${phone}, skipping WhatsApp notification`);
      return { status: 'skipped', reason: 'invalid_phone_number' };
    }
    
    // Get course type
    const courseType = customerData.courseType || 'beginner'; // Default to beginner if not specified
    
    // Format course type name for display
    let courseDisplayName = courseType === 'advanced' ? '30 Days Coding - Advanced' : '30 Days Coding - Beginner';
    
    // Extract and format price information
    let formattedPrice = '₹999';
    
    if (customerData.amount) {
      let actualAmount = 0;
      
      // Handle MongoDB number format if present
      if (customerData.amount.$numberInt) {
        actualAmount = parseInt(customerData.amount.$numberInt, 10);
      } else if (typeof customerData.amount === 'number') {
        actualAmount = customerData.amount;
      } else if (typeof customerData.amount === 'string') {
        actualAmount = parseInt(customerData.amount, 10);
      }
      
      // Convert from paise to rupees (if needed)
      const actualPrice = actualAmount / 100;
      
      // Format price with commas and currency symbol
      formattedPrice = '₹' + actualPrice.toLocaleString('en-IN');
    }
    
    // Get the source URL for the button
    const sourceUrl = customerData.sourceUrl || `${process.env.SITE_URL}/checkout?course=${courseType}`;
    
    // Define the request data for Interakt.ai API
    const requestData = {
      countryCode: "+91",
      phoneNumber: phoneNumber,
      fullPhoneNumber: ``,
      campaignId: "", 
      callbackData: "some text here",
      type: "Template",
      template: {
        "name": "30dc_notification_di",
        "languageCode": "en",
        bodyValues: [
          name ,  // First variable - customer name
          courseDisplayName, // Second variable - course type
        ],
        buttonValues: {
          "1": [
            sourceUrl       // Button URL - course checkout page
          ]
        }
      }
    };
    
    // Use retry logic for sending WhatsApp messages
    const sendWhatsAppWithRetry = async () => {
      return await axios.post(
        'https://api.interakt.ai/v1/public/message/',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${process.env.INTERAKT_API_KEY}`
          }
        }
      );
    };
    
    const response = await withRetry(sendWhatsAppWithRetry);
    console.log(`WhatsApp notification sent to ${phoneNumber} for course type: ${courseType}`);
    return { 
      status: 'success', 
      phone: phoneNumber,
      courseType: courseType,
      responseData: response.data 
    };
  } catch (error) {
    console.error(`Error sending WhatsApp notification to ${customerData.customerDetails.phone} after all retry attempts:`, error.message);
    return { 
      status: 'failed', 
      phone: customerData.customerDetails.phone,
      error: error.message 
    };
  }
}


async function sendWhatsAppNotificationSkillSet(customerData) {
  try {
    // Extract customer data
    const { name, phone } = customerData.customerDetails;
    
    // Log payment status
    console.log(`Processing SkillSet WhatsApp notification for ${name} with payment status: ${customerData.status}`);
    
    // If no phone number is available, skip
    if (!phone) {
      console.log(`No phone number found for customer ${name}, skipping WhatsApp notification`);
      return { status: 'skipped', reason: 'no_phone_number' };
    }
    
    // Clean the phone number (remove +91 if present, spaces, etc.)
    let phoneNumber = phone.toString().trim();
    if (phoneNumber.startsWith('+91')) {
      phoneNumber = phoneNumber.substring(3);
    }
    // Remove any non-numeric characters
    phoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Validate phone number (should be 10 digits for India)
    if (phoneNumber.length !== 10) {
      console.log(`Invalid phone number for customer ${name}: ${phone}, skipping WhatsApp notification`);
      return { status: 'skipped', reason: 'invalid_phone_number' };
    }
    
    // Get course type - first try from customerData.courseType, then from sourceUrl
    let courseType = customerData.courseType || '';
    
    // If courseType is not specified in the order data, determine it from the sourceUrl
    if (!courseType) {
      const sourceUrl = customerData.sourceUrl || '';
      courseType = getCourseTypeFromSourceUrl(sourceUrl);
    }
    
    // Format course type name for display based on the specific SkillSet course
    let courseDisplayName;
    
    // Set the display name based on course type
    switch(courseType) {
      case 'ai':
        courseDisplayName = 'AI Tools Mastery';
        break;
      case 'data-analyst':
        courseDisplayName = 'Data Analytics';
        break;
      case 'chatgpt':
        courseDisplayName = 'ChatGPT & Prompt Engineering';
        break;
      case 'studyabroad':
        courseDisplayName = 'Study Abroad Program';
        break;
      case 'linkedin':
        courseDisplayName = 'LinkedIn Mastery';
        break;
      case 'ai-apps':
        courseDisplayName = 'AI Apps Development';
        break;
      case 'immigrants':
        courseDisplayName = 'Immigrants Success System';
        break;
      case 'video-editing':
        courseDisplayName = 'Video Editing Mastery';
        break;
      default:
        courseDisplayName = 'SkillSet Master Course';
    }
    
    // Declare formattedPrice variable
    let formattedPrice = '₹999';
    
    if (customerData.amount) {
      let actualAmount = 0;
      
      // Handle MongoDB number format if present
      if (customerData.amount.$numberInt) {
        actualAmount = parseInt(customerData.amount.$numberInt, 10);
      } else if (typeof customerData.amount === 'number') {
        actualAmount = customerData.amount;
      } else if (typeof customerData.amount === 'string') {
        actualAmount = parseInt(customerData.amount, 10);
      }
      
      // Convert from paise to rupees (if needed)
      const actualPrice = actualAmount / 100;
      
      // Format price with commas and currency symbol
      formattedPrice = '₹' + actualPrice.toLocaleString('en-IN');
    }
    
    // Get the source URL for the button
    const sourceUrl = customerData.sourceUrl || `${process.env.SKILLSET_URL}/${courseType}`;
    
    // Define the request data for Interakt.ai API
    const requestData = {
      countryCode: "+91",
      phoneNumber: phoneNumber,
      fullPhoneNumber: ``,
      campaignId: "", 
      callbackData: "some text here",
      type: "Template",
      template: {
        "name": "skillset_notification",  // Use skillset-specific template name
        "languageCode": "en",
        bodyValues: [
          name,  // First variable - customer name
          courseDisplayName, // Second variable - course type
        ],
        buttonValues: {
          "1": [
            sourceUrl  // Button URL - course checkout page
          ]
        }
      }
    };
    
    // Use retry logic for sending WhatsApp messages
    const sendWhatsAppWithRetry = async () => {
      return await axios.post(
        'https://api.interakt.ai/v1/public/message/',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${process.env.INTERAKT_API_KEY_SKILLSET || process.env.INTERAKT_API_KEY}`
          }
        }
      );
    };
    
    const response = await withRetry(sendWhatsAppWithRetry);
    console.log(`SkillSet WhatsApp notification sent to ${phoneNumber} for course type: ${courseType}`);
    return { 
      status: 'success', 
      phone: phoneNumber,
      courseType: courseType,
      responseData: response.data 
    };
  } catch (error) {
    console.error(`Error sending SkillSet WhatsApp notification to ${customerData.customerDetails.phone} after all retry attempts:`, error.message);
    return { 
      status: 'failed', 
      phone: customerData.customerDetails.phone,
      error: error.message 
    };
  }
}

/**
 * Process a batch of WhatsApp notifications
 * @param {Array} batch - Batch of customer data to process
 * @returns {Object} - Results of processing
 */
async function processWhatsAppBatch(batch) {
  console.log(`Processing batch of ${batch.length} WhatsApp notifications...`);
  
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };
  
  // Process each notification individually
  for (const customer of batch) {
    try {
      const result = await sendWhatsAppNotification(customer);
      
      if (result.status === 'success') {
        results.successful.push({
          phone: result.phone,
          courseType: result.courseType
        });
      } else if (result.status === 'skipped') {
        results.skipped.push({
          customer: customer.customerDetails.name,
          reason: result.reason
        });
      } else {
        results.failed.push({
          phone: customer.customerDetails.phone,
          error: result.error
        });
      }
    } catch (error) {
      results.failed.push({
        phone: customer.customerDetails.phone,
        error: error.message
      });
    }
  }
  
  // Log summary
  console.log(`WhatsApp batch complete. Successfully sent: ${results.successful.length}, Failed: ${results.failed.length}, Skipped: ${results.skipped.length}`);
  
  if (results.failed.length > 0) {
    console.log('Failed WhatsApp notifications:', results.failed.map(f => f.phone).join(', '));
  }
  
  return results;
}

/**
 * Process a batch of WhatsApp notifications for SkillSet
 * @param {Array} batch - Batch of customer data to process
 * @returns {Object} - Results of processing
 */
async function processWhatsAppBatchSkillSet(batch) {
  console.log(`Processing batch of ${batch.length} SkillSet WhatsApp notifications...`);
  
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };
  
  // Process each notification individually
  for (const customer of batch) {
    try {
      const result = await sendWhatsAppNotificationSkillSet(customer);
      
      if (result.status === 'success') {
        results.successful.push({
          phone: result.phone,
          courseType: result.courseType
        });
      } else if (result.status === 'skipped') {
        results.skipped.push({
          customer: customer.customerDetails.name,
          reason: result.reason
        });
      } else {
        results.failed.push({
          phone: customer.customerDetails.phone,
          error: result.error
        });
      }
    } catch (error) {
      results.failed.push({
        phone: customer.customerDetails.phone,
        error: error.message
      });
    }
  }
  
  // Log summary
  console.log(`SkillSet WhatsApp batch complete. Successfully sent: ${results.successful.length}, Failed: ${results.failed.length}, Skipped: ${results.skipped.length}`);
  
  if (results.failed.length > 0) {
    console.log('Failed SkillSet WhatsApp notifications:', results.failed.map(f => f.phone).join(', '));
  }
  
  return results;
}

/**
 * Main function for WhatsApp notification processing for both platforms with time check
 */
async function sendWhatsAppNotificationsBoth() {
  try {
    console.log('Starting WhatsApp notification process for both 30DC and SkillSet with 10-minute delay check');
    
    // Results object
    const results = {
      thirtyDC: {
        total: 0,
        eligible: 0,
        tooRecent: 0,
        sent: 0
      },
      skillSet: {
        total: 0,
        eligible: 0,
        tooRecent: 0,
        sent: 0
      }
    };
    
    // Process 30DC first
    console.log('Processing 30DC WhatsApp notifications...');
    const dcCollection = await connectToMongoDB();
    const dcPayments = await fetchPaymentsData(dcCollection);
    results.thirtyDC.total = dcPayments.length;
    
    // Count by status and time
    let dcStatusCounts = {
      created: 0,
      paid: 0,
      other: 0
    };
    
    let dcTimeCheckCounts = {
      olderThan10Min: 0,
      newerThan10Min: 0
    };
    
    dcPayments.forEach(payment => {
      if (payment.status === "created") {
        dcStatusCounts.created++;
        if (isOlderThanTenMinutes(payment)) {
          dcTimeCheckCounts.olderThan10Min++;
        } else {
          dcTimeCheckCounts.newerThan10Min++;
        }
      } else if (payment.status === "paid") {
        dcStatusCounts.paid++;
      } else {
        dcStatusCounts.other++;
      }
    });
    
    console.log(`30DC payment status breakdown - Created: ${dcStatusCounts.created}, Paid: ${dcStatusCounts.paid}, Other: ${dcStatusCounts.other}`);
    console.log(`30DC time check breakdown - Older than 10 minutes: ${dcTimeCheckCounts.olderThan10Min}, Newer than 10 minutes: ${dcTimeCheckCounts.newerThan10Min}`);
    
    // Apply both filters: correct status and time check
    const dc30EligiblePayments = dcPayments.filter(payment => {
      // Check status
      if (payment.status !== "created") {
        return false;
      }
      
      // Check time
      const isOlderThan10Min = isOlderThanTenMinutes(payment);
      if (!isOlderThan10Min) {
        results.thirtyDC.tooRecent++;
        return false;
      }
      
      // Also check source URL criteria
      const sourceUrl = payment.sourceUrl || '';
      if (sourceUrl.includes('?course=')) {
        const courseParam = sourceUrl.split('?course=')[1];
        return courseParam === 'beginner' || courseParam === 'advanced';
      }
      return sourceUrl.includes('/beginner') || sourceUrl.includes('/advanced');
    });
    
    results.thirtyDC.eligible = dc30EligiblePayments.length;
    console.log(`Found ${dc30EligiblePayments.length} eligible 30DC payments for WhatsApp (status "created", older than 10 minutes)`);
    
    // Handle duplicate customers for 30DC
    const dc30PhoneMap = new Map();
    dc30EligiblePayments.forEach(payment => {
      const phone = payment.customerDetails?.phone;
      if (!phone) return;
      
      const currentDate = payment.createdAt?.$date?.$numberLong 
        ? Number(payment.createdAt.$date.$numberLong) 
        : new Date(payment.createdAt).getTime();
      
      const existingDate = dc30PhoneMap.get(phone)?.createdAt?.$date?.$numberLong
        ? Number(dc30PhoneMap.get(phone).createdAt.$date.$numberLong)
        : dc30PhoneMap.get(phone)?.createdAt 
          ? new Date(dc30PhoneMap.get(phone).createdAt).getTime()
          : 0;
      
      if (!dc30PhoneMap.has(phone) || currentDate > existingDate) {
        dc30PhoneMap.set(phone, payment);
      }
    });
    
    const dc30UniqueCustomers = Array.from(dc30PhoneMap.values());
    console.log(`Found ${dc30UniqueCustomers.length} unique 30DC phone numbers to send WhatsApp notifications to`);
    
    // Process in batches
    for (let i = 0; i < dc30UniqueCustomers.length; i += WHATSAPP_BATCH_SIZE) {
      const batch = dc30UniqueCustomers.slice(i, i + WHATSAPP_BATCH_SIZE);
      console.log(`Processing 30DC WhatsApp batch ${Math.floor(i/WHATSAPP_BATCH_SIZE) + 1} of ${Math.ceil(dc30UniqueCustomers.length/WHATSAPP_BATCH_SIZE)}`);
      const batchResults = await processWhatsAppBatch(batch);
      results.thirtyDC.sent += batchResults.successful.length;
      
      if (i + WHATSAPP_BATCH_SIZE < dc30UniqueCustomers.length) {
        console.log('Waiting 5 seconds before processing next 30DC WhatsApp batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Close the 30DC MongoDB connection
    await client.close();
    console.log('30DC MongoDB connection closed after WhatsApp processing');
    
    // Process SkillSet next
    console.log('Processing SkillSet WhatsApp notifications...');
    const skillsetCollection = await connectToSkillSetMongoDB();
    const skillsetOrders = await fetchSkillSetOrders(skillsetCollection);
    results.skillSet.total = skillsetOrders.length;
    
    // Count by status and time for skillset
    let skillsetStatusCounts = {
      created: 0,
      paid: 0,
      other: 0
    };
    
    let skillsetTimeCheckCounts = {
      olderThan10Min: 0,
      newerThan10Min: 0
    };
    
    skillsetOrders.forEach(order => {
      if (order.status === "created") {
        skillsetStatusCounts.created++;
        if (isOlderThanTenMinutes(order)) {
          skillsetTimeCheckCounts.olderThan10Min++;
        } else {
          skillsetTimeCheckCounts.newerThan10Min++;
        }
      } else if (order.status === "paid") {
        skillsetStatusCounts.paid++;
      } else {
        skillsetStatusCounts.other++;
      }
    });
    
    console.log(`SkillSet order status breakdown - Created: ${skillsetStatusCounts.created}, Paid: ${skillsetStatusCounts.paid}, Other: ${skillsetStatusCounts.other}`);
    console.log(`SkillSet time check breakdown - Older than 10 minutes: ${skillsetTimeCheckCounts.olderThan10Min}, Newer than 10 minutes: ${skillsetTimeCheckCounts.newerThan10Min}`);
    
    // Log a sample of created orders to debug
    const createdOrders = skillsetOrders.filter(order => order.status === "created");
    if (createdOrders.length > 0) {
      console.log(`Sample of SkillSet order with "created" status:`, {
        orderId: createdOrders[0].orderId || 'N/A',
        status: createdOrders[0].status,
        courseType: createdOrders[0].courseType || 'N/A',
        sourceUrl: createdOrders[0].sourceUrl || 'N/A',
        createdAt: createdOrders[0].createdAt || 'N/A'
      });
      
      // Check the time difference for this order
      const sampleOrder = createdOrders[0];
      let createdAtTime;
      
      if (typeof sampleOrder.createdAt === 'string') {
        createdAtTime = new Date(sampleOrder.createdAt);
      } else if (sampleOrder.createdAt instanceof Date) {
        createdAtTime = sampleOrder.createdAt;
      } else if (sampleOrder.createdAt?.$date) {
        if (typeof sampleOrder.createdAt.$date === 'string') {
          createdAtTime = new Date(sampleOrder.createdAt.$date);
        } else if (sampleOrder.createdAt.$date.$numberLong) {
          createdAtTime = new Date(Number(sampleOrder.createdAt.$date.$numberLong));
        }
      }
      
      if (createdAtTime) {
        const currentTime = new Date();
        const differenceMs = currentTime - createdAtTime;
        const differenceMinutes = differenceMs / (1000 * 60);
        console.log(`Sample order creation time: ${createdAtTime.toISOString()}`);
        console.log(`Current time: ${currentTime.toISOString()}`);
        console.log(`Time difference: ${differenceMinutes.toFixed(2)} minutes`);
      }
    }
    
    // Apply both filters: correct status and time check for SkillSet
    let statusFilterCount = 0;
    let timeFilterCount = 0;
    let courseTypeFilterCount = 0;
    
    const skillsetEligibleOrders = skillsetOrders.filter(order => {
      // Use the specialized SkillSet WhatsApp eligibility function
      const isEligible = shouldSendSkillSetWhatsApp(order);
      
      // Count for debugging
      if (order.status === "created") {
        statusFilterCount++;
        
        if (isOlderThanTenMinutes(order)) {
          timeFilterCount++;
          
          // Check course type
          const hasCourseType = order.courseType || false;
          const sourceUrl = order.sourceUrl || '';
          const hasQueryCourse = sourceUrl.includes('?course=');
          const hasPathCourse = sourceUrl.includes('/ai') ||
                             sourceUrl.includes('/data-analyst') ||
                             sourceUrl.includes('/chatgpt') ||
                             sourceUrl.includes('/studyabroad') ||
                             sourceUrl.includes('/linkedin') ||
                             sourceUrl.includes('/ai-apps') ||
                             sourceUrl.includes('/immigrants') ||
                             sourceUrl.includes('/video-editing');
          
          if (hasCourseType || hasQueryCourse || hasPathCourse) {
            courseTypeFilterCount++;
          }
        } else {
          results.skillSet.tooRecent++;
        }
      }
      
      return isEligible;
    });
    
    console.log(`SkillSet filtering details - Passed status check: ${statusFilterCount}, Passed time check: ${timeFilterCount}, Passed course type check: ${courseTypeFilterCount}`);
    
    results.skillSet.eligible = skillsetEligibleOrders.length;
    console.log(`Found ${skillsetEligibleOrders.length} eligible SkillSet orders for WhatsApp (status "created", older than 10 minutes)`);
    
    // Handle duplicate customers for SkillSet
    const skillsetPhoneMap = new Map();
    skillsetEligibleOrders.forEach(order => {
      const phone = order.customerDetails?.phone;
      if (!phone) return;
      
      const currentDate = order.createdAt?.$date?.$numberLong 
        ? Number(order.createdAt.$date.$numberLong) 
        : new Date(order.createdAt).getTime();
      
      const existingDate = skillsetPhoneMap.get(phone)?.createdAt?.$date?.$numberLong
        ? Number(skillsetPhoneMap.get(phone).createdAt.$date.$numberLong)
        : skillsetPhoneMap.get(phone)?.createdAt 
          ? new Date(skillsetPhoneMap.get(phone).createdAt).getTime()
          : 0;
      
      if (!skillsetPhoneMap.has(phone) || currentDate > existingDate) {
        skillsetPhoneMap.set(phone, order);
      }
    });
    
    const skillsetUniqueCustomers = Array.from(skillsetPhoneMap.values());
    console.log(`Found ${skillsetUniqueCustomers.length} unique SkillSet phone numbers to send WhatsApp notifications to`);
    
    // Process in batches
    for (let i = 0; i < skillsetUniqueCustomers.length; i += WHATSAPP_BATCH_SIZE) {
      const batch = skillsetUniqueCustomers.slice(i, i + WHATSAPP_BATCH_SIZE);
      console.log(`Processing SkillSet WhatsApp batch ${Math.floor(i/WHATSAPP_BATCH_SIZE) + 1} of ${Math.ceil(skillsetUniqueCustomers.length/WHATSAPP_BATCH_SIZE)}`);
      const batchResults = await processWhatsAppBatchSkillSet(batch);
      results.skillSet.sent += batchResults.successful.length;
      
      if (i + WHATSAPP_BATCH_SIZE < skillsetUniqueCustomers.length) {
        console.log('Waiting 5 seconds before processing next SkillSet WhatsApp batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Close the SkillSet MongoDB connection
    await skillsetClient.close();
    console.log('SkillSet MongoDB connection closed after WhatsApp processing');
    
    // Return comprehensive results
    console.log('Combined WhatsApp notification processing completed successfully');
    return { 
      success: true, 
      message: 'WhatsApp notifications for both 30DC and SkillSet processed successfully',
      thirtyDC: {
        total: results.thirtyDC.total,
        eligible: results.thirtyDC.eligible,
        tooRecent: results.thirtyDC.tooRecent,
        sent: results.thirtyDC.sent
      },
      skillSet: {
        total: results.skillSet.total,
        eligible: results.skillSet.eligible,
        tooRecent: results.skillSet.tooRecent,
        sent: results.skillSet.sent
      }
    };
    
  } catch (error) {
    console.error('Error in combined WhatsApp notification process:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function for WhatsApp notification processing for 30DC
 * Wrapper for backward compatibility
 */
async function sendWhatsAppNotifications30DC() {
  try {
    console.log('Starting 30DC WhatsApp notification process via compatibility wrapper');
    
    // Call the combined function
    const result = await sendWhatsAppNotificationsBoth();
    
    // Extract just the 30DC results for compatibility
    return { 
      success: result.success, 
      message: 'WhatsApp notifications for 30DC processed successfully',
      total: result.thirtyDC.total,
      eligible: result.thirtyDC.eligible,
      sent: result.thirtyDC.sent
    };
  } catch (error) {
    console.error('Error in 30DC WhatsApp notification wrapper:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function for WhatsApp notification processing for SkillSet
 * Wrapper for backward compatibility
 */
async function sendWhatsAppNotificationsSkillSet() {
  try {
    console.log('Starting SkillSet WhatsApp notification process via compatibility wrapper');
    
    // Call the combined function
    const result = await sendWhatsAppNotificationsBoth();
    
    // Extract just the SkillSet results for compatibility
    return { 
      success: result.success, 
      message: 'WhatsApp notifications for SkillSet processed successfully',
      total: result.skillSet.total,
      eligible: result.skillSet.eligible,
      sent: result.skillSet.sent
    };
  } catch (error) {
    console.error('Error in SkillSet WhatsApp notification wrapper:', error);
    return { success: false, error: error.message };
  }
}

// Express API routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Email notification service is running' });
});

// API endpoint for 30 Days Coding emails
app.get('/api/send-emails/30dc', async (req, res) => {
  try {
    console.log('Starting 30 Days Coding email process via API');
    // Run the email sending process
    await main();
    res.status(200).json({ success: true, message: '30 Days Coding emails processed successfully' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint for SkillSet emails
app.get('/api/send-emails/skillset', async (req, res) => {
  try {
    console.log('Starting SkillSet email process via API');
    // Run the email sending process
    await skillSetEmailRoute();
    res.status(200).json({ success: true, message: 'SkillSet emails processed successfully' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to run both email and WhatsApp processes for 30DC
app.get('/api/send-all/30dc', async (req, res) => {
  try {
    console.log('Starting both email and WhatsApp processes for 30DC via API');
    
    // Run both processes sequentially
    await main();
    const whatsappResult = await sendWhatsAppNotifications30DC();
    
    res.status(200).json({ 
      success: true, 
      message: 'All 30DC notifications processed successfully',
      email: { success: true },
      whatsapp: whatsappResult
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to run both email processes
app.get('/api/send-emails/all', async (req, res) => {
  try {
    console.log('Starting both email processes via API');
    
    // Run both processes sequentially
    await main();
    await skillSetEmailRoute();
    
    res.status(200).json({ success: true, message: 'All emails processed successfully' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint for WhatsApp notifications for 30 Days Coding
app.get('/api/send-whatsapp/30dc', async (req, res) => {
  try {
    console.log('Starting 30 Days Coding WhatsApp notification process via API');
    const result = await sendWhatsAppNotifications30DC();
    res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint for WhatsApp notifications for SkillSet
app.get('/api/send-whatsapp/skillset', async (req, res) => {
  try {
    console.log('Starting SkillSet WhatsApp notification process via API');
    const result = await sendWhatsAppNotificationsSkillSet();
    res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to run both email and WhatsApp processes for SkillSet
app.get('/api/send-all/skillset', async (req, res) => {
  try {
    console.log('Starting both email and WhatsApp processes for SkillSet via API');
    
    // Run both processes sequentially
    await skillSetEmailRoute();
    const whatsappResult = await sendWhatsAppNotificationsSkillSet();
    
    res.status(200).json({ 
      success: true, 
      message: 'All SkillSet notifications processed successfully',
      email: { success: true },
      whatsapp: whatsappResult
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint for WhatsApp notifications for both platforms with time check
app.get('/whatsapp-notifi/bothskillsettand30dc', async (req, res) => {
  try {
    console.log('Starting combined WhatsApp notification process with 10-minute delay check via API');
    const result = await sendWhatsAppNotificationsBoth();
    res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start the Express server if this file is run directly
if (require.main === module) {
  // Start the Express server
  app.listen(PORT, () => {
    console.log(`Email notification service running on port ${PORT}`);
    
    // Determine which route to run based on process argument
    const routeArg = process.argv[2];

    // If run from command line, also execute the requested email function
    if (routeArg === 'skillset') {
      console.log('Running SkillSet email route');
      skillSetEmailRoute();
    } else if (routeArg === 'all') {
      console.log('Running both email routes');
      // Run both processes sequentially
      main().then(() => skillSetEmailRoute());
    } else if (routeArg === 'api-only') {
      console.log('Running in API-only mode, waiting for API requests');
    } else {
      console.log('Running default 30DayCoding email route');
      main();
    }
  });
}

// Export for testing or importing
module.exports = { 
  app, 
  main, 
  skillSetEmailRoute, 
  sendWhatsAppNotifications30DC,
  sendWhatsAppNotificationsSkillSet,
  sendWhatsAppNotificationsBoth
}; 