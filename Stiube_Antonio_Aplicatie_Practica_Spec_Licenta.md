# Chop & Chat — Practical Application

**Author:** Știube Antonio
**Specialization:** Computer Science and Information Technology

---

## Repository Link

[https://github.com/NoMercy17/Chop-Chat](https://github.com/NoMercy17/Chop-Chat)

Visibility: **public**

---

## Application Build Steps

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Docker](https://www.docker.com/)
- [Expo Go](https://expo.dev/go) on a physical device or Android/iOS emulator

### Clone the repository

```bash
git clone https://github.com/NoMercy17/Chop-Chat.git
cd Chop-Chat
```

### Install backend dependencies

```bash
cd chop_and_chat/backend
npm install
```

### Install frontend dependencies

```bash
cd chop_and_chat
npm install
```

---

## Application Installation and Launch Steps

### 1. Start the database

```bash
# From the project root
docker compose up -d

# Apply the schema
psql -h localhost -p 5432 -U licenta_user -d licenta_db < chop_and_chat/backend/init.sql

# (Optional) Load sample data
psql -h localhost -p 5432 -U licenta_user -d licenta_db < chop_and_chat/backend/sample-data.sql
```

### 2. Configure and launch the backend

Create `chop_and_chat/backend/.env` with the following variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=licenta_user
DB_PASSWORD=mypassword
DB_NAME=licenta_db
PORT=4000
JWT_SECRET=<secret>
GEMINI_API_KEY=<gemini_api_key>
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<cloudinary_api_key>
CLOUDINARY_API_SECRET=<cloudinary_api_secret>
EMAIL_USER=<gmail_address>
EMAIL_PASS=<gmail_app_password>
BACKEND_URL=http://<machine_ip>:4000
STRIPE_SECRET_KEY=<stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<stripe_webhook_secret>
STRIPE_CURRENCY=ron
```

Start the backend server:

```bash
cd chop_and_chat/backend
node index.js
```

### 3. Configure and launch the frontend

Create `chop_and_chat/.env` with the following variables:

```env
EXPO_PUBLIC_API_URL=http://<machine_ip>:4000
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud_name>
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<upload_preset>
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe_publishable_key>
```

> **Note:** Use your machine's LAN IP (not `localhost`) when running on a physical device.

Start the Expo dev server:

```bash
cd chop_and_chat
npx expo start
```

Scan the QR code with Expo Go on your device, or press `a` for Android emulator / `i` for iOS simulator.
