self.addEventListener('install', e => {
    e.waitUntil(
        caches.open('prestamos-v1.4').then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './styles.css',
                './app.js',
                './manifest.json',
                './icons/icon_v1.3.png'
            ]);
        })
    );
});