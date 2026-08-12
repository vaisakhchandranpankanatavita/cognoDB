import React, { useState } from 'react';
import axios from 'axios';
import './Search.css';

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (value) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      const response = await axios.get('/api/search', { params: { q: value } });
      setResults(response.data);
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="🔍 Search movies by title or genre..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="search-input"
      />
      {hasSearched && (
        <div className="search-results">
          {results.length > 0 ? (
            <div className="results-list">
              {results.map(movie => (
                <div key={movie.id} className="result-item">
                  <div className="result-info">
                    <h4>{movie.title}</h4>
                    <span className="result-genre">{movie.genre}</span>
                    <span className="result-year">{movie.year}</span>
                  </div>
                  {movie.avgRating && (
                    <span className="result-rating">★ {movie.avgRating.toFixed(1)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">No movies found matching "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;
