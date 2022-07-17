# dice-io
Roll dice to fight in an IO game


- `public_src` has the client side
- `src` has the server side


# Local dev

## Server
```bash
npm start
```

## Client
```bash
npm run dev
```
When doing local-dev, add this to local storage of "http://localhost:8080":

| key               | value               |
| ----------------- | ------------------- |
| md.dickson.ws_url | ws://localhost:3000 |

# Deploy

## Client

```bash
npm run build && ./compress-build.sh
```

Copy zip file to itch.io

## Server

```bash
git clone https://github.com/vicksonzero/dice-io.git
cd dice-io
echo "USE_SSL=true" > .env
npm i
npm i -g typescript
npm start
```

pm2
```bash
pm2 ls
pm2 start /root/dice-io/server-dist/server-src/index.js --name dice-io
pm2 logs dice-io
pm2 show dice-io
```

Restart pm2 server:
```bash
# git reset --hard # if needed
git pull && tsc && pm2 restart dice-io
```