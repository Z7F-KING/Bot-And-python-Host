const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');

const docker = new Docker({ socketPath: config.dockerSocket });

// إنشاء مجلد للبوت وكتابة الكود فيه
async function prepareBotCode(botId, code, token) {
  const botDir = path.join(config.botsPath, botId.toString());
  await fs.ensureDir(botDir);
  // كتابة الملف الرئيسي main.py
  const mainPyPath = path.join(botDir, 'main.py');
  await fs.writeFile(mainPyPath, code, 'utf8');
  // كتابة ملف .env للتوكن (اختياري)
  const envPath = path.join(botDir, '.env');
  await fs.writeFile(envPath, `DISCORD_TOKEN=${token}`, 'utf8');
  return botDir;
}

// بناء الصورة (build image)
async function buildBotImage(botId, botDir) {
  const dockerfilePath = path.join(__dirname, 'docker-templates', 'python-bot.Dockerfile');
  const imageName = `bot-${botId}`;

  // نسخ Dockerfile إلى مجلد البوت (لضمان وجوده)
  await fs.copy(dockerfilePath, path.join(botDir, 'Dockerfile'));

  // بناء الصورة
  const stream = await docker.buildImage(
    { context: botDir, src: ['Dockerfile', 'main.py', '.env'] },
    { t: imageName }
  );
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
  });
  return imageName;
}

// تشغيل الحاوية
async function startBotContainer(botId, imageName) {
  const containerName = `bot-${botId}`;
  // إزالة الحاوية القديمة إن وجدت
  try {
    const oldContainer = docker.getContainer(containerName);
    await oldContainer.remove({ force: true });
  } catch (err) {}

  const container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    HostConfig: {
      RestartPolicy: { Name: 'unless-stopped' }, // إعادة تشغيل تلقائي
      Memory: 512 * 1024 * 1024, // 512 MB
    },
  });
  await container.start();
  return container.id;
}

// إيقاف الحاوية
async function stopBotContainer(containerId) {
  const container = docker.getContainer(containerId);
  await container.stop();
  await container.remove();
}

// جلب السجلات (logs)
async function getContainerLogs(containerId, tail = 100) {
  const container = docker.getContainer(containerId);
  const logs = await container.logs({ stdout: true, stderr: true, tail });
  return logs.toString('utf8');
}

module.exports = {
  prepareBotCode,
  buildBotImage,
  startBotContainer,
  stopBotContainer,
  getContainerLogs,
};
