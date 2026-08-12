require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { runQuery, driver } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await runQuery('MATCH (n) RETURN COUNT(n) as count LIMIT 1');
    res.json({ status: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get all movies with ratings
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await runQuery(`
      MATCH (m:Movie)
      OPTIONAL MATCH (m)<-[r:RATED]-(u:User)
      WITH m, AVG(r.rating) as avgRating, COUNT(r) as ratingCount
      RETURN {
        id: m.id,
        title: m.title,
        year: m.year,
        genre: m.genre,
        plot: m.plot,
        avgRating: avgRating,
        ratingCount: ratingCount
      } as movie
      ORDER BY movie.avgRating DESC
      LIMIT 50
    `);
    res.json(movies.map(r => r.movie));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get movie details with cast and recommendations
app.get('/api/movies/:id', async (req, res) => {
  try {
    const movieData = await runQuery(`
      MATCH (m:Movie {id: $id})
      OPTIONAL MATCH (m)<-[r:RATED]-(u:User)
      OPTIONAL MATCH (m)-[:STARS_IN]-(a:Actor)
      OPTIONAL MATCH (m)-[:DIRECTED_BY]-(d:Director)
      WITH m, AVG(r.rating) as avgRating, COUNT(r) as ratingCount,
           COLLECT(DISTINCT a.name) as actors,
           COLLECT(DISTINCT d.name) as directors
      RETURN {
        id: m.id,
        title: m.title,
        year: m.year,
        genre: m.genre,
        plot: m.plot,
        avgRating: avgRating,
        ratingCount: ratingCount,
        actors: actors,
        directors: directors
      } as movie
    `, { id: req.params.id });

    if (movieData.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const movie = movieData[0].movie;

    // Get recommendations using collaborative filtering
    const recommendations = await runQuery(`
      MATCH (targetMovie:Movie {id: $movieId})

      // Find users who rated the target movie
      MATCH (targetMovie)<-[r1:RATED]-(user:User)

      // Find other movies rated by those users
      MATCH (user)-[r2:RATED]->(otherMovie:Movie)
      WHERE otherMovie.id <> targetMovie.id

      // Calculate recommendation score based on user ratings
      WITH otherMovie,
           AVG(r1.rating) as targetRating,
           AVG(r2.rating) as otherMovieRating,
           COUNT(DISTINCT user) as commonUsers

      // Boost score if rating is high
      WITH otherMovie,
           commonUsers,
           commonUsers * (otherMovieRating - targetRating + 5) as score

      RETURN {
        id: otherMovie.id,
        title: otherMovie.title,
        genre: otherMovie.genre,
        commonUsers: commonUsers,
        score: score
      } as recommendation
      ORDER BY score DESC
      LIMIT 5
    `, { movieId: req.params.id });

    res.json({
      movie,
      recommendations: recommendations.map(r => r.recommendation)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search movies
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    const results = await runQuery(`
      MATCH (m:Movie)
      WHERE m.title CONTAINS $query OR m.genre CONTAINS $query
      OPTIONAL MATCH (m)<-[r:RATED]-(u:User)
      WITH m, AVG(r.rating) as avgRating
      RETURN {
        id: m.id,
        title: m.title,
        genre: m.genre,
        year: m.year,
        avgRating: avgRating
      } as movie
      LIMIT 20
    `, { query: q });
    res.json(results.map(r => r.movie));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get actor details and their movies
app.get('/api/actors/:name', async (req, res) => {
  try {
    const actorData = await runQuery(`
      MATCH (a:Actor {name: $name})
      OPTIONAL MATCH (a)-[:STARS_IN]->(m:Movie)
      WITH a, COLLECT({
        id: m.id,
        title: m.title,
        year: m.year,
        genre: m.genre
      }) as movies
      RETURN {
        name: a.name,
        movies: movies
      } as actor
    `, { name: req.params.name });

    if (actorData.length === 0) {
      return res.status(404).json({ error: 'Actor not found' });
    }

    res.json(actorData[0].actor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Find similar movies based on shared actors
app.get('/api/movies/:id/similar', async (req, res) => {
  try {
    // Multi-hop traversal: Movie -> Actor -> Movie
    const similar = await runQuery(`
      MATCH (targetMovie:Movie {id: $movieId})
      MATCH (targetMovie)-[:STARS_IN]-(sharedActor:Actor)
      MATCH (sharedActor)-[:STARS_IN]-(similarMovie:Movie)
      WHERE similarMovie.id <> targetMovie.id
      WITH similarMovie, COUNT(DISTINCT sharedActor) as commonActors
      RETURN {
        id: similarMovie.id,
        title: similarMovie.title,
        genre: similarMovie.genre,
        year: similarMovie.year,
        commonActors: commonActors
      } as movie
      ORDER BY commonActors DESC
      LIMIT 10
    `, { movieId: req.params.id });

    res.json(similar.map(r => r.movie));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get genre statistics (relational-awkward query)
app.get('/api/stats/genres', async (req, res) => {
  try {
    const stats = await runQuery(`
      MATCH (m:Movie)
      OPTIONAL MATCH (m)<-[r:RATED]-(u:User)
      WITH m.genre as genre, AVG(r.rating) as avgRating, COUNT(r) as ratingCount, COUNT(DISTINCT m) as movieCount
      RETURN {
        genre: genre,
        avgRating: avgRating,
        totalRatings: ratingCount,
        movieCount: movieCount
      } as genreStats
      ORDER BY avgRating DESC
    `);
    res.json(stats.map(r => r.genreStats));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve React build
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  const { driver } = require('./db');
  await driver.close();
  process.exit(0);
});
