self.addEventListener('install', e => {
    e.waitUntil(
        caches.open('prestamos-v1.2').then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './styles.css',
                './app.js',
                './manifest.json',
                './icons/icon_v2.png'
            ]);
        })
    );
});