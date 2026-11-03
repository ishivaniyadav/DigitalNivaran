# DigitalNivaran
### ML-Based Smart Community Issue Intelligence Platform

A smart civic grievance management platform that uses Machine Learning to classify complaints, detect duplicate reports, assess issue priorities, and identify geographical hotspots.

<img width="1843" height="873" alt="Screenshot 2026-11-03 150919" src="https://github.com/user-attachments/assets/b6960756-60c8-4dcb-9f10-9163e9f5874d" />

<img width="1831" height="871" alt="Screenshot 2026-11-03 151026" src="https://github.com/user-attachments/assets/ed87d18b-c817-4c4c-90f1-77b3647bb438" />

## 🛠️ Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,js,html,css,nodejs,express,mongodb,python,git,github,vercel&perline=6" alt="Technology Stack" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" />
  <img src="https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
</p>

## ✨ Key Features

- 🔐 Secure JWT-based authentication
- 📝 Civic complaint registration and reporting
- 🤖 ML-based automatic complaint classification
- 🚨 Intelligent complaint priority assessment
- 🔍 Duplicate complaint detection
- 📍 DBSCAN-based geographical hotspot detection
- 📊 Analytics and authority dashboard
- 📷 Supporting evidence submission and review

## 🏗️ System Architecture

```text
       CITIZEN / AUTHORITY
               |
               v
        REACT FRONTEND
            VERCEL
               |
               v
       NODE.JS BACKEND
            RENDER
               |
          +----+----+
          |         |
          v         v
       MongoDB    PYTHON ML
        Atlas      SERVICE
                    RENDER
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       Category    Priority    Duplicate
      Prediction  Assessment   Detection
                      |
                      v
                DBSCAN Hotspots
```

## 💻 Technology Overview

| Layer | Technologies |
|---|---|
| Frontend | React.js, JavaScript, HTML, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT |
| Machine Learning | Python, Scikit-learn, FastAPI |
| Algorithms | TF-IDF, LinearSVC, DBSCAN, Sentence Transformers |
| Deployment | Vercel, Render |
| Version Control | Git, GitHub |

## 📂 Project Structure

```text
DigitalNivaran/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
├── ml-service/
│   ├── app/
│   ├── models/
│   └── requirements.txt
└── README.md
```

## 🚀 Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| ML Service | Render |
| Database | MongoDB Atlas |

## 🔮 Future Enhancements

- Multilingual complaint reporting
- Voice-based grievance registration
- Advanced image-based issue recognition
- Predictive analysis of recurring civic issues
- Real-time complaint notifications
- Municipal corporation integration

## 👩‍💻 Project Information

**Project:** Digital Nivaran  
**Domain:** Full-Stack Development | Machine Learning | Civic Technology

---

<p align="center">
  <b>Building smarter communities through technology. 💙</b>
</p>
