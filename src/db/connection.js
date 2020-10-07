const { createPool } = require('mysql')

const pool = createPool({
    host: process.env.DB_HOST,
    database: 'heroku_0fe83a2652926f0',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
})

module.exports = pool

