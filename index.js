require('dotenv').config({ path: `${process.argv[process.argv.length - 1]}.env` });
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const history = require('connect-history-api-fallback');
const cron = require('node-cron');
const generateSitemapAndRobots = require('./exceptions/generateSitemap');

const app = express();

// Импорт middleware и роутов 
const playwrightMiddleware = require('./middleware/playwright-middleware');
const errorMiddleware = require('./middleware/error-middleware');
const errorFilter = require('./exceptions/error-filter');

const tripRouter = require('./routers/trip-router');
const guideRouter = require('./routers/guide-router');
const authRouter = require('./routers/auth-router');
const appStateRouter = require('./routers/app-state-router');
const companionRouter = require('./routers/companion-router');
const bookingRouter = require('./routers/booking-router');
const locationRouter = require('./routers/location-router');
const adminRouter = require('./routers/admin-router');
const posterRouter = require('./routers/poster-router');
const serviceFunctionsRouter = require('./routers/service-functions-router');
const contractRouter = require('./routers/contract-router');
const catalogRouter = require('./routers/catalog-router');
const ideaRouter = require('./routers/idea-router');
const busRouter = require('./routers/bus-router');
const excursionRouter = require('./routers/excursion-router');
const photosRouter = require('./routers/photos-router');
const placesRouter = require('./routers/places-router');
const partnersRouter = require('./routers/partners-router');
const tasksRouter = require('./routers/tasks-router');
const trackRouter = require('./routers/track-router');
const paymentRouter = require('./routers/payment-router');
const helmet = require('helmet');

app.set('trust proxy', 1);
// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL, "http://localhost:5174", "https://gorodaivesi.ru", "http://localhost:3030"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'robots.txt'));
  });
  
  app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'sitemap.xml'));
  });

  app.use(helmet({
    contentSecurityPolicy: false, // иначе ломается загрузка ассетов
    crossOriginEmbedderPolicy: false, // иначе ломается PWA/картинки
    crossOriginResourcePolicy: { policy: "cross-origin" }, // разрешает загрузку статики
  }));
// Статичные файлы и sitemap
app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));

// Спасение «залипших» клиентов после смены сборки.
// PWA-worker, установленный до переезда, отдаёт из кэша старый index.html,
// который тянет бандл с прежним хешем. На новой сборке такого файла нет —
// раньше это был 404, приложение не стартовало и человек видел пустую страницу.
// Теперь вместо 404 отдаём скрипт, который снимает worker, чистит кэш и
// перезагружает страницу — дальше приходит актуальный index.html.
app.get(/^\/assets\/index\..+\.js$/, (req, res) => {
    res.type('application/javascript').send(
        `(async () => {
  try {
    // Защита от петли: чиним один раз за вкладку.
    if (sessionStorage.getItem('sw-recovered')) return;
    sessionStorage.setItem('sw-recovered', '1');
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {}
  location.reload();
})();`
    );
});

app.use('/favicon.ico', express.static(path.join(__dirname, 'dist/favicon.ico')));


// Playwright и SPA fallback
app.use(playwrightMiddleware);


app.use(history());
app.use(express.static('dist'));



// Медиа и загружаемые файлы
app.use('/images', express.static('uploads'));
app.use('/guide-elements', express.static('uploads/guide-elements/'));

// Роуты
app.use('/payments', paymentRouter);
app.use('/auth', authRouter);
app.use('/trips', tripRouter);
app.use('/guide', guideRouter);
app.use('/app-state', appStateRouter);
app.use('/companion', companionRouter);
app.use('/booking', bookingRouter);
app.use('/location', locationRouter);
app.use('/posters', posterRouter);
app.use('/contract', contractRouter);
app.use('/catalog', catalogRouter);
app.use('/idea', ideaRouter);
app.use('/excursion', excursionRouter);
app.use('/bus', busRouter);
app.use('/admin', adminRouter);
app.use('/photos', photosRouter);
app.use('/places', placesRouter);
app.use('/partners', partnersRouter);
app.use('/tasks', tasksRouter);
app.use('/tracks', trackRouter);
app.use('/service-functions', serviceFunctionsRouter);

// Обработка ошибок
app.use(errorFilter);
app.use(errorMiddleware);

// ====== 🟢 Старт всего приложения ======
async function start() {
  try {
    // 1. Подключение к MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    const db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));

    // 2. Индексы 
    await Promise.all([
      db.collections.trips.createIndex({ 'startLocation': '2dsphere' }),
      db.collections.catalogtrips.createIndex({ 'startLocation': '2dsphere' }),
      db.collections.users.createIndex({ 'userLocation': '2dsphere' }),
      db.collections.companions.createIndex({ 'startLocation': '2dsphere' }),
      db.collections.trips.createIndex({ 'includedLocations': '2dsphere' }),
      db.collections.excursions.createIndex({ 'location.coordinates': '2dsphere' }),
      db.collections.places.createIndex({ 'location.coordinates': '2dsphere' }),
      db.collections.guides.createIndex({ 'location': '2dsphere' }),
      db.collections.guides.createIndex({ 'location.coordinates': '2dsphere' }),
      db.collections.photobankphotos.createIndex({ 'location.coordinates': '2dsphere' }),
    ]);

    console.log('✅ MongoDB connected');

    // 3. Генерация sitemap и robots.txt
    await generateSitemapAndRobots();
    console.log('🗺️  Sitemap и robots.txt сгенерированы');

    // 4. Запуск сервера
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Сервер запущен на http://localhost:${process.env.PORT}`);
    });

    // 5. Периодическая генерация (каждые 24 часов)
    cron.schedule('0 */24 * * *', async () => {
      try {
        await generateSitemapAndRobots();
        console.log(`[cron] ✅ Sitemap обновлён (${new Date().toLocaleString()})`);
      } catch (err) {
        console.error('[cron] ❌ Ошибка при генерации sitemap:', err);
      }
    });

  } catch (err) {
    console.error('❌ Ошибка запуска приложения:', err);
  }
}

start();