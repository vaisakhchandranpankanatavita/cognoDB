require('dotenv').config();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt+s://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'cognodb',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

const seedData = {
  movies: [
    { id: 'm1', title: 'The Shawshank Redemption', year: 1994, genre: 'Drama', plot: 'Two imprisoned men bond and find redemption through a series of years.' },
    { id: 'm2', title: 'The Dark Knight', year: 2008, genre: 'Action', plot: 'Batman faces the Joker in Gotham City.' },
    { id: 'm3', title: 'Inception', year: 2010, genre: 'Sci-Fi', plot: 'A skilled thief steals secrets from dreams.' },
    { id: 'm4', title: 'Interstellar', year: 2014, genre: 'Sci-Fi', plot: 'A team travels through a wormhole near Saturn.' },
    { id: 'm5', title: 'The Matrix', year: 1999, genre: 'Sci-Fi', plot: 'A hacker discovers the nature of reality.' },
    { id: 'm6', title: 'Forrest Gump', year: 1994, genre: 'Drama', plot: 'A man with low IQ achieves great things.' },
    { id: 'm7', title: 'Pulp Fiction', year: 1994, genre: 'Crime', plot: 'Multiple storylines converge in Los Angeles.' },
    { id: 'm8', title: 'The Godfather', year: 1972, genre: 'Crime', plot: 'The aging patriarch of an organized crime dynasty.' },
    { id: 'm9', title: 'Fight Club', year: 1999, genre: 'Drama', plot: 'An insomniac and a devil-may-care soapmaker form an underground fight club.' },
    { id: 'm10', title: 'Goodfellas', year: 1990, genre: 'Crime', plot: 'The rise and fall of a mobster and his associates.' },
  ],
  actors: [
    { name: 'Christian Bale' },
    { name: 'Leonardo DiCaprio' },
    { name: 'Matthew McConaughey' },
    { name: 'Anne Hathaway' },
    { name: 'Keanu Reeves' },
    { name: 'Tom Hardy' },
    { name: 'Tim Robbins' },
    { name: 'Morgan Freeman' },
    { name: 'Heath Ledger' },
    { name: 'Gary Oldman' },
    { name: 'John Travolta' },
    { name: 'Samuel L. Jackson' },
    { name: 'Uma Thurman' },
    { name: 'Brad Pitt' },
    { name: 'Edward Norton' },
    { name: 'Marlon Brando' },
    { name: 'Al Pacino' },
    { name: 'Ray Liotta' },
    { name: 'Robert De Niro' },
    { name: 'Joe Pesci' },
    { name: 'Tom Hanks' },
    { name: 'Sally Field' },
  ],
  directors: [
    { name: 'Frank Darabont' },
    { name: 'Christopher Nolan' },
    { name: 'Lana Wachowski' },
    { name: 'Lilly Wachowski' },
    { name: 'Quentin Tarantino' },
    { name: 'Francis Ford Coppola' },
    { name: 'David Fincher' },
    { name: 'Martin Scorsese' },
    { name: 'Robert Zemeckis' },
  ],
  roles: [
    { movieId: 'm1', actorName: 'Tim Robbins' },
    { movieId: 'm1', actorName: 'Morgan Freeman' },
    { movieId: 'm2', actorName: 'Christian Bale' },
    { movieId: 'm2', actorName: 'Heath Ledger' },
    { movieId: 'm2', actorName: 'Gary Oldman' },
    { movieId: 'm3', actorName: 'Leonardo DiCaprio' },
    { movieId: 'm3', actorName: 'Marion Cotillard' },
    { movieId: 'm3', actorName: 'Tom Hardy' },
    { movieId: 'm3', actorName: 'Ellen Page' },
    { movieId: 'm4', actorName: 'Matthew McConaughey' },
    { movieId: 'm4', actorName: 'Anne Hathaway' },
    { movieId: 'm5', actorName: 'Keanu Reeves' },
    { movieId: 'm6', actorName: 'Tom Hanks' },
    { movieId: 'm6', actorName: 'Sally Field' },
    { movieId: 'm7', actorName: 'John Travolta' },
    { movieId: 'm7', actorName: 'Samuel L. Jackson' },
    { movieId: 'm7', actorName: 'Uma Thurman' },
    { movieId: 'm8', actorName: 'Marlon Brando' },
    { movieId: 'm8', actorName: 'Al Pacino' },
    { movieId: 'm9', actorName: 'Brad Pitt' },
    { movieId: 'm9', actorName: 'Edward Norton' },
    { movieId: 'm10', actorName: 'Ray Liotta' },
    { movieId: 'm10', actorName: 'Robert De Niro' },
    { movieId: 'm10', actorName: 'Joe Pesci' },
  ],
  directorRoles: [
    { movieId: 'm1', directorName: 'Frank Darabont' },
    { movieId: 'm2', directorName: 'Christopher Nolan' },
    { movieId: 'm3', directorName: 'Christopher Nolan' },
    { movieId: 'm4', directorName: 'Christopher Nolan' },
    { movieId: 'm5', directorName: 'Lana Wachowski' },
    { movieId: 'm6', directorName: 'Robert Zemeckis' },
    { movieId: 'm7', directorName: 'Quentin Tarantino' },
    { movieId: 'm8', directorName: 'Francis Ford Coppola' },
    { movieId: 'm9', directorName: 'David Fincher' },
    { movieId: 'm10', directorName: 'Martin Scorsese' },
  ],
  ratings: [
    { userId: 'u1', movieId: 'm1', rating: 5 },
    { userId: 'u1', movieId: 'm3', rating: 4 },
    { userId: 'u1', movieId: 'm8', rating: 5 },
    { userId: 'u2', movieId: 'm2', rating: 5 },
    { userId: 'u2', movieId: 'm5', rating: 4 },
    { userId: 'u2', movieId: 'm9', rating: 4 },
    { userId: 'u3', movieId: 'm1', rating: 4 },
    { userId: 'u3', movieId: 'm6', rating: 5 },
    { userId: 'u3', movieId: 'm8', rating: 5 },
    { userId: 'u4', movieId: 'm3', rating: 5 },
    { userId: 'u4', movieId: 'm4', rating: 5 },
    { userId: 'u4', movieId: 'm2', rating: 4 },
  ]
};

async function seed() {
  const session = driver.session();
  try {
    console.log('Clearing database...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('Creating movies...');
    for (const movie of seedData.movies) {
      await session.run(
        'CREATE (m:Movie {id: $id, title: $title, year: $year, genre: $genre, plot: $plot})',
        movie
      );
    }

    console.log('Creating actors...');
    for (const actor of seedData.actors) {
      await session.run(
        'CREATE (a:Actor {name: $name})',
        actor
      );
    }

    console.log('Creating directors...');
    for (const director of seedData.directors) {
      await session.run(
        'CREATE (d:Director {name: $name})',
        director
      );
    }

    console.log('Creating roles (STARS_IN)...');
    for (const role of seedData.roles) {
      await session.run(
        `MATCH (m:Movie {id: $movieId}), (a:Actor {name: $actorName})
         CREATE (a)-[:STARS_IN]->(m)`,
        role
      );
    }

    console.log('Creating director relationships...');
    for (const role of seedData.directorRoles) {
      await session.run(
        `MATCH (m:Movie {id: $movieId}), (d:Director {name: $directorName})
         CREATE (d)-[:DIRECTED]->(m)`,
        role
      );
    }

    console.log('Creating users and ratings...');
    for (const rating of seedData.ratings) {
      await session.run(
        `MATCH (m:Movie {id: $movieId})
         MERGE (u:User {id: $userId})
         CREATE (u)-[:RATED {rating: $rating}]->(m)`,
        rating
      );
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
