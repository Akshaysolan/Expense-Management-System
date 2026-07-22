# 💰 Expense Management System

A full-stack Expense Management System that helps users efficiently manage their daily income and expenses. The application provides secure authentication, expense tracking, category management, dashboards, and insightful reports to improve personal financial management.

---

## 🚀 Features

- 🔐 User Registration & Login
- 👤 Secure Authentication & Authorization
- 💵 Add Income & Expenses
- 📝 Update and Delete Transactions
- 🗂️ Expense Categorization
- 📅 Filter by Date, Category, or Month
- 📊 Dashboard with Financial Summary
- 📈 Income vs Expense Analytics
- 💾 Persistent Database Storage
- 📱 Responsive User Interface

---

# 🏗️ System Architecture

```
                User
                  │
                  ▼
         React Frontend
                  │
          REST API Calls
                  │
                  ▼
         Spring Boot Backend
                  │
     ┌────────────┴────────────┐
     │                         │
 Authentication           Expense Service
     │                         │
     └────────────┬────────────┘
                  ▼
             MySQL Database
```

---

# 🛠 Tech Stack

## Frontend

- React.js
- HTML5
- CSS3
- Bootstrap / Tailwind CSS
- Axios
- React Router

## Backend

- Java
- Spring Boot
- Spring MVC
- Spring Data JPA
- Spring Security (if applicable)

## Database

- MySQL

## Build Tools

- Maven
- npm

## Version Control

- Git
- GitHub

---

# 📂 Project Structure

```
Expense-Management-System
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   ├── services
│   └── assets
│
├── backend
│   ├── controller
│   ├── service
│   ├── repository
│   ├── entity
│   ├── config
│   └── dto
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/Akshaysolan/Expense-Management-System.git

cd Expense-Management-System
```

---

## Backend Setup

```bash
cd backend

mvn clean install

mvn spring-boot:run
```

Backend runs on:

```
http://localhost:8080
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm start
```

or

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

or

```
http://localhost:5173
```

---

# 📸 Screenshots

## Login

_Add Screenshot_

---

## Dashboard

_Add Screenshot_

---

## Add Expense

_Add Screenshot_

---

## Reports

_Add Screenshot_

---

# 🔄 Workflow

1. Register/Login
2. Authenticate User
3. Add Income
4. Add Expense
5. Categorize Transactions
6. Store Data in Database
7. Generate Dashboard Analytics
8. View Reports & Financial Summary

---

# 📊 Dashboard Features

- Total Income
- Total Expenses
- Current Balance
- Monthly Spending
- Category-wise Expenses
- Recent Transactions

---

# 🔒 Security Features

- User Authentication
- Password Encryption
- Session Management
- Protected API Endpoints
- Input Validation

---

# 📈 Future Enhancements

- 📱 Mobile Application
- 🌙 Dark Mode
- 📄 Export Reports (PDF/Excel)
- 📊 Advanced Charts
- 💳 Bank API Integration
- 🔔 Monthly Budget Notifications
- 🤖 AI Spending Analysis
- ☁️ Cloud Deployment

---

# 🧪 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register User |
| POST | /api/auth/login | Login |
| GET | /api/expenses | Get Expenses |
| POST | /api/expenses | Add Expense |
| PUT | /api/expenses/{id} | Update Expense |
| DELETE | /api/expenses/{id} | Delete Expense |

---

# 📌 Learning Outcomes

- Full Stack Development
- REST API Development
- CRUD Operations
- Spring Boot Architecture
- React State Management
- Database Design
- Authentication & Authorization
- MVC Architecture
- API Integration

---

# 👨‍💻 Author

**Akshay Solanke**

- GitHub: https://github.com/Akshaysolan
- LinkedIn: *(Add your LinkedIn Profile)*

---

# ⭐ Show Your Support

If you found this project helpful, please consider giving it a **⭐ Star** on GitHub.

---

# 📄 License

This project is licensed under the MIT License.
