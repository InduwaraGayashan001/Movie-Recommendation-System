# Movie Recommendation System

A movie recommendation system that uses collaborative filtering to suggest movies based on user preferences and movie similarities.

## Features

- Search for movies by title
- Get personalized movie recommendations
- Modern and responsive UI
- Real-time search results

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment and activate it:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

3. Install the required packages:
```bash
python3 -m pip install -r requirements.txt
```

4. Run the Flask server:
```bash
python3 app.py
```

The backend server will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install the dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

## Usage

1. Open your browser and go to http://localhost:5173
2. Type a movie title in the search box (minimum 5 characters)
3. Click on a movie from the search results to see recommendations
4. View the recommended movies with their scores and genres

## Technologies Used

- Backend:
  - Flask
  - Pandas
  - Scikit-learn
  - NumPy

- Frontend:
  - React
  - TypeScript
  - Material-UI
  - Axios
