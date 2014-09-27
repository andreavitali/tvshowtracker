module.exports = {
  TOKEN_SECRET: process.env.TOKEN_SECRET || 'very_secret_token_string',
  MONGODB_URI: process.env.MONGO_URI || 'localhost/tvseriestracker',
  TMDB_API_KEY: process.env.TMDB_API_KEY || 'your_themoviedb_api_key',
  TMBD_API_URL: 'http://api.themoviedb.org/3'
};