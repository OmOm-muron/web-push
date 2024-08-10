## Initialize application
```
$> mkdir web-push
$> cd web-push
$> npm init -y
```
## Install libraries
```
$> npm install express body-parser web-push pg
```
## Create database and tables
```
$> createdb -U [username] notification
$> psql -U [username] -d notification
```
```
CREATE TABLE client (
    client_id serial primary key,
    endpoint varchar(512),      
    expiration_time timestamp,
    keys_p256dh varchar(256),
    keys_auth varchar(64),
    client_attribute varchar(64)
);
```
```
CREATE TABLE notification (
    notification_id serial primary key,
    send_time timestamp,
    title varchar(64),
    body varchar(256),
    client_attribute varchar(64)
);
```
## Create VAPID keys
Save following code as 'genkey.js'.
```
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```
Execute command below.
```
node genkey.js
```
## Overwrite some files
These files include variables depending on environments.
* src/server.js includes VAPID details, database connection
* src/public/start-subscription.js includes publickey
* src/public/force-subscription.js includes publickey
