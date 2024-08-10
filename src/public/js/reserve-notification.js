document.getElementById('notification-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const sendTime = document.getElementById('send-time').value;
    const title = document.getElementById('title').value;
    const body = document.getElementById('body').value;

    fetch('/reserveNotification', {
        method: 'POST',
        headers: {
            'Content-TYpe': 'application/json'
        },
        body: JSON.stringify({ sendTime, title, body })
    })
    .then(response => {
        if (response.ok) {
            alert('通知を予約しました。');
        } else {
            alert('通知の予約に失敗しました。');
        }
    })
    .catch(error => {
        console.error('Error reserving notification:', error);
        alert('通知の予約に失敗しました。エラー内容はコンソールを参照してください。');
    });
});
