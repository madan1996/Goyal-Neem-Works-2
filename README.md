
# Goyal Neem Works - Premium Ayurvedic Store App

This is the complete source code for the **Goyal Neem Works** application, featuring a customer-facing store, a comprehensive Admin Dashboard, and AI-powered tools.

## Features

### 🌿 User App (Customer Side)
*   **Product Catalog**: Browse supplements, oils, and teas with filtering and sorting.
*   **Smart Search**: Instant search for products.
*   **Herbal Chatbot (Veda)**: AI assistant for ayurvedic advice (powered by Gemini).
*   **User Accounts**: Login/Signup, Profile Management, Order History.
*   **Creator Studio**: Edit images and create content within the app.
*   **Cart & Checkout**: Full shopping experience with Mock Payment Gateway.
*   **Accessibility**: Text-to-Speech (TTS) for product descriptions.

### 🛡️ Admin Panel (Control Center)
*   **Dashboard Overview**: Real-time stats on sales, users, and inventory.
*   **Product Management**: Strict control over inventory, pricing, SKU, and multiple images.
*   **User Management**: Role-based access (Admin, Editor, Viewer), Block/Unblock users.
*   **Order Management**: Track status from Pending to Delivered.
*   **Media Library**: Upload, compress, and manage assets.
*   **System Logs**: Detailed error tracking and audit trails for security.
*   **AI Avatar Studio**: Generate promotional videos using AI (MVP).

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally (Web)
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Build for Android (APK)
To convert this project into a native Android app:

1.  **Build the web assets:**
    ```bash
    npm run build
    ```
2.  **Add Android Platform:**
    ```bash
    npx cap add android
    ```
3.  **Sync & Open Android Studio:**
    ```bash
    npx cap sync
    npx cap open android
    ```
4.  **Generate APK:**
    Inside Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

## 🔐 Credentials (Mock Data)

*   **Super Admin**: `admin@veda.com` / `(any password)`
*   **Test User**: `rahul@example.com` / `(any password)`

## 🛠️ Tech Stack
*   **Framework**: React + Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **AI**: Google Gemini API
*   **Mobile**: Capacitor (for Android Build)

---
*Developed for Goyal Neem Works - Since 1995*
