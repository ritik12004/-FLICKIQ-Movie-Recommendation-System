import os
import pickle
from typing import Optional, List, Dict, Any, Tuple

import numpy as np
import pandas as pd
import httpx

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv


# =========================
# LOAD ENV
# =========================
load_dotenv()

# FIXED HERE 
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_IMG_500 = "https://image.tmdb.org/t/p/w500"

if not TMDB_API_KEY:
    raise RuntimeError(
        "TMDB_API_KEY missing. Put it in .env as TMDB_API_KEY=your_api_key"
    )


# =========================
# FASTAPI APP
# =========================
app = FastAPI(title="Movie Recommender API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# FILE PATHS
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DF_PATH = os.path.join(BASE_DIR, "df.pkl")
INDICES_PATH = os.path.join(BASE_DIR, "indices.pkl")
TFIDF_MATRIX_PATH = os.path.join(BASE_DIR, "tfidf_matrix.pkl")
TFIDF_PATH = os.path.join(BASE_DIR, "tfidf.pkl")


# =========================
# GLOBAL VARIABLES
# =========================
df: Optional[pd.DataFrame] = None
indices_obj: Any = None
tfidf_matrix: Any = None
tfidf_obj: Any = None

TITLE_TO_IDX: Optional[Dict[str, int]] = None


# =========================
# MODELS
# =========================
class TMDBMovieCard(BaseModel):
    tmdb_id: int
    title: str
    poster_url: Optional[str] = None
    release_date: Optional[str] = None
    vote_average: Optional[float] = None


class TMDBMovieDetails(BaseModel):
    tmdb_id: int
    title: str
    overview: Optional[str] = None
    release_date: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    genres: List[dict] = []


class TFIDFRecItem(BaseModel):
    title: str
    score: float
    tmdb: Optional[TMDBMovieCard] = None


# =========================
# UTILS
# =========================
def _norm_title(t: str) -> str:
    return str(t).strip().lower()


def make_img_url(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    return f"{TMDB_IMG_500}{path}"


async def tmdb_get(path: str, params: Dict[str, Any]) -> Dict[str, Any]:
    params["api_key"] = TMDB_API_KEY

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(f"{TMDB_BASE}{path}", params=params)

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"TMDB Error: {response.text}"
        )

    return response.json()


# =========================
# LOAD PICKLE FILES
# =========================
@app.on_event("startup")
def load_pickles():
    global df, indices_obj, tfidf_matrix, tfidf_obj, TITLE_TO_IDX

    with open(DF_PATH, "rb") as f:
        df = pickle.load(f)

    with open(INDICES_PATH, "rb") as f:
        indices_obj = pickle.load(f)

    with open(TFIDF_MATRIX_PATH, "rb") as f:
        tfidf_matrix = pickle.load(f)

    with open(TFIDF_PATH, "rb") as f:
        tfidf_obj = pickle.load(f)

    TITLE_TO_IDX = {}

    if isinstance(indices_obj, dict):
        for k, v in indices_obj.items():
            TITLE_TO_IDX[_norm_title(k)] = int(v)

    else:
        for k, v in indices_obj.items():
            TITLE_TO_IDX[_norm_title(k)] = int(v)

    print("Pickle files loaded successfully")


# =========================
# HEALTH ROUTE
# =========================
@app.get("/health")
def health():
    return {"status": "ok"}


# =========================
# TMDB SEARCH
# =========================
@app.get("/tmdb/search")
async def tmdb_search(query: str):
    return await tmdb_get(
        "/search/movie",
        {
            "query": query,
            "language": "en-US",
            "page": 1,
        },
    )


# =========================
# TF-IDF RECOMMENDATION
# =========================
def tfidf_recommend_titles(title: str, top_n: int = 10):

    if title.lower() not in TITLE_TO_IDX:
        raise HTTPException(
            status_code=404,
            detail=f"Movie '{title}' not found in dataset"
        )

    idx = TITLE_TO_IDX[title.lower()]

    similarity_scores = (tfidf_matrix @ tfidf_matrix[idx].T).toarray().ravel()

    movie_indices = similarity_scores.argsort()[::-1][1: top_n + 1]

    recommendations = []

    for i in movie_indices:
        recommendations.append({
            "title": df.iloc[i]["title"],
            "score": float(similarity_scores[i])
        })

    return recommendations


@app.get("/recommend/tfidf")
async def recommend_tfidf(
    title: str = Query(...),
    top_n: int = Query(10)
):
    return tfidf_recommend_titles(title, top_n)


# =========================
# ROOT ROUTE
# =========================
@app.get("/")
def root():
    return {
        "message": "Movie Recommendation API Running Successfully 🚀"
    }