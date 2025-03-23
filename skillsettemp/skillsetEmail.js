const skillsetEmail = (name, siteUrl, courseType = 'ai', priceData = {}, checkoutUrlFromDb = null) => {
  // Customize the messaging based on course type
  let courseTypeMessage = '';
  let courseDetails = '';
  let checkoutUrl = '';
  let courseTitle = '';
  let courseTagline = '';
  
  // Set default price data if not provided
  const price = priceData.price || '₹999';
  const originalPrice = priceData.originalPrice || '₹1,999';
  const savings = priceData.savings || '₹1,000';
  
  switch(courseType) {
    case 'ai':
      courseTitle = 'AI Tools Mastery';
      courseTagline = '10x Your Career with AI';
      courseTypeMessage = 'Master AI Technologies in 2024';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">🔮</div>
          <div class="feature-content">
            <h3>Build AI-powered applications from scratch</h3>
            <p>Develop real-world AI projects that showcase your skills</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⚡</div>
          <div class="feature-content">
            <h3>Master ChatGPT and advanced prompt engineering</h3>
            <p>Create perfectly crafted prompts for any use case</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⚙️</div>
          <div class="feature-content">
            <h3>Create custom AI workflows and automation</h3>
            <p>Build systems that save hours of manual work</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🚀</div>
          <div class="feature-content">
            <h3>Deploy production-ready AI solutions</h3>
            <p>Scale your applications to enterprise level</p>
          </div>
        </div>
      </div>`;
      checkoutUrl = checkoutUrlFromDb ? 
        `${checkoutUrlFromDb}${checkoutUrlFromDb.includes('?') ? '&' : '?'}whatsemail=skillset` : 
        `${siteUrl}/ai?whatsemail=skillset`;
      break;
    
    case 'data-analyst':
      courseTitle = 'Data Analytics';
      courseTagline = 'Most in-demand skill of 2024';
      courseTypeMessage = 'Become a Data Analytics Expert';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div class="feature-content">
            <h3>Master Excel, SQL, and Power BI</h3>
            <p>Learn the essential tools of data analysis</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📈</div>
          <div class="feature-content">
            <h3>Build interactive dashboards and reports</h3>
            <p>Create visualizations that tell compelling stories</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🧮</div>
          <div class="feature-content">
            <h3>Perform advanced data analysis</h3>
            <p>Master statistical methods and predictive modeling</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💼</div>
          <div class="feature-content">
            <h3>Create data-driven business solutions</h3>
            <p>Translate insights into actionable business strategies</p>
          </div>
        </div>
      </div>`;
      checkoutUrl = checkoutUrlFromDb ? 
        `${checkoutUrlFromDb}${checkoutUrlFromDb.includes('?') ? '&' : '?'}whatsemail=skillset` : 
        `${siteUrl}/data-analyst?whatsemail=skillset`;
      break;
    
    case 'chatgpt':
      courseTitle = 'ChatGPT and Prompt Engineering';
      courseTagline = 'AI-Powered Content Creation';
      courseTypeMessage = 'Become a Prompt Engineering Expert';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">🤖</div>
          <div class="feature-content">
            <h3>Master ChatGPT and advanced prompt engineering</h3>
            <p>Create perfectly crafted prompts for any use case</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⚙️</div>
          <div class="feature-content">
            <h3>Create custom AI workflows and automation</h3>
            <p>Build systems that save hours of manual work</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🚀</div>
          <div class="feature-content">
            <h3>Deploy production-ready AI solutions</h3>
            <p>Scale your AI applications to enterprise level</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📝</div>
          <div class="feature-content">
            <h3>AI-powered content creation</h3>
            <p>Generate high-quality content for any purpose</p>
          </div>
        </div>
      </div>`;
      checkoutUrl = checkoutUrlFromDb ? 
        `${checkoutUrlFromDb}${checkoutUrlFromDb.includes('?') ? '&' : '?'}whatsemail=skillset` : 
        `${siteUrl}/chatgpt?whatsemail=skillset`;
      break;
      
    case 'studyabroad':
      courseTitle = 'Study Abroad';
      courseTagline = 'BS, MS from Top Universities';
      courseTypeMessage = 'Your Path to International Education';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">🎓</div>
          <div class="feature-content">
            <h3>Complete university application guide</h3>
            <p>Step-by-step process from selection to admission</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💼</div>
          <div class="feature-content">
            <h3>Preparation for internships and jobs</h3>
            <p>Build your professional profile for international markets</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🏫</div>
          <div class="feature-content">
            <h3>Strategies for college selection</h3>
            <p>Find the perfect university for your goals and budget</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📋</div>
          <div class="feature-content">
            <h3>Visa and documentation masterclass</h3>
            <p>Navigate complex paperwork with confidence</p>
          </div>
        </div>
      </div>`;
      checkoutUrl = checkoutUrlFromDb ? 
        `${checkoutUrlFromDb}${checkoutUrlFromDb.includes('?') ? '&' : '?'}whatsemail=skillset` : 
        `${siteUrl}/studyabroad?whatsemail=skillset`;
      break;
      
    case 'linkedin':
      courseTitle = 'LinkedIn Growth';
      courseTagline = 'Land your dream job';
      courseTypeMessage = 'Become a LinkedIn Influencer';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">💼</div>
          <div class="feature-content">
            <h3>Optimize your profile for recruiters</h3>
            <p>Get noticed by top companies and headhunters</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔗</div>
          <div class="feature-content">
            <h3>Build a powerful professional network</h3>
            <p>Connect with industry leaders and decision-makers</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📈</div>
          <div class="feature-content">
            <h3>Create viral LinkedIn content</h3>
            <p>Master the LinkedIn algorithm for maximum reach</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💰</div>
          <div class="feature-content">
            <h3>Generate leads and opportunities</h3>
            <p>Turn your profile into a lead generation machine</p>
          </div>
        </div>
      </div>`;
      checkoutUrl = checkoutUrlFromDb ? 
        `${checkoutUrlFromDb}${checkoutUrlFromDb.includes('?') ? '&' : '?'}whatsemail=skillset` : 
        `${siteUrl}/linkedin?whatsemail=skillset`;
      break;
      
    case 'ai-apps':
      courseTitle = 'Make websites and apps with AI';
      courseTagline = 'AI-powered websites in minutes';
      courseTypeMessage = 'Build Without Code Using AI';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">🌐</div>
          <div class="feature-content">
            <h3>Build websites using AI tools</h3>
            <p>Create professional sites without coding knowledge</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📱</div>
          <div class="feature-content">
            <h3>Create mobile apps without coding</h3>
            <p>Launch iOS and Android apps with AI assistance</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⚙️</div>
          <div class="feature-content">
            <h3>Deploy full-stack applications</h3>
            <p>Build complete solutions with databases and backends</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🤖</div>
          <div class="feature-content">
            <h3>Automate development workflow</h3>
            <p>Save hours with AI-powered development tools</p>
          </div>
        </div>
      </div>`;
      checkoutUrl = checkoutUrlFromDb ? 
        `${checkoutUrlFromDb}${checkoutUrlFromDb.includes('?') ? '&' : '?'}whatsemail=skillset` : 
        `${siteUrl}/ai-apps?whatsemail=skillset`;
      break;
      
    case 'immigrants':
      courseTitle = 'Immigrants Success System';
      courseTagline = 'Thrive as an Immigrant';
      courseTypeMessage = 'Build Your Life Abroad';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">🌎</div>
          <div class="feature-content">
            <h3>Navigate immigration processes</h3>
            <p>Understand visas, permits, and legal requirements</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💼</div>
          <div class="feature-content">
            <h3>Build a successful career abroad</h3>
            <p>Job search strategies for international professionals</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🤝</div>
          <div class="feature-content">
            <h3>Network effectively in a new country</h3>
            <p>Build meaningful connections in your new home</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🌍</div>
          <div class="feature-content">
            <h3>Overcome cultural and social challenges</h3>
            <p>Adapt to new environments with confidence</p>
          </div>
        </div>
      </div>`;
      checkoutUrl = checkoutUrlFromDb ? 
        `${checkoutUrlFromDb}${checkoutUrlFromDb.includes('?') ? '&' : '?'}whatsemail=skillset` : 
        `${siteUrl}/immigrants?whatsemail=skillset`;
      break;
      
    case 'video-editing':
      courseTitle = 'Video Editing';
      courseTagline = 'Create Professional Videos';
      courseTypeMessage = 'Master Professional Video Editing';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">🎬</div>
          <div class="feature-content">
            <h3>Master professional editing software</h3>
            <p>Learn industry-standard tools like Premiere Pro and Final Cut</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">✨</div>
          <div class="feature-content">
            <h3>Create stunning visual effects</h3>
            <p>Add professional VFX to your videos</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🎨</div>
          <div class="feature-content">
            <h3>Advanced color grading techniques</h3>
            <p>Give your videos a cinematic look</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔊</div>
          <div class="feature-content">
            <h3>Professional audio mixing</h3>
            <p>Perfect your sound design and audio quality</p>
          </div>
        </div>
      </div>`;
      checkoutUrl = checkoutUrlFromDb ? 
        `${checkoutUrlFromDb}${checkoutUrlFromDb.includes('?') ? '&' : '?'}whatsemail=skillset` : 
        `${siteUrl}/video-editing?whatsemail=skillset`;
      break;
      
    default:
      courseTitle = 'SkillSet Master';
      courseTagline = 'In-demand Skills for 2024';
      courseTypeMessage = 'Level Up Your Career';
      courseDetails = `<div class="course-features">
        <div class="feature-item">
          <div class="feature-icon">⚡</div>
          <div class="feature-content">
            <h3>AI and Future Technologies</h3>
            <p>Stay ahead with cutting-edge skills</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💼</div>
          <div class="feature-content">
            <h3>Career Advancement</h3>
            <p>Practical skills for professional growth</p>
          </div>
        </div>
      </div>`;
      checkoutUrl = checkoutUrlFromDb ? 
        `${checkoutUrlFromDb}${checkoutUrlFromDb.includes('?') ? '&' : '?'}whatsemail=skillset` : 
        `${siteUrl}?whatsemail=skillset`;
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${courseTitle} - SkillSet Master</title>
  <style>
    body {
      font-family: 'Inter', 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background-color: #f5f8fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      margin-top: 20px;
      margin-bottom: 20px;
      border: 2px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 2px solid #4338ca;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 18px;
      color: #ffffff;
      opacity: 0.9;
    }
    .course-title {
      margin: 20px 0 5px;
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
    }
    .course-tagline {
      font-size: 16px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      display: inline-block;
      margin-top: 6px;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
    .content {
      padding: 40px 30px;
      border-top: 1px solid #e2e8f0;
    }
    .hero-message {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    }
    .hero-message h2 {
      font-size: 26px;
      color: #1a1a1a;
      margin: 0 0 15px;
    }
    .price-section {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      padding: 25px;
      margin: 30px 0;
      text-align: center;
      border-radius: 12px;
      border: 2px solid #4338ca;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
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
      color: #7c3aed;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      display: inline-block;
      margin: 10px 0;
      border: 1px solid #e5e7eb;
    }
    .course-features {
      margin: 30px 0;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px;
      background-color: #f8fafc;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20px;
      padding: 16px;
      background-color: #ffffff;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }
    .feature-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      border-color: #c7d2fe;
    }
    .feature-item:last-child {
      margin-bottom: 10px;
    }
    .feature-icon {
      font-size: 24px;
      margin-right: 15px;
      background: #ffffff;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
    }
    .feature-content h3 {
      margin: 0 0 5px;
      color: #1a1a1a;
      font-size: 17px;
      font-weight: 600;
    }
    .feature-content p {
      margin: 0;
      color: #4b5563;
      font-size: 14px;
    }
    .guarantee {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background-color: #f9fafb;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    }
    .guarantee h3 {
      color: #1a1a1a;
      margin: 0 0 10px;
      font-weight: 600;
    }
    .guarantee p {
      color: #4b5563;
      margin: 0;
      font-size: 14px;
    }
    .cta-button {
      display: block;
      text-align: center;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 18px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 17px;
      margin: 30px 0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 2px solid #4338ca;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(124, 58, 237, 0.25);
    }
    .testimonials {
      margin: 40px 0;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 15px;
      background-color: #f8fafc;
    }
    .testimonial {
      padding: 20px;
      background-color: #ffffff;
      border-radius: 12px;
      margin-bottom: 15px;
      border: 2px solid #e5e7eb;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    }
    .testimonial-text {
      font-style: italic;
      color: #4b5563;
      margin-bottom: 15px;
    }
    .testimonial-author {
      display: flex;
      align-items: center;
    }
    .author-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 10px;
      background-color: #e5e7eb;
      border: 1px solid #d1d5db;
    }
    .author-name {
      font-weight: 600;
      color: #1a1a1a;
    }
    .author-title {
      font-size: 12px;
      color: #6b7280;
    }
    .footer {
      text-align: center;
      padding: 30px 20px;
      background-color: #f9fafb;
      color: #6b7280;
      font-size: 13px;
      border-top: 2px solid #e5e7eb;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-link {
      display: inline-block;
      margin: 0 8px;
      width: 36px;
      height: 36px;
      background-color: #7c3aed;
      border-radius: 50%;
      color: white;
      text-align: center;
      line-height: 36px;
      text-decoration: none;
      border: 1px solid #6d28d9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SkillSet Master</h1>
      <p>${courseTypeMessage}</p>
      <div class="course-title">${courseTitle}</div>
      <div class="course-tagline">${courseTagline}</div>
    </div>
    <div class="content">
      <div class="hero-message">
        <h2>Hi ${name}!</h2>
        <p>Thank you for your interest in our ${courseTitle} course. You're just one step away from transforming your skills and career.</p>
      </div>

      <div class="price-section">
        <p class="original-price">Original Price: ${originalPrice}</p>
        <p class="price-tag">${price}</p>
        <div class="savings">Save ${savings} Today!</div>
      </div>

      ${courseDetails}

      <a href="${checkoutUrl}" class="cta-button">Complete Your Registration →</a>
      
    </div>
    <div class="footer">
      <p>© 2025 SkillSet Master | Terms & Privacy</p>
    </div>
  </div>
</body>
</html>`;
};

module.exports = skillsetEmail; 