// frontend/src/pages/SupportPage.js
import React, { useState } from 'react';
import { FaQuestionCircle, FaBook, FaEnvelope, FaPhone, FaComments, FaVideo } from 'react-icons/fa';

function SupportPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const faqs = [
    {
      question: 'How do I submit an expense report?',
      answer: 'Go to the Expenses page and click on "Add Expense". Fill in the required details and submit. You can also upload receipts by clicking on "Add Receipt" in the Quick Access section.'
    },
    {
      question: 'How are approvals processed?',
      answer: 'When you submit an expense or trip request, it goes to your manager for approval. You can check the status in the Approvals page. You\'ll receive notifications when your request is approved or rejected.'
    },
    {
      question: 'Can I export expense data?',
      answer: 'Yes, you can export expense data from the Expenses page. Click the "Export" button to download your data in CSV or Excel format.'
    },
    {
      question: 'How do I create a trip request?',
      answer: 'Navigate to the Trips page and click "New Trip". Fill in the destination, dates, purpose, and estimated expenses. The request will be sent for approval.'
    },
    {
      question: 'What happens to unreported expenses?',
      answer: 'Unreported expenses appear in your Pending Tasks on the dashboard. You should report them within 30 days to ensure timely reimbursement.'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for contacting support. We will respond within 24 hours.');
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Support Center</h1>
      </div>

      <div className="support-grid">
        <div className="support-card">
          <FaQuestionCircle className="support-icon" />
          <h3>FAQ</h3>
          <p>Find answers to common questions</p>
          <a href="#faq">View FAQs →</a>
        </div>
        <div className="support-card">
          <FaBook className="support-icon" />
          <h3>Documentation</h3>
          <p>Read our user guides</p>
          <a href="#docs">View Docs →</a>
        </div>
        <div className="support-card">
          <FaEnvelope className="support-icon" />
          <h3>Email Support</h3>
          <p>support@expensemanager.com</p>
          <a href="#email">Send Email →</a>
        </div>
        <div className="support-card">
          <FaPhone className="support-icon" />
          <h3>Phone Support</h3>
          <p>+1 (555) 123-4567</p>
          <a href="#phone">Call Now →</a>
        </div>
      </div>

      <div className="support-section" id="faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <div 
                className="faq-question"
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <h3>{faq.question}</h3>
                <span className="faq-icon">{activeFaq === index ? '−' : '+'}</span>
              </div>
              {activeFaq === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="support-section" id="contact">
        <h2>Contact Support</h2>
        <div className="contact-options">
          <div className="contact-option">
            <FaComments className="contact-icon" />
            <h3>Live Chat</h3>
            <p>Available 24/7</p>
            <button className="btn-primary">Start Chat</button>
          </div>
          <div className="contact-option">
            <FaVideo className="contact-icon" />
            <h3>Video Call</h3>
            <p>Schedule a meeting</p>
            <button className="btn-primary">Book Now</button>
          </div>
          <div className="contact-option">
            <FaEnvelope className="contact-icon" />
            <h3>Email Form</h3>
            <p>Get a response within 24h</p>
            <button className="btn-primary">Send Message</button>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h3>Send us a message</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={contactForm.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={contactForm.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              name="subject"
              value={contactForm.subject}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea
              name="message"
              value={contactForm.message}
              onChange={handleInputChange}
              rows="5"
              required
            />
          </div>
          <button type="submit" className="btn-primary">Send Message</button>
        </form>
      </div>
    </div>
  );
}

export default SupportPage;