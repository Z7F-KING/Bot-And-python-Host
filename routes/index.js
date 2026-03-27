const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const config = require('./config');
const db = require('./db');
const logger = require('./utils/logger');

const app = express();

// إعدادات EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/bots', require('./routes/bots'));

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(config.port, () => {
  logger.info(`Server running on http://localhost:${config.port}`);
});
