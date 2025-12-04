# 💰 AI Expense Tracker

A modern, responsive expense tracking application built to help users manage their finances. This project demonstrates a full-stack integration using React for the frontend and Google Firebase for backend services (Authentication & Database).

## 🚀 Features

 **Google Authentication:** Secure login/logout functionality using Firebase Auth.

 **Real-time Database:** Data persistence using Cloud Firestore (In Progress).

 **Responsive UI:** Fully adaptive design using Tailwind CSS.

 **Dynamic Dashboard:** Personalized user view with profile integration.

## 🛠️ Tech Stack

 **Frontend:** React (Vite), Tailwind CSS

 **Backend:** Firebase (Authentication, Firestore)

 **Language:** JavaScript (ES6+)

## ⚙️ Setup & Installation
Follow these steps to run the project locally.

1. Clone the repository

```
git clone https://github.com/YOUR_USERNAME/expense-tracker.git
cd expense-tracker
```

2. Install Dependencies

npm install

3. Configure Firebase

Create a project at Firebase Console.

Enable Authentication (Google Provider).

Enable Cloud Firestore (Database).

Create a file named src/firebaseConfig.js and paste your credentials:

JavaScript
```
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

4. Run the App

npm run dev

Open http://localhost:5173 in your browser.

.

## 📅 Development Roadmap
[x] Day 1: UI Shell & Tailwind Setup

[x] Day 2: Firebase Configuration & Connection

[x] Day 3: Google Authentication

[ ] Day 4: Adding Transactions (CRUD Operations)

[ ] Day 5: Real-time Updates & Deletion

[ ] Day 6: Deployment

## 🤝 Contributing
Contributions are welcome! Feel free to fork the repository and submit a pull request.