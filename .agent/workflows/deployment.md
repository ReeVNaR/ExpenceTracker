---
description: How to Deploy the MERN App
---

# Deployment Guide

This application is built with a React frontend (Vite) and a Node.js/Express backend (MongoDB). 
The recommended deployment strategy is to deploy the **Frontend** and **Backend** separately.

## 1. Prerequisites
- A GitHub account (Push your code to a new repository).
- A [MongoDB Atlas](https://www.mongodb.com/atlas/database) account for the potential production database.
- A [Render](https://render.com) or [Railway](https://railway.app) account for the Backend.
- A [Vercel](https://vercel.com) or [Netlify](https://netlify.com) account for the Frontend.

---

## 2. Deploy Backend (API)
We will use **Render** (Free Tier available) as an example.

1.  **Push your code** to GitHub.
2.  Log in to **Render**.
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Settings**:
    -   **Name**: `expense-tracker-api` (or similar)
    -   **Runtime**: `Node`
    -   **Build Command**: `npm install`
    -   **Start Command**: `npm start` (This runs `node server/index.js`)
6.  **Environment Variables** (Advanced / Environment tabs):
    -   Key: `MONGO_URI`
    -   Value: `your_mongodb_connection_string` (Make sure to whitelist `0.0.0.0/0` in MongoDB Atlas Network Access for cloud access).
    -   Key: `JWT_SECRET`
    -   Value: `some_secure_random_string`
7.  Click **Deploy**.
8.  Once deployed, copy the **Service URL** (e.g., `https://expense-tracker-api.onrender.com`).

---

## 3. Deploy Frontend (UI)
We will use **Vercel** (Free and Optimized for React).

1.  Log in to **Vercel**.
2.  Click **Add New...** -> **Project**.
3.  Import the same GitHub repository.
4.  **Framework Preset**: Select `Vite`.
5.  **Build Command**: `npm run build` (default).
6.  **Output Directory**: `dist` (default).
7.  **Environment Variables**:
    -   Key: `VITE_API_URL`
    -   Value: `https://expense-tracker-api.onrender.com/api` (The URL you got from step 2, appended with `/api`).
8.  Click **Deploy**.

---

## 4. Final Verify
1.  Open your Vercel URL.
2.  Try to Sign Up.
3.  If successful, your Frontend is talking to your Backend, which is writing to MongoDB.
