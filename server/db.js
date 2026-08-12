const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt+s://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'cognodb',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

module.exports = {
  driver,
  getSession: () => driver.session(),
  runQuery: async (query, params = {}) => {
    const session = driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }
};
