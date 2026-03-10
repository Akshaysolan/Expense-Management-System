// frontend/src/pages/SupportPage.js
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, BookOpen, Mail, Phone, MessageSquare, Video,
  ChevronDown, Send, CheckCircle, AlertCircle, Loader,
  Search, ExternalLink, Clock, ArrowRight, X, Zap
} from 'lucide-react';


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

// ── Data ────────────────────────────────────────────────────
const FAQS = [
  {
    question: 'How do I submit an expense report?',
    answer: 'Navigate to the Expenses page and click "Add Expense". Fill in the required details — amount, category, date, and description — then attach a receipt photo if required. Submit for manager approval. You can track status under My Expenses.',
    tag: 'Expenses'
  },
  {
    question: 'How are approvals processed?',
    answer: 'Once submitted, expense and trip requests route to your direct manager. Managers receive in-app notifications and email alerts. You can monitor live status in the Approvals page. Approved expenses are reimbursed in the next payroll cycle.',
    tag: 'Approvals'
  },
  {
    question: 'Can I export my expense data?',
    answer: 'Yes. On the Expenses page, click the Export button and choose CSV or Excel format. You can also generate formatted PDF reports from the Reports page, filtered by date range, category, or status.',
    tag: 'Reports'
  },
  {
    question: 'How do I create a trip request?',
    answer: 'Go to the Trips page and click "New Trip". Enter your destination, travel dates, purpose, and estimated expenses. Once submitted, your manager will review and approve it. You can then log expenses directly against the approved trip.',
    tag: 'Trips'
  },
  {
    question: 'What happens to unreported expenses?',
    answer: 'Unreported expenses appear as pending tasks on your dashboard. You should submit them within 30 days to ensure timely reimbursement. Expenses older than 90 days may require additional documentation and manager sign-off.',
    tag: 'Expenses'
  },
  {
    question: 'How do I change my password or update my profile?',
    answer: 'Click your avatar in the top-right corner and select Profile, or go to Settings → Account. From there you can update your name, contact info, department, and change your password. Changes take effect immediately.',
    tag: 'Account'
  },
  {
    question: 'Why was my expense rejected?',
    answer: 'Rejections include a reason from your manager, visible in the Approvals page and your notification feed. Common reasons include missing receipts, policy limit exceeded, or incorrect category. You can edit and resubmit directly from the expense detail page.',
    tag: 'Approvals'
  },
  {
    question: 'Is there a mobile app available?',
    answer: 'ExpensePro is fully responsive and works on any mobile browser. A dedicated iOS and Android app is on our roadmap — subscribe to our changelog to be notified on launch.',
    tag: 'General'
  }
];

const DOCS = [
  { title: 'Getting Started Guide',      icon: '🚀', desc: 'Set up your account and submit your first expense', href: '#' },
  { title: 'Expense Policy Overview',    icon: '📋', desc: 'Understand company spending limits and categories',  href: '#' },
  { title: 'Trip & Travel Handbook',     icon: '✈️', desc: 'Everything about booking trips and travel expenses',  href: '#' },
  { title: 'Approval Workflow Guide',    icon: '✅', desc: 'How approvals work for managers and finance teams',   href: '#' },
  { title: 'Reports & Analytics Manual', icon: '📊', desc: 'Generate and interpret expense reports',              href: '#' },
  { title: 'Admin Configuration Guide',  icon: '⚙️', desc: 'Setting up teams, categories, and policy rules',      href: '#' },
];

const STATS = [
  { value: '98',  suffix: '%',  label: 'Satisfaction rate' },
  { value: '2',   suffix: 'h',  label: 'Avg. response time' },
  { value: '24',  suffix: '/7', label: 'Live chat available' },
  { value: '50',  suffix: 'k+', label: 'Issues resolved' },
];

// ── Main Component ──────────────────────────────────────────
function SupportPage() {
  // FAQ
  const [activeFaq, setActiveFaq]       = useState(null);
  const [faqSearch,  setFaqSearch]      = useState('');
  const [faqFilter,  setFaqFilter]      = useState('All');

  // Contact form
  const [contactForm, setContactForm]   = useState({ name: '', email: '', subject: '', message: '', priority: 'normal' });
  const [formLoading,  setFormLoading]  = useState(false);
  const [formSuccess,  setFormSuccess]  = useState(false);
  const [formErrors,   setFormErrors]   = useState({});

  // Live chat mock
  const [chatOpen,   setChatOpen]       = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { from: 'agent', text: 'Hi! I\'m Maya from ExpensePro support. How can I help you today?', time: 'now' }
  ]);
  const [chatInput,  setChatInput]      = useState('');
  const [chatTyping, setChatTyping]     = useState(false);
  const chatEndRef = useRef(null);

  // Toast
  const [toast, setToast] = useState(null);

  // Active section (for smooth nav)
  const [activeSection, setActiveSection] = useState('cards');

  // ── scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── FAQ filtering
  const faqTags = ['All', ...new Set(FAQS.map(f => f.tag))];

  const filteredFaqs = FAQS.filter(f => {
    const matchesSearch = faqSearch === '' ||
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase());
    const matchesFilter = faqFilter === 'All' || f.tag === faqFilter;
    return matchesSearch && matchesFilter;
  });

  // ── Form validation
  const validateForm = () => {
    const errors = {};
    if (!contactForm.name.trim())         errors.name    = 'Name is required';
    if (!contactForm.email.trim())        errors.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(contactForm.email)) errors.email = 'Invalid email address';
    if (!contactForm.subject.trim())      errors.subject = 'Subject is required';
    if (!contactForm.message.trim())      errors.message = 'Message is required';
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
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setFormLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1800));
    setFormLoading(false);
    setFormSuccess(true);
    setContactForm({ name: '', email: '', subject: '', message: '', priority: 'normal' });
    setToast({ type: 'success', message: 'Message sent! We\'ll respond within 24 hours.' });
    setTimeout(() => setFormSuccess(false), 5000);
  };

  // ── Chat
  const agentReplies = [
    'Got it! Let me look into that for you.',
    'Great question. You can find that option under Settings → Expenses.',
    'I can see your account details. Give me a moment to check.',
    'That\'s a known issue we\'re working on. Expected fix is in the next release.',
    'Would you like me to escalate this to our technical team?',
    'Done! I\'ve updated your account settings.',
  ];

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { from: 'user', text: chatInput.trim(), time: 'now' };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatTyping(true);
    setTimeout(() => {
      const reply = agentReplies[Math.floor(Math.random() * agentReplies.length)];
      setChatMessages(prev => [...prev, { from: 'agent', text: reply, time: 'now' }]);
      setChatTyping(false);
    }, 1400);
  };

  const handleChatKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
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
            onClick: () => setChatOpen(true)
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
            onClick: () => setToast({ type: 'success', message: 'Booking link sent to your email!' })
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
            <button className="sp-card__btn" onClick={card.onClick}>
              {card.action} <ArrowRight size={14} />
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
        {STATS.map((s, i) => (
          <div key={i} className="sp-stat">
            <span className="sp-stat__value">
              <AnimatedStat value={s.value} suffix={s.suffix} />
            </span>
            <span className="sp-stat__label">{s.label}</span>
          </div>
        ))}
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
          <AnimatePresence>
            {filteredFaqs.length === 0 ? (
              <motion.div
                className="sp-empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <HelpCircle size={32} />
                <p>No FAQs match your search. Try different keywords.</p>
              </motion.div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
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
                              onClick={() => setToast({ type: 'success', message: 'Thanks for your feedback!' })}
                            >👍 Yes</button>
                            <button
                              className="sp-faq-a__vote"
                              onClick={() => scrollTo('contact')}
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
          {DOCS.map((doc, i) => (
            <motion.a
              key={i}
              href={doc.href}
              className="sp-doc-card"
              variants={fadeUp}
              whileHover={{ y: -4 }}
            >
              <span className="sp-doc-card__emoji">{doc.icon}</span>
              <div className="sp-doc-card__body">
                <h4 className="sp-doc-card__title">{doc.title}</h4>
                <p  className="sp-doc-card__desc">{doc.desc}</p>
              </div>
              <ExternalLink size={14} className="sp-doc-card__ext" />
            </motion.a>
          ))}
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
            { icon: <MessageSquare size={22} />, color: '#34d399', label: 'Live Chat', sub: '< 2 min wait',  action: 'Start Chat',   onClick: () => setChatOpen(true) },
            { icon: <Phone size={22} />,         color: '#a78bfa', label: 'Phone',     sub: 'Mon–Fri 9–6 EST', action: 'Call Now', onClick: () => window.location.href = 'tel:+15551234567' },
            { icon: <Video size={22} />,         color: '#fb923c', label: 'Video Call', sub: 'By appointment', action: 'Book',     onClick: () => setToast({ type: 'success', message: 'Booking link sent to your email!' }) },
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
              <button className="sp-contact-opt__btn" onClick={opt.onClick}>
                {opt.action}
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
              onClick={() => setChatOpen(false)}
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
                <button className="sp-chat__close" onClick={() => setChatOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="sp-chat__body">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    className={`sp-chat__msg sp-chat__msg--${msg.from}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="sp-chat__bubble">{msg.text}</div>
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
          onClick={() => setChatOpen(true)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          title="Open live chat"
        >
          <MessageSquare size={22} />
          <span className="sp-fab__ping" />
        </motion.button>
      )}

    </div>
  );
}

export default SupportPage;