document.getElementById('notification-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const title = document.getElementById('title').value;
    const body = document.getElementById('body').value;

    fetch('/immediateNotification', {
        method: 'POST',
        headers: {
            'Content-TYpe': 'application/json'
        },
        body: JSON.stringify({ title, body })
    })
    .then(response => {
        if (response.ok) {
            alert('通知を送信しました。');
        } else {
            alert('通知の送信に失敗しました。');
        }
    })
    .catch(error => {
        console.error('Error sending notification:', error);
        alert('通知の送信に失敗しました。エラー内容はコンソールを参照してください。');
    });
});
