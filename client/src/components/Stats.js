import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Stats.css';

function Stats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/stats/genres');
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading statistics...</div>;
  }

  if (error) {
    return <div className="error">Error loading statistics: {error}</div>;
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h2>Genre Statistics</h2>
        <p className="stats-desc">
          Average ratings and movie counts by genre. This query demonstrates aggregation and filtering
          across relationships - something that requires complex joins in SQL but is natural in Cypher.
        </p>
      </div>

      {stats.length === 0 ? (
        <div className="empty-state">
          <p>No genre statistics available</p>
        </div>
      ) : (
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <h3>{stat.genre}</h3>
              <div className="stat-metric">
                <span className="stat-label">Average Rating</span>
                <span className="stat-value">
                  {stat.avgRating ? `${stat.avgRating.toFixed(1)}/5` : 'N/A'}
                </span>
              </div>
              <div className="stat-metric">
                <span className="stat-label">Movies</span>
                <span className="stat-value">{stat.movieCount}</span>
              </div>
              <div className="stat-metric">
                <span className="stat-label">Total Ratings</span>
                <span className="stat-value">{stat.totalRatings || 0}</span>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${((stat.avgRating || 0) / 5) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Stats;
