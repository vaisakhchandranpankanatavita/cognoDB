import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MovieList from './components/MovieList';
import MovieDetail from './components/MovieDetail';
import Search from './components/Search';
import Stats from './components/Stats';
import './App.css';

function App() {
  const [page, setPage] = useState('home');
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      await axios.get('/api/health');
      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Connecting to database...</div>;
  }

  if (!isConnected) {
    return (
      <div className="container">
        <div className="header">
          <h1>🎬 MovieRec</h1>
          <p>Graph-Powered Movie Recommendations</p>
        </div>
        <div className="error">
          <strong>Database Connection Error</strong>
          <p>Unable to connect to CognoDB. Please ensure:</p>
          <ul>
            <li>Your CognoDB instance is running</li>
            <li>Environment variables are properly set (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)</li>
            <li>The server is running on port 5000</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="container header-content">
          <div className="logo">
            <h1 onClick={() => { setPage('home'); setSelectedMovieId(null); }}>
              🎬 MovieRec
            </h1>
            <p>Powered by CognoDB Graph Database</p>
          </div>
          <nav className="nav">
            <button
              className={page === 'home' ? 'active' : ''}
              onClick={() => { setPage('home'); setSelectedMovieId(null); }}
            >
              Browse
            </button>
            <button
              className={page === 'stats' ? 'active' : ''}
              onClick={() => setPage('stats')}
            >
              Stats
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        {page === 'home' && selectedMovieId ? (
          <MovieDetail
            movieId={selectedMovieId}
            onBack={() => setSelectedMovieId(null)}
          />
        ) : page === 'home' ? (
          <>
            <Search />
            <MovieList onSelectMovie={setSelectedMovieId} />
          </>
        ) : page === 'stats' ? (
          <Stats />
        ) : null}
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 MovieRec | Built with CognoDB Graph Database</p>
      </footer>
    </div>
  );
}

export default App;
