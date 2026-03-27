require('dotenv').config();

module.exports = {
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectURI: process.env.REDIRECT_URI,
  sessionSecret: process.env.SESSION_SECRET,
  port: process.env.PORT || 3000,
  dockerSocket: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  botsPath: process.env.BOTS_PATH || './bots-data',
};
