const CACHE_NAME = 'chat-app-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/sound/new_message.mp3',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 [Service Worker] Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔧 [Service Worker] Кэширование файлов...');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ [Service Worker] Ошибка при кэшировании:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ [Service Worker] Активация...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ [Service Worker] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кэшированную версию если есть
        if (response) {
          console.log('📦 [Service Worker] Загружено из кэша:', event.request.url);
          return response;
        }

        // Иначе загружаем из сети
        console.log('🌐 [Service Worker] Загружено из сети:', event.request.url);
        return fetch(event.request).then((response) => {
          // Проверяем валидность ответа
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Клонируем ответ для кэширования
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch((error) => {
        console.error('❌ [Service Worker] Ошибка при загрузке:', error);
        
        // Возвращаем офлайн страницу для навигационных запросов
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Обработка push уведомлений
self.addEventListener('push', (event) => {
  console.log('🔔 [Service Worker] Получено push уведомление');
  
  const options = {
    body: event.data ? event.data.text() : 'Новое сообщение',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть чат',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Chat App', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [Service Worker] Клик по уведомлению:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Периодическая синхронизация
self.addEventListener('sync', (event) => {
  console.log('🔄 [Service Worker] Синхронизация:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации данных
      console.log('🔄 [Service Worker] Выполняется фоновая синхронизация')
    );
  }
});
