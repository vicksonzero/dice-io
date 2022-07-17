"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiceSide = exports.Dice = void 0;
class Dice {
    constructor() {
        this.symbol = '';
        this.sides = [];
        this.color = 0xffffff;
        this.desc = '';
    }
    loadSide(sideIndex) {
        // this.sides.forEach(side => side.weight = 1);
        this.sides[sideIndex].weight += 1;
    }
    static create(symbol, sides, color, desc = '') {
        const result = new Dice();
        result.symbol = symbol;
        result.sides = sides.split('').map(sideType => DiceSide.create(sideType));
        result.color = color;
        result.desc = desc;
        return result;
    }
    static getRandomDice(tier) {
        const name = Dice.getRandomDiceName(tier);
        const def = Dice.diceDefinitions[name];
        return Dice.create(name[0], def.sides, def.color, def.desc);
    }
    static getRandomDiceName(tier) {
        var _a;
        let dist = (_a = Dice.diceDistribution[tier]) !== null && _a !== void 0 ? _a : Dice.diceDistribution[Dice.diceDistribution.length - 1];
        const weights = Object.entries(dist);
        const totalWeight = Object.values(dist).reduce((a, b) => a + b, 0);
        const diceThrow = Math.random() * totalWeight;
        let acc = 0;
        let index = -1;
        do {
            ++index;
            const [name, weight] = weights[index];
            acc += weight;
        } while (!(diceThrow < acc) && index + 1 < weights.length);
        // console.log(diceThrow.toFixed(1), totalWeight, index);
        const [name, weight] = weights[index];
        return name;
    }
}
exports.Dice = Dice;
Dice.diceDefinitions = {
    /* cSpell:disable */
    WHITE: { sides: 'SSSHHM', color: 0xc1e7e8, desc: 'Balanced basic dice' },
    BLUE: { sides: 'SSHHHM', color: 0x4257f5, desc: 'Defense dice' },
    RED: { sides: 'SSSSHH', color: 0xf55442, desc: 'Offense dice' },
    GREEN: { sides: 'VBSMM ', color: 0x68d647, desc: 'Poison dice' },
    AQUA: { sides: 'FFSSMM', color: 0x5fe8ed, desc: 'Speed dice' },
    YELLOW: { sides: 'MMSHH ', color: 0xf5dd53, desc: 'Morale dice' },
    PURPLE: { sides: 'BBHMMM', color: 0xc430e6, desc: 'Knowledge dice' },
    /* cSpell:enable */
};
Dice.diceDistribution = [
    { WHITE: 5, BLUE: 2, RED: 2, GREEN: 0, AQUA: 0, YELLOW: 1, PURPLE: 0 },
    { WHITE: 1, BLUE: 4, RED: 4, GREEN: 1, AQUA: 2, YELLOW: 1, PURPLE: 1 },
    { WHITE: 0, BLUE: 2, RED: 2, GREEN: 3, AQUA: 3, YELLOW: 2, PURPLE: 3 },
];
class DiceSide {
    constructor() {
        this.suit = '';
        this.weight = 1;
    }
    static create(suit) {
        const result = new DiceSide();
        result.suit = suit;
        return result;
    }
}
exports.DiceSide = DiceSide;
//# sourceMappingURL=Dice.js.map