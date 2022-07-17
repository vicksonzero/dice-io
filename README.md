# dice-io
Roll dice to fight in an IO game


- `public_src` has the client side
- `src` has the server side


# Local dev

Server
```bash
npm start
```

Client
```bash
npm run dev
```

# Deploy

## Client

```bash
npm run build
./compress-build.sh
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
pm2 
```

Restart server:
```bash
# git reset --hard # if needed
git pull && tsc && pm2 restart dice-io
```