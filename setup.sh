#!/bin/bash

echo " Setting up Project Licenta..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo " Node.js not installed"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo " Docker not installed"; exit 1; }
command -v conda >/dev/null 2>&1 || { echo " Conda not installed"; exit 1; }

# Frontend setup
echo " Setting up frontend..."
cd frontend
npm install
cp .env.example .env
echo " Frontend ready"


# Backend setup
echo " Setting up backend..."
cd ../backend
cp .env.example .env
echo " Backend ready (install Python deps manually with conda)"

# Database setup
echo " Starting PostgreSQL..."
cd ..
docker-compose up -d
echo " Database started"

echo ""
echo " Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your database password"
echo "2. Edit frontend/.env with your backend IP"
echo "3. cd backend && conda activate licenta_env && pip install -r requirements.txt"
echo "4. cd frontend && npm start"
