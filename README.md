# ClariMind 🎤🧠

**AI-Powered Voice Notes and Idea Structuring Mobile Application**

ClariMind is a full-stack mobile productivity application that transforms spoken thoughts into structured actionable ideas using AI.

It helps users quickly capture ideas through voice, transcribe them, organize them into structured notes, and store them for later retrieval.

---

# 🚀 Overview

ClariMind reduces friction between thinking and capturing ideas.

Users can:

* Record voice notes instantly
* Convert speech to text using AI
* Automatically structure raw thoughts into organized notes
* Save, edit, and manage ideas
* Access notes through a secure authenticated account

---

# ✨ Features

## 🎤 Voice Capture

* One-tap voice recording
* Fast audio note capture
* Real-time recording status feedback

## 📝 AI Transcription

* Speech-to-text transcription using AI
* Converts spoken ideas into editable text

## 🧠 AI Idea Structuring

Transforms raw thoughts into:

* Idea
* Features
* Purpose
* Next Steps

## 🔐 User Authentication

* Register/Login system
* Protected note access
* Token-based authentication

## 📚 Notes Management (CRUD)

* Create notes
* View notes
* Edit notes
* Delete notes

## 💾 Persistent Storage

* Notes stored in database
* User-specific note retrieval

## 🧪 Automated Testing

* Backend test suite with **10 passing tests**
* Authentication tests
* Authorization tests
* Notes CRUD endpoint tests

---

# 🏗 System Architecture

```text
React Native (Expo Mobile App)
        ↓
FastAPI REST Backend
        ↓
PostgreSQL Database
        ↓
OpenAI APIs (Transcription + Structuring)
```

---

# 🛠 Tech Stack

## Frontend

* TypeScript
* React Native
* Expo
* Expo Router
* Axios
* AsyncStorage

## Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* Uvicorn
* Pytest

## AI Integration

* OpenAI Whisper (Speech-to-Text)
* OpenAI GPT (Idea Structuring)

---

# 📱 Application Screens

Includes:

* Login / Registration
* Dashboard Home
* Voice Recorder
* Notes Management
* User Profile

---

# 🎬 Demo

Demo video:

```text
assets/demo.mp4
```

Shows:

* Recording workflow
* AI transcription
* Structured output
* Note saving
* Notes management

---

# ⚙️ Setup

## Clone Repository

```bash
git clone https://github.com/elnorailyosjonovna-lgtm/ClariMind.git
cd ClariMind
```

---

## Frontend Setup

```bash
npm install
npx expo start
```

Run in:

* Expo Go
* Android Emulator

---

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs:

```text
http://localhost:8000/docs
```

---

## Environment Variables

Create `.env`:

```env
OPENAI_API_KEY=your_key_here
```

---

# ✅ Testing

Run backend tests:

```bash
pytest tests/ -v
```

Current result:

```text
10 tests passing
```

---

# 📌 Project Scope

This project was developed as a **Final Year Project (MVP)** demonstrating:

* Full-stack mobile development
* AI integration
* Backend API design
* Database persistence
* Authentication
* Software testing
* UI/UX design

---

# 🔮 Future Improvements

Potential extensions:

* Search and filtering
* Idea tagging
* Export notes
* Cloud synchronization
* Team/shared notes
* Deployed backend
* Production mobile release

---

# 👤 Author

Developed by Elnora Normuratova as a Business Information Systems final-year project.


