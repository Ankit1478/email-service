const promotionalEmail = (name, siteUrl, courseType = 'beginner', priceData = {}, checkoutUrlFromDb = null) => {
  // Customize the messaging based on course type
  let courseTypeMessage = '';
  let courseDetails = '';
  let checkoutUrl = '';
  
  // Set default price data if not provided
  const price = priceData.price || '₹999';
  const originalPrice = priceData.originalPrice || (courseType === 'advanced' ? '₹3,999' : '₹1,999');
  const savings = priceData.savings || (courseType === 'advanced' ? '₹1,000' : '₹1,000');
  
  switch(courseType) {
    case 'beginner':
      courseTypeMessage = 'Start Your Coding Journey Today';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">🎯</div>
          <div class="feature-content">
            <h3>HTML & CSS Mastery</h3>
            <p>Build beautiful, responsive websites from scratch</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⚡</div>
          <div class="feature-content">
            <h3>JavaScript Essentials</h3>
            <p>Master modern JavaScript programming</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">☕</div>
          <div class="feature-content">
            <h3>Java Foundations</h3>
            <p>Learn enterprise-level programming</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🐍</div>
          <div class="feature-content">
            <h3>Python Basics</h3>
            <p>Get started with Python programming</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div class="feature-content">
            <h3>SQL Fundamentals</h3>
            <p>Master database management</p>
          </div>
        </div>
      </div>`;
      // Use the database URL if provided, otherwise fallback to constructed URL
      checkoutUrl = checkoutUrlFromDb || `${siteUrl}/checkout?course=beginner`;
      break;
  
    case 'advanced':
      courseTypeMessage = 'Elevate Your Tech Career';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">⚛️</div>
          <div class="feature-content">
            <h3>Full-Stack Development</h3>
            <p>React, Node.js, MongoDB, Express & Next.js</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🚀</div>
          <div class="feature-content">
            <h3>Advanced JavaScript</h3>
            <p>Modern patterns & enterprise architecture</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔗</div>
          <div class="feature-content">
            <h3>Blockchain & AI</h3>
            <p>Web3, Smart Contracts & AI Integration</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📈</div>
          <div class="feature-content">
            <h3>FAANG Interview Prep</h3>
            <p>DSA, System Design & Mock Interviews</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💡</div>
          <div class="feature-content">
            <h3>20+ Premium Courses</h3>
            <p>Complete tech stack coverage</p>
          </div>
        </div>
      </div>`;
      // Use the database URL if provided, otherwise fallback to constructed URL
      checkoutUrl = checkoutUrlFromDb || `${siteUrl}/checkout?course=advanced`;
      break;
    default:
      courseTypeMessage = 'Transform Your Career with Premium Tech Courses';
      // Use the database URL if provided, otherwise fallback to constructed URL
      checkoutUrl = checkoutUrlFromDb || `${siteUrl}/checkout`;
  }
  
  // Only proceed if we have a valid course type
  if (!courseType || (courseType !== 'beginner' && courseType !== 'advanced')) {
    throw new Error('Invalid course type specified');
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Tech Journey Begins - 30 Days Coding</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
      margin-top: 20px;
      margin-bottom: 20px;
    }
    .header {
      background-color: #0a0f16;
      color: #4ade80;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 18px;
      color: #ffffff;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .hero-message {
      text-align: center;
      margin-bottom: 30px;
    }
    .hero-message h2 {
      font-size: 28px;
      color: #0a0f16;
      margin: 0 0 15px;
    }
    .price-section {
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
      color: #ffffff;
      padding: 25px;
      margin: 30px 0;
      text-align: center;
      border-radius: 12px;
    }
    .price-tag {
      font-size: 42px;
      font-weight: 800;
      margin: 0;
      color: #ffffff;
    }
    .original-price {
      text-decoration: line-through;
      opacity: 0.7;
      font-size: 24px;
      margin: 5px 0;
    }
    .savings {
      background: #ffffff;
      color: #22c55e;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      display: inline-block;
      margin: 10px 0;
    }
    .course-features {
      margin: 30px 0;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .feature-icon {
      font-size: 24px;
      margin-right: 15px;
      background: #ffffff;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .feature-content h3 {
      margin: 0 0 5px;
      color: #0a0f16;
      font-size: 18px;
    }
    .feature-content p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }
    .guarantee {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background-color: #f8fafc;
      border-radius: 8px;
    }
    .guarantee h3 {
      color: #0a0f16;
      margin: 0 0 10px;
    }
    .guarantee p {
      color: #64748b;
      margin: 0;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      background-color: #f8fafc;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>30 Days Coding</h1>
      <p>${courseTypeMessage}</p>
    </div>
    <div class="content">
      <div class="hero-message">
        <h2>Welcome ${name}!</h2>
        <p>Your path to becoming a professional developer is just one step away.</p>
      </div>

      <div class="price-section">
        <p class="original-price">Original Price: ${originalPrice}</p>
        <p class="price-tag">${price}</p>
        <div class="savings">Save ${savings} Today!</div>
      </div>

      ${courseDetails}


      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 8px;" bgcolor="#4ade80">
                  <a href="${checkoutUrl}" 
                     style="font-size: 18px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 20px 40px; border: 0; display: inline-block; font-weight: bold; background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);">
                    Start Learning Now →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      
    </div>
    <div class="footer">
      <p>© 2024 30 Days Coding | Terms & Privacy</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = promotionalEmail; 