const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const path = require('path');
const { stringify } = require('querystring');
const { Pool } = require('pg');

const app = express();

// VAPIDキー
const vapidKeys = {
    publicKey: '[publicKey]',
    privateKey: '[privateKey]'
};

// Web-Pushの認証情報
webpush.setVapidDetails(
    'mailto:[mail_address]',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// DBコネクションプール
const pool = new Pool({
    host: '[host]',
    port: [port],
    user: '[username]',
    password: '[password]',
    database: 'notification',
});

// ミドルウェア(Node.jsにおけるWEBプロセス的なやつ)
app.use(bodyParser.json());
// __dirname = '/path/to/web-push/src/'
app.use(express.static(path.join(__dirname, 'public')));

// 通知受取登録ページ
app.get('/start-subscribe', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/start-subscription.html'));
})
// 通知受取強制登録ページ
app.get('/force-subscribe', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/force-subscription.html'));
})
// 通知受取解除ページ
app.get('/end-subscribe', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/end-subscription.html'));
})
// 通知送信ページ
app.get('/immediate-notification', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/immediate-notification.html'));
})
// 通知予約ページ
app.get('/reserve-notification', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/reserve-notification.html'));
})
// 未送信の通知予約一覧ページ
app.get('/reservation-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/reservation-list.html'));
})

// subscription登録を受け付ける処理(エンドポイント)
app.post('/subscribe', async (req, res) => {
    // bodyの内容は別途定義 -> public/js/start-subscription.js
    const subscription = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO client (endpoint, expiration_time, keys_p256dh, keys_auth) VALUES ($1, $2, $3, $4)',
            [subscription.endpoint, subscription.expirationTime, subscription.keys.p256dh, subscription.keys.auth]
        );
        res.status(201).json({});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error has occurred while registering subscription.');
    }
});

// subscriptionを解除する処理(エンドポイント)
app.post('/unsubscribe', async (req, res) => {
    const unsubscribe = req.body;
    console.log(unsubscribe);
    try {
        const result = await pool.query(
            'DELETE FROM client WHERE endpoint = $1',
            [unsubscribe.endpoint]
        );
        res.status(201).json({});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error has occurred while deleting subscription.');
    }
});

// プッシュ通知を即時送信する処理(エンドポイント)
app.post('/immediateNotification', async (req, res) => {
    try {
        // subscriptionを取得
        const subscriptions = await getSubscriptions();

        // 通知内容を取得
        const { title, body } = req.body;
        const notification = JSON.stringify({ title, body });
        // 各subscriptionに通知を送信
        Promise.all(subscriptions.map(subscription => webpush.sendNotification(subscription, notification)))

        // 送信後に記録としてnotificationに登録
        const result = await pool.query(
            'INSERT INTO notification (send_time, title, body) VALUES ($1, $2, $3)',
            ['1900/01/01 00:00:00', notification.title, notification.body]
        );
        res.status(201).json({});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error has occurred while sending/logging notification.');
    }
});

// プッシュ通知予約を登録する処理(エンドポイント)
app.post('/reserveNotification', async (req, res) => {
    const notification = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO notification (send_time, title, body) VALUES ($1, $2, $3)',
            [notification.sendTime, notification.title, notification.body]
        );
        res.status(201).json({});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error has occurred while reserving notification.');
    }
});

// 未送信のプッシュ通知予約一覧を取得する処理(エンドポイント)
app.get('/reservationList', async (req, res) => {
    let notifications = [];
    console.log(notifications);
    try {
        notifications = await getAllNotifications();
        if (notifications.length < 1) {
            return;
        } else {
            res.json(notifications);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error has occurred while get notification list.');
    }
});

async function sendNotification() {
    console.log(new Date());
    let notifications = [];
    let subscriptions = [];

    try {
        // 時間に至った通知情報を取得
        notifications = await getNotifications();
        // subscriptionを全て取得
        subscriptions = await getSubscriptions();
    } catch (err) {
        console.error(err);
    }
    
    // 各通知を各subscriptionに対して送信
    for (let notification of notifications) {
        console.log(notification);
        Promise.all(subscriptions.map(subscription => webpush.sendNotification(subscription, notification)))
        .catch(error => {
            console.error('Error has occured while sending push notification:', error);
        });
    }
}

// subscriptionを全て取得する
async function getSubscriptions() {
    try {
        let subscriptions = [];
        let subscriptionsResult = await pool.query('SELECT endpoint, expiration_time, keys_p256dh, keys_auth FROM client');
        subscriptionsResult.rows.forEach((resultRow) => {
            let key = {};
            key.p256dh = resultRow.keys_p256dh;
            key.auth = resultRow.keys_auth;
            
            let subscription = {
                endpoint: resultRow.endpoint,
                expirationTime: resultRow.expiration_time,
                keys: key
            };
            subscriptions.push(subscription);
            console.log(subscription);
        });
        return subscriptions;
    } catch (err) {
        console.error(err);
    }
}

// 通知時刻1分以内のnotificationを全て取得する
async function getNotifications() {
    try {
        let notifications = [];
        let notificationsResult = await pool.query("SELECT title, body FROM notification WHERE send_time > NOW() - INTERVAL '1 minute' AND send_time < NOW() + INTERVAL '1 minute'");
        notificationsResult.rows.forEach((notification) => {
            let title = notification.title;
            let body = notification.body;
            notifications.push(JSON.stringify({ title, body }));
        });
        return notifications;
    } catch (err) {
        console.error(err);
    }
}

// 未送信のnotificationを全て取得する
async function getAllNotifications() {
    try {
        let notifications = [];
        let notificationsResult = await pool.query("SELECT send_time, title, body FROM notification WHERE send_time > NOW()");
        notificationsResult.rows.forEach((notification) => {
            let sendTime = notification.send_time;
            let title = notification.title;
            let body = notification.body;
            notifications.push(JSON.stringify({ sendTime, title, body }));
        });
        return notifications;
    } catch (err) {
        console.error(err);
    }
}

// 通知送信処理を毎分実行
setInterval(sendNotification, 60000);

// サーバ起動スクリプト
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(new Date());
});
