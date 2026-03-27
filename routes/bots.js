const express = require('express');
const db = require('../db');
const dockerManager = require('../dockerManager');
const logger = require('../utils/logger');
const router = express.Router();

// Middleware: التحقق من تسجيل الدخول
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

// عرض لوحة التحكم (قائمة البوتات)
router.get('/', ensureAuth, (req, res) => {
  db.all('SELECT * FROM bots WHERE user_id = ?', [req.user.id], (err, bots) => {
    if (err) {
      logger.error(err);
      return res.status(500).send('Database error');
    }
    res.render('dashboard', { user: req.user, bots });
  });
});

// صفحة إضافة بوت جديد
router.get('/new', ensureAuth, (req, res) => {
  res.render('new-bot', { user: req.user });
});

// إضافة بوت جديد
router.post('/', ensureAuth, async (req, res) => {
  const { name, token, code } = req.body;
  if (!name || !token || !code) {
    return res.status(400).send('Name, token, and code are required');
  }

  db.run(
    'INSERT INTO bots (name, token, code, user_id) VALUES (?, ?, ?, ?)',
    [name, token, code, req.user.id],
    async function (err) {
      if (err) {
        logger.error(err);
        return res.status(500).send('Error creating bot');
      }
      const botId = this.lastID;
      try {
        // 1. حفظ الكود والتوكن في الملفات
        await dockerManager.prepareBotCode(botId, code, token);
        // 2. بناء الصورة
        const botDir = `${process.env.BOTS_PATH || './bots-data'}/${botId}`;
        const imageName = await dockerManager.buildBotImage(botId, botDir);
        // 3. تشغيل الحاوية
        const containerId = await dockerManager.startBotContainer(botId, imageName);
        // 4. تحديث قاعدة البيانات
        db.run('UPDATE bots SET container_id = ?, status = ? WHERE id = ?', [containerId, 'running', botId]);
        res.redirect('/dashboard');
      } catch (err) {
        logger.error(err);
        db.run('DELETE FROM bots WHERE id = ?', [botId]);
        res.status(500).send(`Failed to start bot: ${err.message}`);
      }
    }
  );
});

// صفحة تفاصيل البوت (سجلات، تشغيل/إيقاف)
router.get('/:id', ensureAuth, (req, res) => {
  db.get('SELECT * FROM bots WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], async (err, bot) => {
    if (err || !bot) return res.status(404).send('Bot not found');
    let logs = '';
    if (bot.container_id && bot.status === 'running') {
      try {
        logs = await dockerManager.getContainerLogs(bot.container_id, 200);
      } catch (e) { logs = 'Could not fetch logs'; }
    }
    res.render('bot-detail', { user: req.user, bot, logs });
  });
});

// تشغيل بوت
router.post('/:id/start', ensureAuth, async (req, res) => {
  const bot = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM bots WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  if (!bot) return res.status(404).send('Bot not found');
  try {
    // إعادة إنشاء الملفات (لضمان وجود أحدث كود)
    await dockerManager.prepareBotCode(bot.id, bot.code, bot.token);
    const botDir = `${process.env.BOTS_PATH || './bots-data'}/${bot.id}`;
    const imageName = await dockerManager.buildBotImage(bot.id, botDir);
    const containerId = await dockerManager.startBotContainer(bot.id, imageName);
    db.run('UPDATE bots SET container_id = ?, status = ? WHERE id = ?', [containerId, 'running', bot.id]);
    res.redirect(`/bots/${bot.id}`);
  } catch (err) {
    logger.error(err);
    res.status(500).send(`Error starting bot: ${err.message}`);
  }
});

// إيقاف بوت
router.post('/:id/stop', ensureAuth, async (req, res) => {
  const bot = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM bots WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  if (!bot || !bot.container_id) return res.status(404).send('Bot not found or not running');
  try {
    await dockerManager.stopBotContainer(bot.container_id);
    db.run('UPDATE bots SET container_id = NULL, status = ? WHERE id = ?', ['stopped', bot.id]);
    res.redirect(`/bots/${bot.id}`);
  } catch (err) {
    logger.error(err);
    res.status(500).send(`Error stopping bot: ${err.message}`);
  }
});

module.exports = router;
