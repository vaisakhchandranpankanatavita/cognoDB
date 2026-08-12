# MovieRec Deployment Guide

Complete step-by-step guide for deploying MovieRec to production.

## Prerequisites

- [ ] GitHub account
- [ ] Render.com account (free)
- [ ] Vercel account (free)
- [ ] CognoDB Cloud instance (free tier)
- [ ] Node.js 16+ installed locally

---

## Part 1: CognoDB Setup (5 minutes)

### 1.1 Create CognoDB Instance

1. Visit https://console.cognodb.com/signup
2. Create a free account
3. Create a free (c0) instance
4. Choose a region (US recommended)
5. Wait for provisioning (~1 minute)

### 1.2 Save Connection Details

In the CognoDB console:
- Copy **Connection URI** → looks like `bolt+s://xyz123.databases.cognodb.cloud`
- Copy **Username** → `cognodb`
- Copy **Password** → (shown once, save it!)

Store safely:
```
NEO4J_URI=bolt+s://xyz123.databases.cognodb.cloud
NEO4J_USER=cognodb
NEO4J_PASSWORD=your_password_here
```

---

## Part 2: Backend Deployment (Render.com)

### 2.1 Prepare Repository

```bash
# Ensure all changes committed
git status
git add .
git commit -m "Ready for deployment"
git push origin claude/problem-solving-t3m0c9
```

### 2.2 Deploy on Render

1. **Visit** https://render.com/dashboard
2. **Sign in** with GitHub
3. **New → Web Service**
4. **Connect Repository**:
   - Select `vaisakhchandranpankanatavita/cognoDB`
   - Select branch: `claude/problem-solving-t3m0c9`

5. **Configure Service**:
   - Name: `movierec-api`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

6. **Environment Variables**:
   - Click "Add Environment Variable"
   - Add each:
     ```
     NEO4J_URI = bolt+s://xyz123.databases.cognodb.cloud
     NEO4J_USER = cognodb
     NEO4J_PASSWORD = your_password
     PORT = 5000
     ```

7. **Create Web Service**
   - Wait 2-3 minutes for deployment
   - Copy the service URL (e.g., `https://movierec-api.onrender.com`)

### 2.3 Seed Database

```bash
# Locally, seed before first deploy
npm run seed

# Output should show:
# ✅ Database seeded successfully!
```

### 2.4 Test Backend

```bash
# Test health check
curl https://movierec-api.onrender.com/api/health

# Should return: {"status":"connected"}
```

---

## Part 3: Frontend Deployment (Vercel)

### 3.1 Deploy on Vercel

1. **Visit** https://vercel.com/dashboard
2. **Sign in** with GitHub
3. **New Project**
4. **Import Repository**:
   - Select `vaisakhchandranpankanatavita/cognoDB`
   - Branch: `claude/problem-solving-t3m0c9`

5. **Configure**:
   - Framework: `Create React App`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `build`

6. **Environment Variables**:
   - `REACT_APP_API_URL` = `https://movierec-api.onrender.com`

7. **Deploy Project**
   - Wait for build (~2 minutes)
   - Copy the Vercel URL (e.g., `https://movierec.vercel.app`)

### 3.2 Test Frontend

Open https://movierec.vercel.app in browser:
- [ ] Page loads without errors
- [ ] Movies display with ratings
- [ ] Can click on a movie
- [ ] Similar movies load
- [ ] Search works
- [ ] Stats page displays genre data

---

## Part 4: Submit Assignment

### 4.1 Prepare Submission Email

Subject: `CognoDB Assignment 2 – Vaisakh Chandran P`

Body:
```
GitHub Repository:
https://github.com/vaisakhchandranpankanatavita/cognoDB

Hosted Demo:
https://movierec.vercel.app

Backend API:
https://movierec-api.onrender.com/api

Data Model:
- Movie, Actor, Director, User nodes
- STARS_IN, DIRECTED, RATED relationships
- 10 movies with realistic data

Key Features:
✓ Multi-hop traversal (Movie-Actor-Movie)
✓ Collaborative filtering recommendations
✓ Genre statistics with aggregation
✓ Parameterized queries (no injection risk)
✓ Polished React UI with dark theme
✓ Responsive design (mobile/desktop)

Why Graph Database:
CognoDB excels because:
1. Natural relationship modeling (actors in movies, user ratings)
2. Efficient multi-hop patterns (shared actor queries)
3. Relationship-driven recommendations
4. Cleaner Cypher vs complex SQL joins
5. Implicit navigation through connections

Query Examples:
- Find similar movies: Movie→Actor→Movie (2 hops)
- Recommendations: User→Movie→User (collaborative)
- Genre stats: Aggregation with OPTIONAL MATCH

Database Instance:
Keep running for evaluation. Seeding script provided.
```

### 4.2 Send Email

Send to: `hr@wexa.ai`

---

## Part 5: Maintenance

### 5.1 Keep Database Running

- [ ] CognoDB instance stays online
- [ ] Monitor instance dashboard
- [ ] Note any warnings

### 5.2 Monitor Deployments

**Render Backend**:
- Dashboard → movierec-api → Logs
- Should show: "Server running on http://localhost:5000"

**Vercel Frontend**:
- Dashboard → movierec → Deployments
- Status should be "Ready"

### 5.3 Troubleshooting

**Issue**: Frontend shows "Database Connection Error"
- [ ] Check backend health: `/api/health`
- [ ] Verify environment variables on Render
- [ ] Check CognoDB instance is running

**Issue**: Render build fails
- [ ] Check build logs in Render dashboard
- [ ] Verify `package.json` exists at root
- [ ] Verify `client/package.json` exists

**Issue**: Movies don't load
- [ ] Run `npm run seed` locally
- [ ] Verify CognoDB connection URI
- [ ] Check if database was seeded

**Issue**: CORS errors
- [ ] Verify backend CORS configuration
- [ ] Check API base URL in frontend

---

## Timeline

| Task | Time | Status |
|------|------|--------|
| CognoDB setup | 5 min | ⏳ |
| Backend deployment | 5 min | ⏳ |
| Frontend deployment | 5 min | ⏳ |
| Database seeding | 1 min | ⏳ |
| Testing | 5 min | ⏳ |
| **Total** | **~20 min** | ⏳ |

---

## Success Checklist

- [ ] CognoDB instance created and seeded
- [ ] Backend deployed on Render with correct env vars
- [ ] Frontend deployed on Vercel
- [ ] `/api/health` returns `{status: "connected"}`
- [ ] Movie list loads and displays 10 movies
- [ ] Can click on movie and see details
- [ ] Search works
- [ ] Similar movies calculate correctly
- [ ] Stats page shows genre data
- [ ] GitHub repository URL working
- [ ] Demo link working
- [ ] Email sent to `hr@wexa.ai`
- [ ] CognoDB instance kept running

---

## Next Steps (After Submission)

1. Wait for review feedback
2. Be ready to explain:
   - Data model design choices
   - Why graph database was chosen
   - How multi-hop queries work
   - Cypher query patterns used
   - UI/UX design decisions

3. Possible questions:
   - How would you scale this?
   - How would you add more data?
   - How would you improve recommendations?
   - How would you add authentication?

---

**Good luck! 🚀**
