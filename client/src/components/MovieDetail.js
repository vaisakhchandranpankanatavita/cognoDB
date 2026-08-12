import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MovieDetail.css';

function MovieDetail({ movieId, onBack }) {
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/movies/${movieId}`);
      setMovie(response.data.movie);
      setRecommendations(response.data.recommendations);

      // Fetch similar movies based on shared actors (multi-hop traversal)
      const similarResponse = await axios.get(`/api/movies/${movieId}/similar`);
      setSimilarMovies(similarResponse.data);

      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading movie details...</div>;
  }

  if (error) {
    return (
      <div>
        <button onClick={onBack} className="back-btn">← Back</button>
        <div className="error">Error loading movie: {error}</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div>
        <button onClick={onBack} className="back-btn">← Back</button>
        <div className="empty-state"><h3>Movie not found</h3></div>
      </div>
    );
  }

  return (
    <div className="movie-detail">
      <button onClick={onBack} className="back-btn">← Back to Movies</button>

      <div className="detail-header">
        <div className="detail-main">
          <h1>{movie.title}</h1>
          <div className="detail-meta">
            <span className="badge">{movie.year}</span>
            <span className="badge">{movie.genre}</span>
            {movie.avgRating && (
              <span className="badge rating-badge">
                ★ {movie.avgRating.toFixed(1)}/5 ({movie.ratingCount} ratings)
              </span>
            )}
          </div>
          <p className="plot">{movie.plot}</p>
        </div>
      </div>

      {(movie.directors && movie.directors.length > 0) && (
        <section className="detail-section">
          <h3>Directors</h3>
          <div className="credits-list">
            {movie.directors.map((director, idx) => (
              <span key={idx} className="credit">{director}</span>
            ))}
          </div>
        </section>
      )}

      {(movie.actors && movie.actors.length > 0) && (
        <section className="detail-section">
          <h3>Cast</h3>
          <div className="credits-list">
            {movie.actors.map((actor, idx) => (
              <span key={idx} className="credit actor-link">
                {actor}
              </span>
            ))}
          </div>
        </section>
      )}

      {similarMovies.length > 0 && (
        <section className="detail-section">
          <h3>Similar Movies (by shared actors - multi-hop query)</h3>
          <p className="section-desc">
            Found based on shared cast members - a graph database pattern that's natural in CognoDB
          </p>
          <div className="recommendations">
            {similarMovies.map(rec => (
              <div key={rec.id} className="rec-card">
                <h4>{rec.title}</h4>
                <p className="genre-badge">{rec.genre}</p>
                <p className="actors-count">Shared actors: {rec.commonActors}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="detail-section">
          <h3>Recommended for You (collaborative filtering)</h3>
          <p className="section-desc">
            Based on user ratings - shows how graph queries can compute recommendations that would be awkward in SQL
          </p>
          <div className="recommendations">
            {recommendations.map(rec => (
              <div key={rec.id} className="rec-card">
                <h4>{rec.title}</h4>
                <p className="genre-badge">{rec.genre}</p>
                <p className="score">Match score: {rec.score.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendations.length === 0 && similarMovies.length === 0 && (
        <div className="empty-state">
          <p>No additional recommendations available for this movie.</p>
        </div>
      )}
    </div>
  );
}

export default MovieDetail;
