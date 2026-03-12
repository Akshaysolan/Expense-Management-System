// frontend/src/pages/SupportPage.js
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, BookOpen, Mail, Phone, MessageSquare, Video,
  ChevronDown, Send, CheckCircle, AlertCircle, Loader,
  Search, ExternalLink, Clock, ArrowRight, X, Zap
} from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// API Functions
const api = {
  // Get FAQs
  getFAQs: async () => {
    const response = await fetch(`${API_BASE_URL}/faqs/`);
    if (!response.ok) throw new Error('Failed to fetch FAQs');
    return response.json();
  },

  // Get Documents
  getDocuments: async () => {
    const response = await fetch(`${API_BASE_URL}/documents/`);
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  // Get Support Stats
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/stats/`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  // Submit Support Ticket
  submitTicket: async (ticketData) => {
    const response = await fetch(`${API_BASE_URL}/tickets/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });
    if (!response.ok) throw new Error('Failed to submit ticket');
    return response.json();
  },

  // Create Chat Session
  createChatSession: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to create chat session');
    return response.json();
  },

  // Send Chat Message
  sendChatMessage: async (sessionId, message) => {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/send/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  // Get Chat Messages
  getChatMessages: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages/`);
    if (!response.ok) throw new Error('Failed to get messages');
    return response.json();
  },

  // Close Chat Session
  closeChatSession: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/close/`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to close chat');
    return response.json();
  },

  // Submit FAQ Feedback
  submitFAQFeedback: async (faqId, isHelpful) => {
    const response = await fetch(`${API_BASE_URL}/faq/feedback/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faq: faqId, is_helpful: isHelpful })
    });
    if (!response.ok) throw new Error('Failed to submit feedback');
    return response.json();
  },

  // Book Video Call
  bookVideoCall: async (bookingData) => {
    const response = await fetch(`${API_BASE_URL}/video/book/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (!response.ok) throw new Error('Failed to book video call');
    return response.json();
  },

  // Get Real-time Stats
  getRealtimeStats: async () => {
    const response = await fetch(`${API_BASE_URL}/stats/realtime/`);
    if (!response.ok) throw new Error('Failed to fetch realtime stats');
    return response.json();
  },

  // Subscribe to Updates
  subscribeToUpdates: async (email) => {
    const response = await fetch(`${API_BASE_URL}/subscribe/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error('Failed to subscribe');
    return response.json();
  }
};

// ── Animated counter for stat numbers ──────────────────────
function AnimatedStat({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) return;
    const step = Math.ceil(end / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

// ── Toast notification ──────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      className={`sp-toast sp-toast--${type}`}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{    opacity: 0, y: 40, scale: 0.95 }}
    >
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
      <button className="sp-toast__close" onClick={onClose}><X size={14} /></button>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────
function SupportPage() {
  // State for data from API
  const [faqs, setFaqs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState({
    faqs: true,
    documents: true,
    stats: true
  });
  const [error, setError] = useState(null);

  // FAQ
  const [activeFaq, setActiveFaq] = useState(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqFilter, setFaqFilter] = useState('All');

  // Contact form
  const [contactForm, setContactForm] = useState({ 
    name: '', 
    email: '', 
    subject: '', 
    message: '', 
    priority: 'normal' 
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Live chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatTyping, setChatTyping] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Toast
  const [toast, setToast] = useState(null);

  // Active section (for smooth nav)
  const [activeSection, setActiveSection] = useState('cards');

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load all data in parallel
      const [faqsData, docsData, statsData] = await Promise.all([
        api.getFAQs(),
        api.getDocuments(),
        api.getStats()
      ]);

      setFaqs(faqsData);
      setDocuments(docsData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
      setToast({ type: 'error', message: 'Failed to load support data' });
    } finally {
      setLoading({ faqs: false, documents: false, stats: false });
    }
  };

  // ── scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── FAQ filtering
  const faqTags = ['All', ...new Set(faqs.map(f => f.tag))];

  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = faqSearch === '' ||
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase());
    const matchesFilter = faqFilter === 'All' || f.tag === faqFilter;
    return matchesSearch && matchesFilter;
  });

  // ── Form validation
  const validateForm = () => {
    const errors = {};
    if (!contactForm.name.trim()) errors.name = 'Name is required';
    if (!contactForm.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(contactForm.email)) errors.email = 'Invalid email address';
    if (!contactForm.subject.trim()) errors.subject = 'Subject is required';
    if (!contactForm.message.trim()) errors.message = 'Message is required';
    else if (contactForm.message.length < 20) errors.message = 'Message must be at least 20 characters';
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { 
      setFormErrors(errors); 
      return;
    }

    setFormLoading(true);
    try {
      const ticket = await api.submitTicket(contactForm);
      setFormSuccess(true);
      setContactForm({ name: '', email: '', subject: '', message: '', priority: 'normal' });
      setToast({ type: 'success', message: `Ticket #${ticket.ticket_id} created! We'll respond within 24 hours.` });
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to submit ticket. Please try again.' });
    } finally {
      setFormLoading(false);
    }
  };

  // ── Chat Functions
  const startChat = async () => {
    setChatLoading(true);
    try {
      const session = await api.createChatSession({
        name: 'Guest User', // In production, get from user context
        email: 'guest@example.com'
      });
      setChatSession(session);
      setChatMessages(session.messages || []);
      setChatOpen(true);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to start chat. Please try again.' });
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !chatSession) return;
    
    const userMsg = { 
      from: 'user', 
      text: chatInput.trim(), 
      time: 'now',
      sender_type: 'user',
      message: chatInput.trim()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatTyping(true);

    try {
      // Send message to backend
      await api.sendChatMessage(chatSession.session_id, chatInput.trim());
      
      // Simulate agent response (in production, this would come from WebSocket)
      setTimeout(async () => {
        const agentResponses = [
          "Got it! Let me look into that for you.",
          "Great question. You can find that option under Settings → Expenses.",
          "I can see your account details. Give me a moment to check.",
          "That's a known issue we're working on. Expected fix is in the next release.",
          "Would you like me to escalate this to our technical team?",
          "Done! I've updated your account settings."
        ];
        
        const reply = agentResponses[Math.floor(Math.random() * agentResponses.length)];
        const agentMsg = { 
          from: 'agent', 
          text: reply, 
          time: 'now',
          sender_type: 'agent',
          message: reply
        };
        
        setChatMessages(prev => [...prev, agentMsg]);
        setChatTyping(false);
      }, 1400);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to send message.' });
      setChatTyping(false);
    }
  };

  const handleChatKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      sendChatMessage(); 
    }
  };

  const closeChat = async () => {
    if (chatSession) {
      try {
        await api.closeChatSession(chatSession.session_id);
      } catch (err) {
        console.error('Failed to close chat properly:', err);
      }
    }
    setChatOpen(false);
    setChatSession(null);
    setChatMessages([]);
  };

  const handleFaqFeedback = async (faqId, isHelpful) => {
    try {
      await api.submitFAQFeedback(faqId, isHelpful);
      setToast({ type: 'success', message: 'Thanks for your feedback!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to submit feedback.' });
    }
  };

  const handleVideoBooking = async () => {
    try {
      // In production, show a modal to collect booking details
      const bookingData = {
        name: 'John Doe',
        email: 'john@example.com',
        preferred_date: '2024-01-20',
        preferred_time: '14:00',
        topic: 'Technical support needed'
      };
      const booking = await api.bookVideoCall(bookingData);
      setToast({ type: 'success', message: `Video call booked! Confirmation: ${booking.booking_id}` });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to book video call.' });
    }
  };

  const handleSubscribe = async (email) => {
    try {
      await api.subscribeToUpdates(email);
      setToast({ type: 'success', message: 'Successfully subscribed to updates!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to subscribe.' });
    }
  };

  // ── Scroll to section
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  // ── Stagger variants
  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } }
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (error && !faqs.length) {
    return (
      <div className="sp-error-state">
        <AlertCircle size={48} />
        <h2>Failed to load support content</h2>
        <p>{error}</p>
        <button onClick={loadInitialData} className="sp-btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="sp-page">

      {/* ── Toast ───────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ──────────────────────────────────────── */}
      <motion.div
        className="sp-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="sp-header__text">
          <h1 className="sp-header__title">
            Support <em>Center</em>
          </h1>
          <p className="sp-header__sub">
            Find answers, read documentation, or reach our team directly.
          </p>
        </div>

        {/* Quick nav pills */}
        <nav className="sp-quicknav">
          {[
            { id: 'cards',   label: 'Overview' },
            { id: 'stats',   label: 'Stats' },
            { id: 'faq',     label: 'FAQs' },
            { id: 'docs',    label: 'Docs' },
            { id: 'contact', label: 'Contact' },
          ].map(n => (
            <button
              key={n.id}
              className={`sp-quicknav__btn ${activeSection === n.id ? 'active' : ''}`}
              onClick={() => scrollTo(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </motion.div>

      {/* ── Support Cards ────────────────────────────────── */}
      <motion.div
        id="cards"
        className="sp-cards"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {[
          {
            icon: <HelpCircle size={26} />,
            color: '#f0b429',
            title: 'FAQ',
            desc: 'Instant answers to common questions',
            action: 'Browse FAQs',
            onClick: () => scrollTo('faq')
          },
          {
            icon: <BookOpen size={26} />,
            color: '#60a5fa',
            title: 'Documentation',
            desc: 'In-depth guides and user manuals',
            action: 'View Docs',
            onClick: () => scrollTo('docs')
          },
          {
            icon: <MessageSquare size={26} />,
            color: '#34d399',
            title: 'Live Chat',
            desc: 'Chat with a human agent, 24/7',
            action: 'Start Chat',
            onClick: startChat
          },
          {
            icon: <Mail size={26} />,
            color: '#ec4899',
            title: 'Email Support',
            desc: 'Get a response within 24 hours',
            action: 'Send Message',
            onClick: () => scrollTo('contact')
          },
          {
            icon: <Phone size={26} />,
            color: '#a78bfa',
            title: 'Phone Support',
            desc: '+1 (555) 123-4567  ·  Mon–Fri 9–6',
            action: 'Call Now',
            onClick: () => window.location.href = 'tel:+15551234567'
          },
          {
            icon: <Video size={26} />,
            color: '#fb923c',
            title: 'Video Call',
            desc: 'Book a screen-share session',
            action: 'Book Now',
            onClick: handleVideoBooking
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            className="sp-card"
            variants={fadeUp}
            whileHover={{ y: -5 }}
            style={{ '--card-color': card.color }}
          >
            <div className="sp-card__icon" style={{ background: `${card.color}18` }}>
              {React.cloneElement(card.icon, { color: card.color })}
            </div>
            <h3 className="sp-card__title">{card.title}</h3>
            <p  className="sp-card__desc">{card.desc}</p>
            <button className="sp-card__btn" onClick={card.onClick} disabled={card.loading}>
              {card.loading ? <Loader size={14} className="sp-spinner" /> : card.action}
              {!card.loading && <ArrowRight size={14} />}
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Stats Bar ────────────────────────────────────── */}
      <motion.div
        id="stats"
        className="sp-stats"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {loading.stats ? (
          <div className="sp-loading">Loading stats...</div>
        ) : (
          stats.map((s, i) => (
            <div key={i} className="sp-stat">
              <span className="sp-stat__value">
                <AnimatedStat value={s.value} suffix={s.suffix} />
              </span>
              <span className="sp-stat__label">{s.label}</span>
            </div>
          ))
        )}
      </motion.div>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="sp-section">
        <div className="sp-section__head">
          <h2 className="sp-section__title">Frequently Asked <em>Questions</em></h2>
          <p  className="sp-section__sub">Search or filter by category to find answers fast.</p>
        </div>

        {/* FAQ toolbar */}
        <div className="sp-faq-toolbar">
          <div className="sp-faq-search">
            <Search size={16} className="sp-faq-search__icon" />
            <input
              type="text"
              placeholder="Search FAQs…"
              value={faqSearch}
              onChange={e => setFaqSearch(e.target.value)}
              className="sp-faq-search__input"
            />
            {faqSearch && (
              <button className="sp-faq-search__clear" onClick={() => setFaqSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="sp-faq-filters">
            {faqTags.map(tag => (
              <button
                key={tag}
                className={`sp-faq-tag ${faqFilter === tag ? 'active' : ''}`}
                onClick={() => setFaqFilter(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ list */}
        <div className="sp-faq-list">
          {loading.faqs ? (
            <div className="sp-loading">Loading FAQs...</div>
          ) : (
            <AnimatePresence>
              {filteredFaqs.length === 0 ? (
                <motion.div
                  className="sp-empty"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                >
                  <HelpCircle size={32} />
                  <p>No FAQs match your search. Try different keywords.</p>
                </motion.div>
              ) : (
                filteredFaqs.map((faq, index) => (
                  <motion.div
                    key={faq.id || index}
                    className={`sp-faq-item ${activeFaq === index ? 'open' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <button
                      className="sp-faq-q"
                      onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                      aria-expanded={activeFaq === index}
                    >
                      <span className="sp-faq-q__tag">{faq.tag}</span>
                      <span className="sp-faq-q__text">{faq.question}</span>
                      <motion.span
                        className="sp-faq-q__chevron"
                        animate={{ rotate: activeFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <ChevronDown size={18} />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {activeFaq === index && (
                        <motion.div
                          className="sp-faq-a"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{   height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: 'easeInOut' }}
                        >
                          <div className="sp-faq-a__inner">
                            <p>{faq.answer}</p>
                            <div className="sp-faq-a__actions">
                              <span className="sp-faq-a__helpful">Was this helpful?</span>
                              <button
                                className="sp-faq-a__vote"
                                onClick={() => handleFaqFeedback(faq.id, true)}
                              >👍 Yes</button>
                              <button
                                className="sp-faq-a__vote"
                                onClick={() => {
                                  handleFaqFeedback(faq.id, false);
                                  scrollTo('contact');
                                }}
                              >👎 No — contact us</button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ── Documentation ────────────────────────────────── */}
      <section id="docs" className="sp-section">
        <div className="sp-section__head">
          <h2 className="sp-section__title">Documentation <em>&amp; Guides</em></h2>
          <p  className="sp-section__sub">Everything you need to master ExpensePro.</p>
        </div>

        <motion.div
          className="sp-docs-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {loading.documents ? (
            <div className="sp-loading">Loading documents...</div>
          ) : (
            documents.map((doc, i) => (
              <motion.a
                key={doc.id || i}
                href={doc.external_url || '#'}
                className="sp-doc-card"
                variants={fadeUp}
                whileHover={{ y: -4 }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sp-doc-card__emoji">{doc.icon}</span>
                <div className="sp-doc-card__body">
                  <h4 className="sp-doc-card__title">{doc.title}</h4>
                  <p  className="sp-doc-card__desc">{doc.description}</p>
                </div>
                <ExternalLink size={14} className="sp-doc-card__ext" />
              </motion.a>
            ))
          )}
        </motion.div>
      </section>

      {/* ── Contact ──────────────────────────────────────── */}
      <section id="contact" className="sp-section">
        <div className="sp-section__head">
          <h2 className="sp-section__title">Contact <em>Support</em></h2>
          <p  className="sp-section__sub">Choose your preferred channel or fill out the form below.</p>
        </div>

        {/* Contact quick options */}
        <div className="sp-contact-opts">
          {[
            { 
              icon: <MessageSquare size={22} />, 
              color: '#34d399', 
              label: 'Live Chat', 
              sub: '< 2 min wait',  
              action: 'Start Chat',   
              onClick: startChat,
              loading: chatLoading
            },
            { 
              icon: <Phone size={22} />,         
              color: '#a78bfa', 
              label: 'Phone',     
              sub: 'Mon–Fri 9–6 EST', 
              action: 'Call Now', 
              onClick: () => window.location.href = 'tel:+15551234567' 
            },
            { 
              icon: <Video size={22} />,         
              color: '#fb923c', 
              label: 'Video Call', 
              sub: 'By appointment', 
              action: 'Book',     
              onClick: handleVideoBooking 
            },
          ].map((opt, i) => (
            <motion.div
              key={i}
              className="sp-contact-opt"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ '--opt-color': opt.color }}
            >
              <div className="sp-contact-opt__icon" style={{ background: `${opt.color}18`, color: opt.color }}>
                {opt.icon}
              </div>
              <div className="sp-contact-opt__body">
                <h4>{opt.label}</h4>
                <p>{opt.sub}</p>
              </div>
              <button 
                className="sp-contact-opt__btn" 
                onClick={opt.onClick}
                disabled={opt.loading}
              >
                {opt.loading ? <Loader size={14} className="sp-spinner" /> : opt.action}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Contact form */}
        <motion.div
          className="sp-form-wrap"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="sp-form-header">
            <h3 className="sp-form-title">Send us a message</h3>
            <p className="sp-form-sub">
              <Clock size={13} /> Typical response within 24 hours
            </p>
          </div>

          <AnimatePresence mode="wait">
            {formSuccess ? (
              <motion.div
                className="sp-form-success"
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{   opacity: 0, scale: 0.92 }}
              >
                <div className="sp-form-success__icon">
                  <CheckCircle size={40} />
                </div>
                <h4>Message Sent!</h4>
                <p>Thank you for reaching out. Our team will respond to your inquiry within 24 hours.</p>
                <button
                  className="sp-btn-primary"
                  onClick={() => setFormSuccess(false)}
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="sp-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{   opacity: 0 }}
                noValidate
              >
                <div className="sp-form-row">
                  <div className={`sp-field ${formErrors.name ? 'error' : ''}`}>
                    <label className="sp-field__label">Full Name <span>*</span></label>
                    <input
                      type="text"
                      name="name"
                      className="sp-field__input"
                      placeholder="John Smith"
                      value={contactForm.name}
                      onChange={handleInputChange}
                      disabled={formLoading}
                    />
                    {formErrors.name && <span className="sp-field__err">{formErrors.name}</span>}
                  </div>

                  <div className={`sp-field ${formErrors.email ? 'error' : ''}`}>
                    <label className="sp-field__label">Email Address <span>*</span></label>
                    <input
                      type="email"
                      name="email"
                      className="sp-field__input"
                      placeholder="you@company.com"
                      value={contactForm.email}
                      onChange={handleInputChange}
                      disabled={formLoading}
                    />
                    {formErrors.email && <span className="sp-field__err">{formErrors.email}</span>}
                  </div>
                </div>

                <div className="sp-form-row">
                  <div className={`sp-field ${formErrors.subject ? 'error' : ''}`}>
                    <label className="sp-field__label">Subject <span>*</span></label>
                    <input
                      type="text"
                      name="subject"
                      className="sp-field__input"
                      placeholder="e.g. Expense submission issue"
                      value={contactForm.subject}
                      onChange={handleInputChange}
                      disabled={formLoading}
                    />
                    {formErrors.subject && <span className="sp-field__err">{formErrors.subject}</span>}
                  </div>

                  <div className="sp-field">
                    <label className="sp-field__label">Priority</label>
                    <select
                      name="priority"
                      className="sp-field__input"
                      value={contactForm.priority}
                      onChange={handleInputChange}
                      disabled={formLoading}
                    >
                      <option value="low">Low — general inquiry</option>
                      <option value="normal">Normal — needs attention</option>
                      <option value="high">High — urgent issue</option>
                      <option value="critical">Critical — production down</option>
                    </select>
                  </div>
                </div>

                <div className={`sp-field ${formErrors.message ? 'error' : ''}`}>
                  <label className="sp-field__label">
                    Message <span>*</span>
                    <span className="sp-field__count">{contactForm.message.length} / 1000</span>
                  </label>
                  <textarea
                    name="message"
                    className="sp-field__input sp-field__textarea"
                    placeholder="Describe your issue in detail. The more context you provide, the faster we can help."
                    value={contactForm.message}
                    onChange={handleInputChange}
                    rows={5}
                    maxLength={1000}
                    disabled={formLoading}
                  />
                  {formErrors.message && <span className="sp-field__err">{formErrors.message}</span>}
                </div>

                <div className="sp-form-actions">
                  <button
                    type="submit"
                    className="sp-btn-primary"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <><Loader size={16} className="sp-spinner" /> Sending…</>
                    ) : (
                      <><Send size={16} /> Send Message</>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ── Live Chat Drawer ──────────────────────────────── */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              className="sp-chat-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0 }}
              onClick={closeChat}
            />
            <motion.div
              className="sp-chat"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{   opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            >
              {/* Chat header */}
              <div className="sp-chat__header">
                <div className="sp-chat__agent">
                  <div className="sp-chat__avatar">M</div>
                  <div>
                    <p className="sp-chat__agent-name">Maya</p>
                    <p className="sp-chat__agent-status">
                      <span className="sp-chat__dot" /> Online · Support Agent
                    </p>
                  </div>
                </div>
                <button className="sp-chat__close" onClick={closeChat}>
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="sp-chat__body">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    className={`sp-chat__msg sp-chat__msg--${msg.from || msg.sender_type}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="sp-chat__bubble">{msg.text || msg.message}</div>
                  </motion.div>
                ))}
                {chatTyping && (
                  <div className="sp-chat__msg sp-chat__msg--agent">
                    <div className="sp-chat__bubble sp-chat__bubble--typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="sp-chat__footer">
                <input
                  type="text"
                  className="sp-chat__input"
                  placeholder="Type a message…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                />
                <button
                  className="sp-chat__send"
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Floating Chat Button ──────────────────────────── */}
      {!chatOpen && (
        <motion.button
          className="sp-fab"
          onClick={startChat}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          title="Open live chat"
          disabled={chatLoading}
        >
          {chatLoading ? <Loader size={22} className="sp-spinner" /> : <MessageSquare size={22} />}
          <span className="sp-fab__ping" />
        </motion.button>
      )}

    </div>
  );
}

export default SupportPage;