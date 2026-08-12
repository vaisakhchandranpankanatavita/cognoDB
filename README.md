# MovieRec - Graph-Powered Movie Recommendation Engine

A full-stack application demonstrating the power of graph databases for relationship-based queries and recommendations using CognoDB.

## 🎬 Overview

MovieRec is a movie recommendation system built on CognoDB, a managed graph database. The application showcases how graph databases naturally model complex relationships between movies, actors, directors, and user ratings, enabling powerful recommendation queries that would be cumbersome in traditional relational databases.

**Repository**: [vaisakhchandranpankanatavita/cognodb](https://github.com/vaisakhchandranpankanatavita/cognodb)

## 🤔 Why a Graph Database?

### The Problem
In a relational database, answering questions like "Find movies similar to ones I rated" requires:
- Multiple JOIN operations across `users`, `ratings`, `movies`, `actors`, `roles` tables
- Complex subqueries or CTEs
- Expensive lookups across disconnected tables
- Difficulty expressing transitive relationships ("friends of friends")

### The Graph Solution
CognoDB models the same data as a graph where **relationships are first-class citizens**:

```
User → RATED → Movie ← STARS_IN ← Actor
                  ↓
              DIRECTED_BY
                  ↓
               Director
```

**Graph advantages in MovieRec**:
1. **Multi-hop traversals** (2+ hops): Find movies with shared actors in a single traversal
2. **Relationship-driven queries**: Recommendations based on connection patterns, not table scans
3. **Efficient pattern matching**: Complex patterns naturally expressed in Cypher
4. **Implicit indexing**: Relationships provide built-in navigation paths

### Real Example
**Query**: "Find movies similar to 'Inception' based on shared actors"

**SQL**: Requires JOINs across roles, movies, and actors tables
```sql
SELECT DISTINCT m2.id, m2.title, COUNT(DISTINCT a.id) as shared_actors
FROM movies m1
JOIN roles r1 ON m1.id = r1.movie_id
JOIN actors a ON r1.actor_id = a.id
JOIN roles r2 ON a.id = r2.actor_id
JOIN movies m2 ON r2.movie_id = m2.id
WHERE m1.id = ? AND m2.id != m1.id
GROUP BY m2.id
ORDER BY shared_actors DESC;
```

**Cypher (CognoDB)**: Expresses the pattern naturally
```cypher
MATCH (m1:Movie {id: $movieId})-[:STARS_IN]-(a:Actor)-[:STARS_IN]-(m2:Movie)
WHERE m2.id <> m1.id
RETURN m2, COUNT(DISTINCT a) as commonActors
ORDER BY commonActors DESC
```

---

## 📊 Data Model

### Node Types
| Type | Properties | Purpose |
|------|-----------|---------|
| `Movie` | `id`, `title`, `year`, `genre`, `plot` | Movie information |
| `Actor` | `name` | Cast members |
| `Director` | `name` | Movie directors |
| `User` | `id` | Rating users |

### Relationships
| Type | Direction | Properties | Meaning |
|------|-----------|-----------|---------|
| `STARS_IN` | Actor → Movie | — | Actor appeared in movie |
| `DIRECTED` | Director → Movie | — | Director created movie |
| `RATED` | User → Movie | `rating` (1-5) | User rated movie |

### Data Model Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                     MOVIE RECOMMENDATION GRAPH                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│         ┌──────────────┐                  ┌──────────────┐      │
│         │    Actor     │                  │  Director    │      │
│         └──────────────┘                  └──────────────┘      │
│              │                                   │               │
│         STARS_IN                           DIRECTED              │
│              │                                   │               │
│         ┌────▼────────────────────────────────▼─────┐           │
│         │            Movie                          │           │
│         │ ┌─ id       ┌─ title                      │           │
│         │ ├─ year     ├─ genre                      │           │
│         │ └─ plot     └─────────────                │           │
│         └─────────────────────┬──────────────────────┘           │
│                               │                                  │
│                            RATED                                │
│                               │                                  │
│                          ┌────▼──────┐                          │
│                          │    User    │                         │
│                          │ ┌─ id      │                         │
│                          │ └─ rating  │                         │
│                          └───────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Key Patterns:
• Movie ← STARS_IN ← Actor: Find all actors in a movie
• Actor → STARS_IN → Movie: Find all movies by an actor
• Movie ← STARS_IN ← Actor → STARS_IN → Movie: Find similar movies
• User → RATED → Movie → ← RATED ← User: Collaborative filtering
```

---

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **neo4j-driver** (official Neo4j driver works with CognoDB)
- **Dotenv** for environment configuration

### Frontend
- **React 18** with hooks
- **Axios** for API calls
- **CSS3** with custom styling

### Database
- **CognoDB** (managed graph database on Bolt 5.0+ protocol)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- CognoDB Cloud account (free tier available at console.cognodb.com)

### 1. Set Up CognoDB Cloud

1. **Create Account**: Visit https://console.cognodb.com/signup
2. **Create Instance**: Create a free (c0) instance
3. **Save Credentials**:
   - Connection URI: `bolt+s://<instance-id>.databases.cognodb.cloud`
   - Username: `cognodb`
   - Password: (generated, save it securely)

### 2. Clone Repository

```bash
git clone https://github.com/vaisakhchandranpankanatavita/cognodb.git
cd cognodb
```

### 3. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

### 4. Configure Environment

Create `.env` file in project root:
```env
NEO4J_URI=bolt+s://<instance-id>.databases.cognodb.cloud
NEO4J_USER=cognodb
NEO4J_PASSWORD=<your-generated-password>
PORT=5000
```

### 5. Seed Database

```bash
npm run seed
```

Output:
```
✅ Database seeded successfully!
- 10 movies created
- 22 actors created
- 9 directors created
- 24 cast relationships created
- 10 director relationships created
- 12 user ratings created
```

### 6. Run Application

```bash
# Development mode (auto-reload)
npm run dev

# Or run separately:
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
cd client && npm start
```

Visit http://localhost:3000

---

## 📚 Main Queries Explained

### 1. Get All Movies with Ratings
```cypher
MATCH (m:Movie)
OPTIONAL MATCH (m)<-[r:RATED]-(u:User)
WITH m, AVG(r.rating) as avgRating, COUNT(r) as ratingCount
RETURN m, avgRating, ratingCount
ORDER BY avgRating DESC
```
**Purpose**: Browse all movies with aggregated ratings
**Graph benefit**: Efficiently aggregates ratings across all users without joins

### 2. Find Similar Movies by Shared Actors (Multi-hop)
```cypher
MATCH (targetMovie:Movie {id: $movieId})
MATCH (targetMovie)-[:STARS_IN]-(sharedActor:Actor)
MATCH (sharedActor)-[:STARS_IN]-(similarMovie:Movie)
WHERE similarMovie.id <> targetMovie.id
WITH similarMovie, COUNT(DISTINCT sharedActor) as commonActors
RETURN similarMovie, commonActors
ORDER BY commonActors DESC
LIMIT 10
```
**Purpose**: Recommendation based on shared cast
**Pattern**: Movie → Actor → Movie (2 hops)
**Graph benefit**: Traverses relationships naturally; in SQL would require complex JOINs

### 3. Collaborative Filtering Recommendations
```cypher
MATCH (targetMovie:Movie {id: $movieId})<-[r1:RATED]-(user:User)
MATCH (user)-[r2:RATED]->(otherMovie:Movie)
WHERE otherMovie.id <> targetMovie.id
WITH otherMovie,
     AVG(r1.rating) as targetRating,
     AVG(r2.rating) as otherMovieRating,
     COUNT(DISTINCT user) as commonUsers
WITH otherMovie,
     commonUsers * (otherMovieRating - targetRating + 5) as score
RETURN otherMovie, score
ORDER BY score DESC
LIMIT 5
```
**Purpose**: Recommend movies based on user rating patterns
**Pattern**: Movie ← User → Movie → User
**Graph benefit**: Expresses user-movie-user patterns elegantly; would require complex self-joins in SQL

### 4. Genre Statistics (Relational Awkward Query)
```cypher
MATCH (m:Movie)
OPTIONAL MATCH (m)<-[r:RATED]-(u:User)
WITH m.genre as genre, AVG(r.rating) as avgRating, 
     COUNT(r) as ratingCount, COUNT(DISTINCT m) as movieCount
RETURN genre, avgRating, ratingCount, movieCount
ORDER BY avgRating DESC
```
**Purpose**: Analyze ratings by genre
**Graph benefit**: OPTIONAL MATCH naturally handles missing data without explicit LEFT JOINs; aggregation follows relationship navigation

---

## 🎯 Features & Screenshots

### 1. Movie Browser
- Browse all movies sorted by rating
- View movie details, cast, and directors
- Responsive grid layout

### 2. Movie Detail Page
- Movie information and plot
- Cast and director information
- **Similar movies** (multi-hop: shared actors)
- **Recommendations** (collaborative filtering)

### 3. Search
- Real-time search by title or genre
- Instant filtering

### 4. Statistics
- Genre analysis
- Average ratings by genre
- Visual rating bars
- Movie count per genre

---

## 📋 Required Endpoints

All endpoints use parameterized queries (no string concatenation).

### Public Endpoints
```
GET  /api/health                          # Database connectivity check
GET  /api/movies                          # All movies with ratings
GET  /api/movies/:id                      # Movie details with metadata
GET  /api/movies/:id/similar              # Similar movies (multi-hop)
GET  /api/search?q=<query>                # Movie search
GET  /api/actors/:name                    # Actor details and filmography
GET  /api/stats/genres                    # Genre statistics
```

All responses use parameterized Neo4j driver calls:
```javascript
await session.run('MATCH (m:Movie {id: $id}) ...', { id: movieId })
```

---

## 🔒 Security Features

✅ **Environment-based configuration**: Credentials in `.env`, never committed  
✅ **Parameterized queries**: No string concatenation, protects against injection  
✅ **Graceful error handling**: Database errors don't expose internals  
✅ **CORS configuration**: Restricts cross-origin requests  
✅ **Connection pooling**: Neo4j driver handles efficient reuse  

---

## 📦 Project Structure

```
cognodb/
├── server/
│   ├── index.js              # Express app and routes
│   └── db.js                 # Database connection manager
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js            # Main React component
│       ├── components/
│       │   ├── MovieList.js
│       │   ├── MovieDetail.js
│       │   ├── Search.js
│       │   └── Stats.js
│       └── index.js
├── scripts/
│   └── seed.js               # Database seeding script
├── .env                      # Environment variables (not in repo)
├── .gitignore
├── package.json
└── README.md
```

---

## ✨ Key Takeaways

1. **Graph databases excel at relationships**: CognoDB naturally models actor-movie-user connections
2. **Multi-hop queries are first-class**: Finding similar items through intermediate nodes is efficient
3. **No impedance mismatch**: Cypher queries map directly to conceptual patterns
4. **Scalable recommendations**: Collaborative filtering and similarity patterns query-native
5. **Cleaner code**: Relationship patterns are more readable than complex SQL joins

---

## 🌐 Deployment Guide

### Step 1: Prepare Repository for Deployment

Ensure `.env` is in `.gitignore` (already configured):
```bash
git status
```

### Step 2: Deploy Backend (Render Free Tier)

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "MovieRec: Graph-powered movie recommendations"
   git push origin claude/problem-solving-t3m0c9
   ```

2. **On Render.com**:
   - Create new "Web Service"
   - Connect GitHub repository
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variables:
     - `NEO4J_URI`
     - `NEO4J_USER`
     - `NEO4J_PASSWORD`

### Step 3: Deploy Frontend (Vercel Free Tier)

1. **Inside client directory**:
   ```bash
   cd client
   npm run build
   ```

2. **On Vercel.com**:
   - Import GitHub repository
   - Root directory: `client`
   - Build: `npm run build`
   - Environment: Set `REACT_APP_API_URL` to your Render URL

---

## 📞 Support

- **CognoDB Issues**: cognodb@wexa.ai
- **Assignment Questions**: Reply to assignment email
- **Repository**: [GitHub](https://github.com/vaisakhchandranpankanatavita/cognodb)

---

## 📄 License

MIT

---

**Built with ❤️ using CognoDB Graph Database**  
*Demonstrating the power of graph patterns in real-world applications*