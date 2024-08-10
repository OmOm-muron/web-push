const publicKey = '[publickey]';

if ('serviceWorker' in navigator && 'PushManager' in window) {
    document.getElementById('start-subscription').addEventListener('click', () => {
        navigator.serviceWorker.register('./js/service-worker.js')
        // registerの戻り値がregistration
        .then(async (registration) => {
            alert('通知受取登録します');
            // 1秒待ってから登録開始
            await setTimeout(() => {
                console.log('Service Worker registered:', registration);
                // 受取登録
                registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey)
                })
                // subscribeの戻り値がsubscription
                .then((subscription) => {
                    console.log('Push subscription:', subscription);
    
                    // サーバにサブスクリプション情報を送信
                    return fetch('/subscribe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(subscription)
                    });
                })
                .then(() => {
                    console.log('Subscription sent to server.');
                    alert('プッシュ通知受取を登録しました。');
                })
                .catch((error) => {
                    console.error('Failed to subscribe:', error);
                    alert('プッシュ通知受取の登録に失敗しました。');
                });
            }, 1000);
        })
        .catch((error) => {
            console.error('Service Worker registration failed:', error);
        });
    })
} else {
    console.warn('Push messaging is not supported');
    alert('このブラウザはプッシュ通知に対応していません。');
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
