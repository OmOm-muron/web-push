async function fetchNotifications() {
    try {
        // notificationリストを取得
        const response = await fetch('http://localhost:3000/reservationList');
        const notifications = await response.json();
        // tbodyを取得
        const tableBody = document.getElementById('notifications-table').getElementsByTagName('tbody')[0];
        // notificationをtbodyに追加していく
        notifications.forEach((notification) => {
            let notificationJSON = JSON.parse(notification);
            let row = tableBody.insertRow();
            let sendTimeCell = row.insertCell(0);
            let titleCell = row.insertCell(1);
            let bodyCell = row.insertCell(2);

            sendTimeCell.textContent = notificationJSON.sendTime;
            titleCell.textContent = notificationJSON.title;
            bodyCell.textContent = notificationJSON.body;
        });
    } catch (error) {
        console.error('Error has occurred while fetching notificaions', error);
    }
}

// ロード時にfetch
window.onload = fetchNotifications();