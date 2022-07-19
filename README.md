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

# How to play
| Icon        | Name   | Meaning                                                               |
| ----------- | ------ | --------------------------------------------------------------------- |
|             | Blank  |                                                                       |
| Sword       | Sword  | Deal more damage than your opponent to win a die from them            |
| Shield      | Shield | Nullifies a damage from opponent                                      |
| Castle      | Morale | If the damages tie, the one with more morale wins                     |
| Book        | Book   | Does nothing, but powers-up the next attack                           |
| Skull       | Venom  | Adds Venom debuff to opponent. they will take 1 more damage per stack |
| FastForward | Fast   | (WIP)                                                                 |


| Color  | Faces  | Description         |
| ------ | ------ | ------------------- |
| WHITE  | SSSHHM | Balanced basic dice |
| BLUE   | HHHSSM | Defense dice        |
| RED    | SSSSHH | Offense dice        |
| GREEN  | VBSMM  | Poison dice         |
| AQUA   | FFSSMM | Speed dice          |
| YELLOW | MMSHH  | Morale dice         |
| PURPLE | BBHMMM | Knowledge dice      |


# Fight sequence

1. Players Collide
2. Both players back off and locked for the duel. A virtual circle appears.
3. Max dice **M** is determined by the player with less dice slots. **M** is at most 10.
4. In 3 seconds, both players choose and throw at most **M** dice
   1. If not chosen, random dice are chosen
   2. Those dice enter cooldown and cannot be used for a while.
5. The damage is assessed and applied:
   1. The player with more **speed symbol** is going to attack first
      1. If the number of speed symbols are the same, then both damages are assessed at the same time
   2. Damage calculations:
      1. Raw damage: A is going to take damage of (B.Sword + B.Buff.Sword - A.Shield - A.Buff.Shield)
      2. Bleed: if A takes damage at all, A will also take bleed damage if A has Bleed Debuff
   3. When taking damage:
      1. If the player has 1 dice left, 
      2. if all dice are in cooldown, a random die from all dice is destroyed.
      3. a non-cooldown (?) die will be destroyed.
      4. When a dice is destroyed, the opponent gains XP for upgrades
6. All buffs are then cleared.
7. Add buffs according to rolled dice:
   1. **Books** add temp Sword Buffs to self
   2. **Venom** add Venom Debuff to opponent
   3. If you have more **Morale** than opponent, add x temp Shield buff to self, where x = Morale difference
8.  If all dice are in cooldown, reset their cooldown
9.  The winning player has 1~2s of immobility, able to be challenged but cannot move


# Fight Sequence Alternatives

1. long-press a direction to throw a ball of 3 dice
2. whether it hits a player or not, it goes to cooldown.
3. if you roll a shield, you gain temp shield until before the next throw.
4. if sword hits opponent, they will take damage like above


# Upgrading

1. When players stand close to pop-up stores, they can buy stuff by spending xp.
   1. Eg: add slots up to 10
   2. Buy temp sword and shield
   3. Sell dice for xp


# TODO

- [ ] Don't lerp client player pos if too far
- [ ] Change dice fight details
- [ ] Add pop-up stores
- [ ] Add scoreboard
- [ ] Add slots
- [ ] Add dice projectiles


