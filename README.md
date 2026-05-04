# Lost-n-Found

A comprehensive lost and found management system built with Python backends and a React frontend.

## 📋 Repository Structure

This project contains 5 main folders:
- **backend** - Main backend service with database and authentication
- **backend.IE** - Image Embedding service for image-based search
- **backend.TE** - Text Embedding service for text-based search
- **backend.VS** - Vector Search service for similarity matching
- **frontendv2** - React-based user interface (Vite + Tailwind CSS)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (for backend services)
- Node.js 16+ and npm (for frontend)
- Virtual environment setup capability

---

## Backend Setup

Each Python backend folder uses its own virtual environment and requirements.txt file.

### Backend Services Overview

| Service | Purpose | Key Dependencies |
|---------|---------|------------------|
| **backend** | Main API & Database | FastAPI, MongoDB, Qdrant, Authentication |
| **backend.IE** | Image Embedding | FastAPI, CLIP, PyTorch, Pillow |
| **backend.TE** | Text Embedding | FastAPI, Sentence Transformers |
| **backend.VS** | Vector Search | FastAPI, Qdrant Client |

### Setting Up Each Backend Service

#### 1. **backend** (Main Backend)
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Linux/Mac:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Dependencies:** pydantic, qdrant-client, python-dotenv, requests, fastapi, uvicorn, pymongo, cloudinary, motor, argon2-cffi, passlib, python-jose

---

#### 2. **backend.IE** (Image Embedding Service) >> Currently excluded from App
```bash
cd backend.IE

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Linux/Mac:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app:app --host 0.0.0.0 --port 8002
```

**Dependencies:** fastapi, pydantic, qdrant-client, python-dotenv, requests, uvicorn, pillow, torch, CLIP

---

#### 3. **backend.TE** (Text Embedding Service)
```bash
cd backend.TE

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Linux/Mac:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app:app --host 0.0.0.0 --port 8001
```

**Dependencies:** fastapi, uvicorn, pydantic, sentence-transformers

---

#### 4. **backend.VS** (Vector Search Service)
```bash
cd backend.VS

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Linux/Mac:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app:app --host 0.0.0.0 --port 8003
```

**Dependencies:** fastapi, pydantic, qdrant-client, python-dotenv, requests, uvicorn

---

## Frontend Setup

### React + Vite Frontend (frontendv2)

```bash
cd frontendv2

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build

# Preview production build
npm run preview

# Lint code
npm run lint
```

**Key Technologies:**
- React 19
- Vite (Fast build tool)
- Tailwind CSS (Styling)
- React Router DOM (Routing)
- Axios (HTTP client)
- Lucide React (Icons)

---

## 🔧 Environment Configuration

Create a `.env` file in each backend folder with necessary environment variables. Example for `backend`:

```env
MONGODB_URL=your_mongodb_url
QDRANT_URL=your_qdrant_url
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SECRET_KEY=your_secret_key
TEXT_EMBED_URL="http://localhost:8001/embed"
IMAGE_EMBED_URL="http://localhost:8002/embed"
SEARCH_SERVICE_URL="http://localhost:8003/search"
```

---

## 📦 Running All Services Together

To run all services:

**Terminal 1 - Main Backend:**
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Image Embedding Service:**
```bash
cd backend.IE
source .venv/bin/activate
uvicorn app:app --reload --port 8002
```

**Terminal 3 - Text Embedding Service:**
```bash
cd backend.TE
source .venv/bin/activate
uvicorn app:app --reload --port 8001
```

**Terminal 4 - Vector Search Service:**
```bash
cd backend.VS
source .venv/bin/activate
uvicorn app:app --reload --port 8003
```

**Terminal 5 - Frontend:**
```bash
cd frontendv2
npm run dev
```

---

## 📝 Notes

- Each backend service has its own virtual environment (`.venv`) to manage dependencies independently
- Do NOT commit `.venv` folders (they should be in `.gitignore`)
- Always activate the virtual environment before installing or running Python services
- The frontend uses Vite for fast hot module replacement during development
- Ensure all backend services are running before starting the frontend

---

## 📚 Technology Stack

**Backend:**
- FastAPI - Modern Python web framework
- MongoDB - NoSQL database
- Qdrant - Vector database for embeddings
- PyTorch - Deep learning framework
- Sentence Transformers - Text embedding models
- CLIP - Vision-language models for images

**Frontend:**
- React - UI library
- Vite - Build tool
- Tailwind CSS - Utility-first CSS
- React Router - Client-side routing
- Axios - HTTP requests

---

## 🎯 Project Statistics

- **JavaScript**: 66.2%
- **Python**: 21.7%
- **CSS**: 11.8%
- **HTML**: 0.3%

---

## 💡 Tips

- Use `.gitkeep` files in empty directories to preserve folder structure in git
- Always test backend services individually before integrating with frontend
- Keep environment variables secure and never commit `.env` files
- Run linting on frontend before committing: `npm run lint`

---

For more information or issues, please refer to the individual service documentation or create an issue in the repository.
