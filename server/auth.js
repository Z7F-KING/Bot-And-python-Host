const jwt = require("jsonwebtoken");

function createToken(user) {
  return jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function verify(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(403);

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.sendStatus(401);
  }
}

module.exports = { createToken, verify };
