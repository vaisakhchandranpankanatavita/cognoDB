# MovieRec Architecture

Technical architecture and design decisions for MovieRec.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           React Frontend (Vercel)                          │ │
│  │                                                            │ │
│  │  • MovieList (grid with ratings)                          │ │
│  │  • MovieDetail (cast, recommendations)                    │ │
│  │  • Search (real-time filtering)                           │ │
│  │  • Stats (genre analytics)                                │ │
│  │                                                            │ │
│  │  HTTP Request/Response via Axios                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │ HTTPS
                             ▼
                  ┌──────────────────────┐
                  │   Express API        │
                  │  (Render.com)        │
                  │                      │
                  │ GET /api/movies      │
                  │ GET /api/movies/:id  │
                  │ GET /api/search      │
                  │ GET /api/stats/*     │
                  └──────────┬───────────┘
                             │ Bolt Protocol
                             ▼
                  ┌──────────────────────┐
                  │    CognoDB Cloud     │
                  │  (Graph Database)    │
                  │                      │
                  │  Movie Nodes         │
                  │  Actor Nodes         │
                  │  User Ratings        │
                  │  Relationships       │
                  └──────────────────────┘
```

---

## Backend Architecture

### File Structure
```
server/
├── index.js          # Express server + route handlers
└── db.js             # Neo4j driver initialization
```

### Database Connection Pattern

```javascript
// server/db.js
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const runQuery = async (query, params = {}) => {
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records.map(record => record.toObject());
  } finally {
    await session.close();
  }
};
```

**Key Decision**: Use official Neo4j driver
- ✅ Works directly with CognoDB (Bolt 5.0+)
- ✅ No custom SDK needed
- ✅ Parameterized queries prevent injection
- ✅ Connection pooling built-in

### API Endpoints

All endpoints use `runQuery()` with parameterized queries:

#### 1. GET /api/movies
**Query**: Get all movies with average ratings
```cypher
MATCH (m:Movie)
OPTIONAL MATCH (m)<-[r:RATED]-(u:User)
WITH m, AVG(r.rating) as avgRating, COUNT(r) as ratingCount
RETURN m, avgRating, ratingCount
ORDER BY avgRating DESC
```
**Response**: Array of movies with ratings
**Graph Pattern**: Root node retrieval with aggregation

#### 2. GET /api/movies/:id
**Query**: Movie details with cast and directors
```cypher
MATCH (m:Movie {id: $id})
OPTIONAL MATCH (m)-[:STARS_IN]-(a:Actor)
OPTIONAL MATCH (m)-[:DIRECTED_BY]-(d:Director)
OPTIONAL MATCH (m)<-[r:RATED]-(u:User)
WITH m, COLLECT(DISTINCT a.name) as actors, ...
RETURN m, actors, directors, avgRating
```
**Response**: Single movie with nested arrays
**Graph Pattern**: One-to-many relationships

#### 3. GET /api/movies/:id/similar (Multi-hop Query)
**Query**: Find similar movies by shared actors
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
**Response**: Array of similar movies
**Graph Pattern**: **2-hop traversal** (Movie→Actor→Movie)
**Why Graph DB**: Would require JOINs in SQL

#### 4. GET /api/movies/:id/recommendations (Collaborative Filtering)
**Query**: Recommendations from user ratings
```cypher
MATCH (targetMovie:Movie {id: $movieId})<-[r1:RATED]-(user:User)
MATCH (user)-[r2:RATED]->(otherMovie:Movie)
WHERE otherMovie.id <> targetMovie.id
WITH otherMovie,
     AVG(r1.rating) as targetRating,
     AVG(r2.rating) as otherMovieRating,
     COUNT(DISTINCT user) as commonUsers
WITH otherMovie, commonUsers * (otherMovieRating - targetRating + 5) as score
RETURN otherMovie, score
ORDER BY score DESC
```
**Response**: Recommended movies with match scores
**Graph Pattern**: **User similarity** (Movie←User→Movie)
**Why Graph DB**: Expresses user-movie relationships naturally

#### 5. GET /api/search?q=query
**Query**: Full-text search on titles/genres
```cypher
MATCH (m:Movie)
WHERE m.title CONTAINS $query OR m.genre CONTAINS $query
OPTIONAL MATCH (m)<-[r:RATED]-(u:User)
WITH m, AVG(r.rating) as avgRating
RETURN m, avgRating
LIMIT 20
```
**Response**: Array of matching movies
**Graph Pattern**: Simple filtering with aggregation

#### 6. GET /api/stats/genres
**Query**: Genre statistics (relational-awkward in SQL)
```cypher
MATCH (m:Movie)
OPTIONAL MATCH (m)<-[r:RATED]-(u:User)
WITH m.genre as genre, AVG(r.rating) as avgRating, 
     COUNT(r) as ratingCount, COUNT(DISTINCT m) as movieCount
RETURN genre, avgRating, ratingCount, movieCount
ORDER BY avgRating DESC
```
**Response**: Array of genre statistics
**Graph Pattern**: Aggregation over optional relationships
**Why Graph DB**: OPTIONAL MATCH is cleaner than LEFT JOIN

---

## Frontend Architecture

### File Structure
```
client/src/
├── App.js                 # Main app, routing, state
├── index.js              # React entry point
├── components/
│   ├── MovieList.js      # Grid of movies
│   ├── MovieDetail.js    # Single movie with recommendations
│   ├── Search.js         # Real-time search input
│   └── Stats.js          # Genre statistics
└── *.css                 # Component styling
```

### Component Hierarchy

```
App (state: page, selectedMovieId, isConnected)
├── Header (navigation, health check)
├── Main (page routing)
│   ├── MovieList page
│   │   ├── Search component
│   │   └── MovieList component (grid)
│   │
│   ├── MovieDetail page
│   │   ├── Movie header
│   │   ├── Cast section
│   │   ├── Similar movies (multi-hop results)
│   │   └── Recommendations (collaborative filtering)
│   │
│   └── Stats page
│       └── Stats component (genre analytics)
└── Footer
```

### State Management

**App.js** manages:
- `page`: Current page (home/stats)
- `selectedMovieId`: Which movie to detail
- `isConnected`: Database connectivity status
- `loading`: Initial load state

**Component-level state**:
- Each component fetches its own data via `useEffect()`
- No shared state library (intentionally simple)

### Data Flow

```
User Action
    ↓
Component Handler (onClick, onChange)
    ↓
axios.get('/api/...')
    ↓
Express → Neo4j Driver → CognoDB
    ↓
Response (parameterized, safe)
    ↓
Component setState
    ↓
Re-render with new data
```

### API Integration Pattern

```javascript
// Typical component pattern
function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/endpoint');
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data.length) return <div className="empty-state">No data</div>;

  return <div>{/* render data */}</div>;
}
```

---

## Database Design

### Schema (Graph Model)

**Nodes**:
```
Movie {id, title, year, genre, plot}
Actor {name}
Director {name}
User {id}
```

**Relationships**:
```
Actor -[STARS_IN]→ Movie       (Actor appeared in Movie)
Director -[DIRECTED]→ Movie    (Director made Movie)
User -[RATED {rating}]→ Movie  (User gave rating to Movie)
```

### Seed Data

**scripts/seed.js** creates:
- 10 movies (varied genres: Drama, Sci-Fi, Crime, Action)
- 22 actors (realistic names)
- 9 directors
- 24 roles (actors in movies)
- 10 director assignments
- 12 user ratings (4 users rating different movies)

**Seed Pattern**:
```javascript
// Create nodes
CREATE (m:Movie {id, title, year, genre, plot})
CREATE (a:Actor {name})

// Create relationships
MATCH (a:Actor), (m:Movie)
CREATE (a)-[:STARS_IN]->(m)

// Create ratings
MATCH (u:User), (m:Movie)
CREATE (u)-[:RATED {rating}]->(m)
```

---

## Security Architecture

### 1. Credentials Management
- ✅ Environment variables only (`.env` in `.gitignore`)
- ✅ Never logged or printed
- ✅ Never committed to repository

### 2. Query Safety
- ✅ Parameterized queries via Neo4j driver
- ✅ No string concatenation
- ✅ Parameters bound at driver level

Example:
```javascript
// ✅ SAFE - Parameterized
await session.run('MATCH (m:Movie {id: $id})', { id: userId })

// ❌ UNSAFE - String concatenation
await session.run(`MATCH (m:Movie {id: ${userId}})`)
```

### 3. Error Handling
- ✅ Database errors caught and reported
- ✅ Sensitive info not exposed
- ✅ Graceful fallback UI states

### 4. CORS Policy
```javascript
app.use(cors());  // Allow frontend requests
app.use(express.json());
```

### 5. Connection Management
- ✅ Neo4j driver handles pooling
- ✅ Sessions closed after queries
- ✅ Driver closed on process exit

---

## Deployment Architecture

### Environment: Render (Backend)
- **Pros**: Free tier, auto-deploys from GitHub, easy env vars
- **Config**: Node.js runtime, auto-restart

### Environment: Vercel (Frontend)
- **Pros**: Free tier, optimized for React, CDN included
- **Config**: Create React App, auto-builds on push

### Environment: CognoDB Cloud (Database)
- **Pros**: Managed service, no setup, Bolt protocol
- **Resource**: Free c0 instance (0.5 vCPU, 256MB RAM, 1GB disk)

---

## Performance Considerations

### Query Optimization

1. **Aggregations**: Use `OPTIONAL MATCH` to handle missing relationships
2. **Limits**: Add `LIMIT` clauses to prevent large result sets
3. **Indexes**: CognoDB auto-indexes node IDs and labels

### Caching Strategy

Currently: No caching layer (too simple for caching overhead)

Could add:
- Client-side: React component state (already done)
- Server-side: Redis for frequent queries
- Database: Query result caching

### Scalability Path

1. Add indexes: `CREATE INDEX on :Movie(id)`
2. Add more seed data (current: 10 movies, small)
3. Add pagination: `SKIP $skip LIMIT $limit`
4. Add caching layer: Redis between Express and CognoDB
5. Add authentication: JWT tokens, user-specific recommendations

---

## Testing Strategy

### Unit Tests
Would test:
- Individual Cypher queries
- Parameter binding
- Error handling

### Integration Tests
Would test:
- Full API endpoints
- Database connectivity
- Query result formats

### E2E Tests
Would test:
- Frontend flows
- API-to-database pipeline
- UI loading/error states

### Current Approach
Manual testing via:
1. Frontend UI interactions
2. `curl` commands for API
3. Browser DevTools network tab

---

## Error Scenarios & Handling

| Scenario | Handled By | Response |
|----------|-----------|----------|
| Database unreachable | Health check endpoint | "Connection error" message |
| Invalid movie ID | Try/catch in endpoint | 404 + error message |
| Missing optional data | OPTIONAL MATCH | Graceful nil handling |
| Large result set | LIMIT clauses | Truncated results |
| Malformed input | Parameterized queries | Driver handles safely |
| Network timeout | Axios error catch | Error state in UI |

---

## Code Quality

### Principles
- ✅ No premature abstractions
- ✅ Clear variable names
- ✅ Minimal dependencies
- ✅ Error handling at boundaries
- ✅ Comments only for WHY, not WHAT

### Anti-patterns Avoided
- ❌ String concatenation in queries
- ❌ Hardcoded credentials
- ❌ Unhandled promise rejections
- ❌ Missing error boundaries
- ❌ Unnecessary state management

---

## Future Enhancements

### Short-term
1. User authentication (JWT)
2. Persist user ratings to database
3. Personalized recommendations
4. Pagination for large result sets

### Medium-term
1. Movie reviews and comments
2. Actor/director profile pages
3. Watchlist feature
4. Export recommendations as JSON

### Long-term
1. Real movie data integration (IMDb API)
2. Machine learning recommendation model
3. Graph analytics dashboard
4. Multi-region deployment

---

**Architecture designed for clarity and demonstrating graph database benefits.**
