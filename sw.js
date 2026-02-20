self.addEventListener('install', e => {
    e.waitUntil(
        caches.open('prestamos-v1.1').then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './styles.css',
                './app.js'
            ]);
        })
    );
});