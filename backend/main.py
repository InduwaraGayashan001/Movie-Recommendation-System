from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Union
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import os
import logging
import uvicorn
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Movie Recommendation API",
    description="API for movie search and recommendations using collaborative filtering",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class Movie(BaseModel):
    movieId: int
    title: str
    genres: str
    poster_path: Optional[str] = None
    tmdb_id: Optional[int] = None
    overview: Optional[str] = None
    vote_average: Optional[float] = Field(None, ge=0, le=10)
    vote_count: Optional[int] = Field(None, ge=0)
    release_date: Optional[str] = None
    runtime: Optional[int] = Field(None, ge=0)
    director: Optional[str] = None
    relevant_tags: Optional[List[str]] = None

    @validator('vote_average', 'vote_count', 'runtime', pre=True)
    def validate_numeric(cls, v):
        if v is None or pd.isna(v) or (isinstance(v, float) and not np.isfinite(v)):
            return None
        return v

    class Config:
        json_encoders = {
            float: lambda v: v if v is not None and not np.isnan(v) else None,
            int: lambda v: v if v is not None and not np.isnan(v) else None
        }

class Recommendation(BaseModel):
    score: float
    title: str
    genres: str
    poster_path: Optional[str] = None
    movieId: int

class SearchResponse(BaseModel):
    movies: List[Movie]

class RecommendationResponse(BaseModel):
    recommendations: List[Recommendation]

# TMDB API configuration
TMDB_API_KEY = os.getenv('TMDB_API_KEY')
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# Check if data files exist
if not os.path.exists("../movies.csv") or not os.path.exists("../ratings.csv") or not os.path.exists("../links.csv"):
    logger.error("Data files not found! Please ensure movies.csv, ratings.csv, and links.csv are in the root directory")
    raise FileNotFoundError("Data files not found! Please ensure movies.csv, ratings.csv, and links.csv are in the root directory")

try:
    # Load and prepare data
    logger.info("Loading movies data...")
    movies = pd.read_csv("../movies.csv")
    logger.info(f"Loaded {len(movies)} movies")

    logger.info("Loading ratings data...")
    ratings = pd.read_csv("../ratings.csv")
    logger.info(f"Loaded {len(ratings)} ratings")

    logger.info("Loading links data...")
    links = pd.read_csv("../links.csv")
    logger.info(f"Loaded {len(links)} links")

    # Merge movies with links to get TMDB IDs
    movies = movies.merge(links[['movieId', 'tmdbId']], on='movieId', how='left')
    logger.info("Merged movies with TMDB IDs")

    # Clean titles
    def clean_title(title):
        return re.sub("[^a-zA-Z0-9 ]", "", title)

    logger.info("Preparing movie titles...")
    movies["clean_title"] = movies["title"].apply(clean_title)

    # Create TF-IDF vectorizer
    logger.info("Creating TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(ngram_range=(1,2))
    tfidf = vectorizer.fit_transform(movies["clean_title"])
    logger.info("Data preparation complete!")

    # Load genome data
    genome_scores = pd.read_csv('genome-scores.csv')
    genome_tags = pd.read_csv('genome-tags.csv')
    tags = pd.read_csv('tags.csv')
except Exception as e:
    logger.error(f"Error during data preparation: {str(e)}")
    raise

def get_movie_poster(tmdb_id: int) -> Optional[dict]:
    if pd.isna(tmdb_id):
        return None
        
    try:
        # Get movie details from TMDB
        movie_url = f"{TMDB_BASE_URL}/movie/{int(tmdb_id)}"
        params = {
            "api_key": TMDB_API_KEY,
            "language": "en-US",
            "append_to_response": "credits"  # Include credits for director info
        }
        response = requests.get(movie_url, params=params)
        response.raise_for_status()
        
        data = response.json()
        result = {
            "poster_path": f"{TMDB_IMAGE_BASE_URL}{data.get('poster_path')}" if data.get('poster_path') else None,
            "overview": data.get('overview'),
            "vote_average": data.get('vote_average'),
            "vote_count": data.get('vote_count'),
            "release_date": data.get('release_date'),
            "runtime": data.get('runtime'),
            "director": next((crew['name'] for crew in data.get('credits', {}).get('crew', []) 
                            if crew['job'] == 'Director'), None)
        }
        return result
    except Exception as e:
        logger.error(f"Error fetching movie details for TMDB ID {tmdb_id}: {str(e)}")
    return None

def search(title: str) -> pd.DataFrame:
    try:
        logger.info(f"Searching for: {title}")
        title = clean_title(title)
        
        # 1. Title-based search
        query_vec = vectorizer.transform([title])
        similarity = cosine_similarity(query_vec, tfidf).flatten()
        indices = np.argpartition(similarity,-8)[-8:]
        results = movies.iloc[indices][::-1]
        
        # 2. Tag-based search
        # Get relevant tags for the search query
        query_tags = genome_tags[genome_tags['tag'].str.contains(title, case=False, na=False)]
        if not query_tags.empty:
            # Get movies with high relevance for these tags
            tag_scores = genome_scores[genome_scores['tagId'].isin(query_tags['tagId'])]
            movie_scores = tag_scores.groupby('movieId')['relevance'].mean().reset_index()
            movie_scores = movie_scores.sort_values('relevance', ascending=False)
            
            # Get top movies from tag-based search
            tag_based_movies = movies[movies['movieId'].isin(movie_scores['movieId'].head(8))]
            
            # Combine results from both searches
            results = pd.concat([results, tag_based_movies]).drop_duplicates(subset=['movieId'])
        
        # 3. Add TMDB details to results
        results['tmdb_details'] = results['tmdbId'].apply(lambda x: get_movie_poster(int(x)) if pd.notna(x) else None)
        
        # Extract poster path and other details, handling NaN values
        results['poster_path'] = results['tmdb_details'].apply(lambda x: x['poster_path'] if x else None)
        results['overview'] = results['tmdb_details'].apply(lambda x: x['overview'] if x else None)
        results['vote_average'] = results['tmdb_details'].apply(lambda x: float(x['vote_average']) if x and x['vote_average'] is not None else None)
        results['vote_count'] = results['tmdb_details'].apply(lambda x: int(x['vote_count']) if x and x['vote_count'] is not None else None)
        results['release_date'] = results['tmdb_details'].apply(lambda x: x['release_date'] if x else None)
        results['runtime'] = results['tmdb_details'].apply(lambda x: int(x['runtime']) if x and x['runtime'] is not None else None)
        results['director'] = results['tmdb_details'].apply(lambda x: x['director'] if x else None)
        
        # 4. Add relevant tags for each movie
        results['relevant_tags'] = results['movieId'].apply(lambda x: get_movie_tags(x))
        
        # Drop the temporary tmdb_details column
        results = results.drop('tmdb_details', axis=1)
        
        # Convert numeric columns to proper types and handle NaN values
        numeric_columns = ['vote_average', 'vote_count', 'runtime']
        for col in numeric_columns:
            results[col] = pd.to_numeric(results[col], errors='coerce')
            results[col] = results[col].apply(lambda x: x if pd.notna(x) and np.isfinite(x) else None)
        
        # Convert DataFrame to list of dictionaries and handle NaN values
        records = results.to_dict('records')
        for record in records:
            for key, value in record.items():
                if pd.isna(value) or (isinstance(value, float) and not np.isfinite(value)):
                    record[key] = None
        
        logger.info(f"Found {len(results)} results")
        return pd.DataFrame(records)
    except Exception as e:
        logger.error(f"Error in search function: {str(e)}")
        raise

def get_movie_tags(movie_id: int) -> List[str]:
    """Get relevant tags for a movie based on genome scores."""
    try:
        # Get top 5 tags by relevance score
        movie_tags = genome_scores[genome_scores['movieId'] == movie_id]
        movie_tags = movie_tags.sort_values('relevance', ascending=False).head(5)
        
        # Get tag names
        tag_names = genome_tags[genome_tags['tagId'].isin(movie_tags['tagId'])]['tag'].tolist()
        
        # Add user tags if available
        user_tags = tags[tags['movieId'] == movie_id]['tag'].unique().tolist()
        tag_names.extend(user_tags)
        
        # Remove duplicates and return
        return list(set(tag_names))
    except Exception as e:
        logger.error(f"Error getting tags for movie {movie_id}: {str(e)}")
        return []

def find_similar_movies(movie_id: int) -> pd.DataFrame:
    try:
        logger.info(f"Finding similar movies for movie ID: {movie_id}")
        similar_users = ratings[(ratings["movieId"]==movie_id)& (ratings["rating"]>4)]["userId"].unique()
        logger.info(f"Found {len(similar_users)} similar users")
        
        similar_users_recs = ratings[(ratings["userId"].isin(similar_users))& (ratings["rating"]>4)]["movieId"]
        similar_users_recs = similar_users_recs.value_counts() / len(similar_users)
        similar_users_recs = similar_users_recs[similar_users_recs>.1]

        all_users = ratings[(ratings["movieId"].isin(similar_users_recs.index))& (ratings["rating"]>4)]
        all_users_recs = all_users["movieId"].value_counts()/len(all_users["userId"].unique())
        
        rec_percentages = pd.concat([similar_users_recs, all_users_recs], axis=1)
        rec_percentages.columns = ["similar", "all"]
        
        rec_percentages["score"] = rec_percentages["similar"]/rec_percentages["all"]
        rec_percentages = rec_percentages.sort_values("score", ascending=False)
        
        # Get top 11 recommendations (we'll remove the current movie and keep top 10)
        results = rec_percentages.head(13).merge(movies, left_index=True, right_on="movieId")[["score", "title", "genres", "tmdbId", "movieId"]]
        
        # Remove the current movie from recommendations
        results = results[results["movieId"] != movie_id].head(12)
        
        # Normalize scores to 0-100 scale
        if not results.empty:
            min_score = results["score"].min()
            max_score = results["score"].max()
            if max_score > min_score:
                results["score"] = ((results["score"] - min_score) / (max_score - min_score)) * 100
            else:
                results["score"] = 100  # If all scores are the same, set to 100
        
        # Add TMDB details to results
        results['tmdb_details'] = results['tmdbId'].apply(lambda x: get_movie_poster(int(x)) if pd.notna(x) else None)
        
        # Extract poster path
        results['poster_path'] = results['tmdb_details'].apply(lambda x: x['poster_path'] if x else None)
        
        # Drop the temporary tmdb_details column
        results = results.drop('tmdb_details', axis=1)
        
        # Convert DataFrame to list of dictionaries and handle NaN values
        records = results.to_dict('records')
        for record in records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
        
        logger.info(f"Found {len(results)} recommendations")
        return pd.DataFrame(records)
    except Exception as e:
        logger.error(f"Error in find_similar_movies function: {str(e)}")
        raise

@app.get("/api/search", response_model=SearchResponse)
async def search_movies(query: str):
    try:
        logger.info(f"Processing search request for query: {query}")
        results = search(query)
        logger.info("Search completed successfully")
        return SearchResponse(movies=results.to_dict('records'))
    except Exception as e:
        logger.error(f"Error in search_movies endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(movieId: int):
    try:
        logger.info(f"Processing recommendations request for movie ID: {movieId}")
        recommendations = find_similar_movies(movieId)
        logger.info("Recommendations completed successfully")
        return RecommendationResponse(recommendations=recommendations.to_dict('records'))
    except Exception as e:
        logger.error(f"Error in get_recommendations endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/movie/{movie_id}", response_model=Movie)
async def get_movie(movie_id: int):
    try:
        logger.info(f"Getting details for movie ID: {movie_id}")
        movie = movies[movies["movieId"] == movie_id]
        if movie.empty:
            raise HTTPException(status_code=404, detail="Movie not found")
        
        movie_data = movie.iloc[0]
        # Get TMDB details
        tmdb_details = get_movie_poster(movie_data['tmdbId'])
        if tmdb_details:
            movie_data['poster_path'] = tmdb_details['poster_path']
            movie_data['overview'] = tmdb_details['overview']
            movie_data['vote_average'] = tmdb_details['vote_average']
            movie_data['vote_count'] = tmdb_details['vote_count']
            movie_data['release_date'] = tmdb_details['release_date']
            movie_data['runtime'] = tmdb_details['runtime']
            movie_data['director'] = tmdb_details['director']
        
        logger.info(f"Found movie: {movie_data['title']}")
        return movie_data.to_dict()
    except Exception as e:
        logger.error(f"Error in get_movie endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 