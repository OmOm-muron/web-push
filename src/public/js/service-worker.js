self.addEventListener('push', (event) => {
    const data = event.data.json();
    const title = data.title;
    const option = {
        body: data.body,
        icon: '../images/logo.jpg'
    };

    event.waitUntil(
        self.registration.showNotification(title, option)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
})