import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MovieList.css';

function MovieList({ onSelectMovie }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/movies');
      setMovies(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading movies...</div>;
  }

  if (error) {
    return <div className="error">Error loading movies: {error}</div>;
  }

  if (movies.length === 0) {
    return <div className="empty-state"><h3>No movies found</h3></div>;
  }

  return (
    <div className="movie-grid">
      {movies.map(movie => (
        <div
          key={movie.id}
          className="movie-card"
          onClick={() => onSelectMovie(movie.id)}
        >
          <div className="movie-header">
            <h3>{movie.title}</h3>
            <span className="year">{movie.year}</span>
          </div>

          <p className="genre">{movie.genre}</p>

          <p className="plot">{movie.plot}</p>

          <div className="movie-footer">
            {movie.avgRating ? (
              <div className="rating">
                <span className="rating-stars">★</span>
                <span className="rating-value">{movie.avgRating.toFixed(1)}</span>
                <span className="rating-count">({movie.ratingCount})</span>
              </div>
            ) : (
              <div className="rating">
                <span className="no-rating">No ratings</span>
              </div>
            )}
            <button className="view-btn">View Details</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MovieList;
