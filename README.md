# 🎬 FLICKIQ — AI-Powered Film Discovery

FLICKIQ is a Full Stack Machine Learning based Movie Recommendation System that helps users discover movies intelligently using AI-powered recommendation techniques.

The application provides a modern and interactive interface where users can search for movies and instantly get personalized recommendations along with posters and movie details.

---

## 📁 Project Structure

flickiq/
├── app.py                     # Backend API
├── main.py                    # FastAPI entry point
├── movies.pkl                 # Movie dataset
├── similarity.pkl             # Similarity matrix
├── requirements.txt
├── README.md
│
├── templates/
│   └── index.html             # Frontend UI
│
├── static/
│   ├── style.css
│   └── script.js

---

## 🚀 Quick Setup

### 1️⃣ Clone Repository

```bash id="0vc1xe"
git clone https://github.com/ritik12004/flickiq.git
2️⃣ Move Into Project Directory
cd flickiq
3️⃣ Create Virtual Environment
python -m venv .venv
4️⃣ Activate Virtual Environment
Windows PowerShell
.\.venv\Scripts\Activate.ps1
5️⃣ Install Dependencies
pip install -r requirements.txt
6️⃣ Run FastAPI Server
uvicorn main:app --reload
🌐 Open in Browser
http://127.0.0.1:8000
Swagger API Docs
http://127.0.0.1:8000/docs
🔴 Live Demo

👉 Add your deployed project link here:

https://your-live-link.com
🎨 Features
🎬 AI-powered movie recommendations
🔍 Smart movie search system
🧠 Content-based recommendation engine
🎥 Movie posters and details
⚡ FastAPI backend integration
🎨 Modern cinematic UI
📱 Fully responsive design
🚀 Fast and lightweight application
🧠 Recommendation System Details
Attribute	Details
Algorithm	Content-Based Filtering
Dataset	TMDB Movie Dataset
Libraries	Scikit-learn, Pandas, NumPy
Backend	FastAPI
Frontend	HTML, CSS, JavaScript
Output	Similar Movie Recommendations
⚙️ Technologies Used
Backend
Python
FastAPI
Scikit-learn
Pandas
NumPy
Frontend
HTML5
CSS3
JavaScript
🔄 Project Workflow
User searches for a movie
Frontend sends request to FastAPI backend
AI recommendation engine processes the input
Similar movies are generated instantly
Results are displayed with posters and movie details
🎯 Objective

This project was built to explore how Artificial Intelligence and Machine Learning can be used to create smart entertainment recommendation systems that improve movie discovery experience for users.

🔮 Future Improvements
User authentication system
Genre-based filtering
Watchlist feature
Movie ratings and reviews
Cloud deployment
Deep Learning recommendation engine
Voice-based movie search
🤝 Contribution

Contributions, suggestions, and improvements are always welcome. Feel free to fork the repository and experiment with new features.

📜 License

This project was created as a learning and portfolio project to demonstrate Machine Learning integration with Full Stack Web Development.

👨‍💻 Author

Ritik Gujre
B.Tech CSE Student
Machine Learning & Full Stack Development Enthusiast

📧 Email: ritik26cs103@satiengg.in
🐙 GitHub: https://github.com/ritik12004
💼 LinkedIn: https://www.linkedin.com/in/ritikgujre/


🌟 Support

If you like this project, give it a ⭐ on GitHub and share it with others.

