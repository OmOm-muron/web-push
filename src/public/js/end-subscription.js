let protocol = window.location.protocol;
let host = window.location.host;
let regUrl = protocol + '//' + host + '/js/service-worker.js';

if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.getRegistration(regUrl).then((registration) => {
        // ServiceWorker.getRegistrationの戻り値であるPromiseのResultがRegistration
        if (registration) {
            document.getElementById('end-subscription').addEventListener('click', () => {
                registration.pushManager.getSubscription().then((subscription) => {
                    // Registration.pushManager.getSubscriptionの戻り値であるPromiseのResultがSubscription
                    console.log(subscription);
                    registration.unregister().then((successful) => {
                        if (successful) {
                            alert('プッシュ通知受信を登録解除しました。');
                            fetch('/unsubscribe', {
                                method: 'POST',
                                headers: {
                                'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(subscription)
                            });
                            document.getElementById('end-subscription').disabled = true;
                            document.getElementById('end-subscription').innerText = '登録されていません';
                        } else {
                            alert('登録解除に失敗しました。');
                        }
                    })
                    .catch((error) => {
                        console.error('Error during unsubscription:', error);
                    });
                });
            })
        } else {
            document.getElementById('end-subscription').disabled = true;
            document.getElementById('end-subscription').innerText = '登録されていません';
        }
    })
}
