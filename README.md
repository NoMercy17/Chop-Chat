# Chop & Chat

A social cooking platform where users post dish photos, receive community feedback, and request paid critiques from professional chefs.

**Stack:** React Native (Expo) · Node.js / Express · PostgreSQL · Cloudinary · Stripe · Google Gemini Vision API

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Expo Go](https://expo.dev/go) app on your Android or iOS device, or an emulator

---

## 1. Clone the repository

```bash
git clone https://github.com/NoMercy17/Chop-Chat.git
cd Chop-Chat
```

---

## 2. Database setup

```bash
# Start the PostgreSQL container
docker compose up -d

# Apply the schema
psql -h localhost -p 5432 -U licenta_user -d licenta_db < chop_and_chat/backend/init.sql

# (Optional) Load sample data
psql -h localhost -p 5432 -U licenta_user -d licenta_db < chop_and_chat/backend/sample-data.sql
```

---

## 3. Backend setup

```bash
cd chop_and_chat/backend
npm install
```

Create a `.env` file in `chop_and_chat/backend/`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=licenta_user
DB_PASSWORD=mypassword
DB_NAME=licenta_db
PORT=4000
JWT_SECRET=<your_jwt_secret>
GEMINI_API_KEY=<your_gemini_api_key>
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
EMAIL_USER=<your_gmail>
EMAIL_PASS=<your_gmail_app_password>
BACKEND_URL=http://<your_machine_ip>:4000
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<your_stripe_webhook_secret>
STRIPE_CURRENCY=ron
```

Start the backend:

```bash
node index.js
```

---

## 4. Frontend setup

```bash
cd chop_and_chat
npm install
```

Create a `.env` file in `chop_and_chat/`:

```env
EXPO_PUBLIC_API_URL=http://<your_machine_ip>:4000
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=<your_cloud_name>
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your_upload_preset>
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
```

> **Note:** Use your machine's LAN IP (not `localhost`) when running on a physical device.

Start the Expo dev server:

```bash
npx expo start
```

Scan the QR code with Expo Go on your device, or press `a` for Android emulator / `i` for iOS simulator.

---

## Running tests

```bash
cd chop_and_chat/backend
npm test
```
