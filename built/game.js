// TYPE DEFINITIONS, ENUMS AND CUSTOM EVENTS
const PLAYERCHANGE = new Event("player-change");
var GAMESTATES;
(function (GAMESTATES) {
    GAMESTATES[GAMESTATES["READY"] = 0] = "READY";
    GAMESTATES[GAMESTATES["FIRED"] = 1] = "FIRED";
    GAMESTATES[GAMESTATES["WAITING"] = 2] = "WAITING";
    GAMESTATES[GAMESTATES["PAUSED"] = 3] = "PAUSED";
    GAMESTATES[GAMESTATES["GAMEOVER"] = 4] = "GAMEOVER";
})(GAMESTATES || (GAMESTATES = {}));
var TERRAINS;
(function (TERRAINS) {
    TERRAINS[TERRAINS["MOUNTAINS"] = 1] = "MOUNTAINS";
    TERRAINS[TERRAINS["FOREST"] = 2] = "FOREST";
    TERRAINS[TERRAINS["DESERT"] = 3] = "DESERT";
    TERRAINS[TERRAINS["RANDOM"] = 4] = "RANDOM";
})(TERRAINS || (TERRAINS = {}));
var PLAYERSTATES;
(function (PLAYERSTATES) {
    PLAYERSTATES[PLAYERSTATES["TELEPORTING"] = 0] = "TELEPORTING";
    PLAYERSTATES[PLAYERSTATES["FALLING"] = 1] = "FALLING";
    PLAYERSTATES[PLAYERSTATES["CHILLING"] = 2] = "CHILLING";
})(PLAYERSTATES || (PLAYERSTATES = {}));
// WEAPONS
class Explosion extends Entity {
    constructor(room, layer, x, y, radius) {
        super(room, layer);
        this.sprite = new Sprite(document.getElementById('explosion'));
        this.x = x;
        this.y = y;
        this.radius = radius / 2;
        this.sprite.center([this.sprite.width / 2, this.sprite.height / 2]).scale(this.radius / 160);
        setTimeout(() => {
            this.destroy();
        }, 100);
    }
    update(delta) {
        this.radius += delta;
        this.sprite.scale(this.radius / 160);
    }
    draw(context) {
        this.sprite.draw(context, this.x, this.y);
    }
}
class Bullet extends Entity {
    constructor(room, x, y, power, angle) {
        super(room, 0);
        this.physicsSpeed = 0.075;
        this.windMultiplier = 0.005;
        this.powerMultiplier = 100;
        this.room = room;
        this.x = x;
        this.y = y;
        this.power = power * this.powerMultiplier;
        this.angle = angle;
        this.vx = this.power * Math.cos(this.angle);
        this.vy = this.power * Math.sin(this.angle);
    }
    explode() {
        this.room.ground.blow(this.x, this.y, this.radius);
        // deduct damage from all tanks within certain radius
        this.room.players.forEach(player => {
            var radius = this.radius * 2;
            var distance = Utility.distance([player.x, player.y], [this.x, this.y]);
            if (distance < player.sprite.width / 2)
                distance = 0;
            else
                distance = Math.min(distance, radius);
            var damage = (1 - distance / radius) * this.damage;
            player.info.health -= ~~damage;
        });
        new Explosion(this.room, this.layer, this.x, this.y, this.radius);
        this.destroy();
    }
    update(delta) {
        // physics
        this.x += this.vx * this.physicsSpeed;
        this.y += this.vy * this.physicsSpeed;
        this.vy += 9.8 * this.physicsSpeed;
        this.vx += this.room.wind * this.windMultiplier;
        if (this.x < 0 || this.x > this.room.width || this.y > this.room.height - 1)
            this.destroy();
        // check for collision with ground
        if (this.y > this.room.height - this.room.ground.harry[Math.round(this.x)]) {
            this.onImpact();
        }
    }
}
class SmallMissile extends Bullet {
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle);
        this.radius = 20;
        this.damage = 30;
    }
    onImpact() {
        this.explode();
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle = "black";
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill();
    }
}
class Missile extends Bullet {
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle);
        this.radius = 20;
        this.damage = 30;
    }
    onImpact() {
        this.explode();
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle = "red";
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill();
    }
}
class SmallAtomBomb extends Bullet {
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle);
        this.radius = 40;
        this.damage = 50;
    }
    onImpact() {
        this.explode();
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle = "red";
        context.beginPath();
        context.arc(this.x, this.y, 4, 0, 2 * Math.PI, true);
        context.fill();
    }
}
class AtomBomb extends Bullet {
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle);
        this.radius = 60;
        this.damage = 70;
    }
    onImpact() {
        this.explode();
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle = "red";
        context.beginPath();
        context.arc(this.x, this.y, 5, 0, 2 * Math.PI, true);
        context.fill();
    }
}
class VolcanoBomb extends Bullet {
    constructor(room, x, y, power, angle) {
        super(room, x, y, power, angle);
        this.radius = 20;
        this.fragmentpower = 70;
        this.fragmentminpower = 30;
        this.damage = 30;
    }
    onImpact() {
        // create 4 more bullets going in random directions
        new SmallMissile(this.room, this.x - 1, this.y - 11, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, -(Math.random() * Math.PI / 2 + Math.PI / 4));
        new SmallMissile(this.room, this.x + 2, this.y - 9, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, -(Math.random() * Math.PI / 2 + Math.PI / 4));
        new SmallMissile(this.room, this.x - 3, this.y - 12, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, -(Math.random() * Math.PI / 2 + Math.PI / 4));
        new SmallMissile(this.room, this.x, this.y - 4, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, -(Math.random() * Math.PI / 2 + Math.PI / 4));
        new SmallMissile(this.room, this.x + 1, this.y - 8, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, -(Math.random() * Math.PI / 2 + Math.PI / 4));
        this.explode();
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle = "#591415"; //dark red
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill();
    }
}
class Shower extends Bullet {
    constructor(room, x, y, power, angle, count = 5) {
        super(room, x, y, power + (6 * (count - 3)), angle);
        this.radius = 20;
        this.damage = 35;
        // create 5 new shower bullets
        if (count > 0) {
            setTimeout(() => {
                new Shower(room, x, y, power, angle, count - 1);
            }, 100);
        }
    }
    onImpact() {
        this.explode();
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle = "#591415"; //dark red
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill();
    }
}
class HotShower extends Bullet {
    constructor(room, x, y, power, angle, count = 5) {
        super(room, x, y, power + (6 * (count - 3)), angle);
        this.radius = 20;
        this.damage = 35;
        // create 5 new shower bullets
        if (count > 0) {
            setTimeout(() => {
                new HotShower(room, x, y, power, angle, count - 1);
            }, 100);
        }
    }
    onImpact() {
        this.explode();
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle = "red"; //dark red
        context.beginPath();
        context.arc(this.x, this.y, 3.5, 0, 2 * Math.PI, true);
        context.fill();
    }
}
class Weapon {
    constructor(amount, item, name, cost, img) {
        this.amount = amount;
        this.item = item;
        this.name = name;
        this.cost = cost;
        this.img = img;
    }
}
// PLAYERS
class Player extends Entity {
    constructor(room, info) {
        super(room, 0);
        // sprites
        this.sprite = new Sprite(document.getElementById("tank"));
        this.sprMuzzle = new Sprite(document.getElementById("muzzle"));
        this.parachute = new Sprite(document.getElementById('parachute'));
        this.focusArrow = new Sprite(document.getElementById('arrowdown')).scale(0.75);
        this.teleportSprite = new Sprite(document.getElementById('teleport-circle'));
        // flags
        this.falling = false;
        this.showFocus = false;
        this.state = PLAYERSTATES.CHILLING;
        this.switchTurnsWhenTouchesGround = false;
        this.destroyed = false;
        // counters
        this.focusY = 0;
        this.oldx = 0;
        this.oldy = 0;
        this.room = room;
        this.info = info;
        this.sprite.center([0, this.sprite.height / 2]).tint(this.info.color);
        this.sprMuzzle.center([0, this.sprMuzzle.height / 2]);
        this.parachute.center([this.parachute.width / 2, this.parachute.height]);
        this.focusArrow.center([this.focusArrow.width / 2, this.focusArrow.height]);
        this.teleportSprite.center([this.teleportSprite.width / 2 + 10, this.teleportSprite.height / 2 + 15]).scale(0.5);
        // set x and y coords of tank
        this.x = ~~(Math.random() * (room.width - 400) + 200);
        this.y = this.room.height - this.room.ground.harry[this.x];
        window.addEventListener('player-change', () => {
            this.info.power = Math.min(this.info.power, this.info.health);
            if (this.room.player == this)
                this.showFocus = true;
            setTimeout(() => {
                this.showFocus = false;
            }, 3000);
        });
    }
    nextWeapon(direction) {
        this.info.weaponIndex = (this.info.weaponIndex + direction) % (this.info.weapons.length);
        if (this.info.weaponIndex < 0)
            this.info.weaponIndex = this.info.weapons.length - 1;
        this.room.guiHandler.syncAll();
    }
    shoot() {
        var startOfMuzzle, endOfMuzzle;
        if (this.state == PLAYERSTATES.CHILLING) {
            startOfMuzzle = Utility.rotatePoint(this.x, this.y, this.sprite.width - 3, this.sprite.angle);
            endOfMuzzle = Utility.rotatePoint(startOfMuzzle[0], startOfMuzzle[1], this.sprMuzzle.width, this.sprMuzzle.angle);
            if (this.info.weapons.length > 0) {
                new this.info.weapons[this.info.weaponIndex].item(this.room, endOfMuzzle[0], endOfMuzzle[1], this.info.power / 100, this.sprMuzzle.angle);
                this.room.state = GAMESTATES.FIRED;
            }
        }
    }
    /**
     * Drive the tank in a direction
     * @param direction Whether to drive in a positive direction
     * @returns void
     */
    drive(direction) {
        var p1, p2, p3, a, b, c, dist;
        if (this.info.gas < 1)
            return;
        dist = 4.0 * direction;
        p1 = [~~this.x + dist, this.room.ground.harry[~~this.x + dist]];
        p2 = [~~this.x + dist * 2, this.room.ground.harry[~~this.x + dist * 2]];
        p3 = [~~this.x + dist * 3, this.room.ground.harry[~~this.x + dist * 3]];
        a = Utility.distance(p1, p2);
        b = Utility.distance(p2, p3);
        c = Utility.distance(p1, p3);
        var C = Math.acos((a * a + b * b - c * c) / (2 * a * b)) * 180 / Math.PI;
        // console.log()
        // if (Math.abs(Math.atan((p3[1]-p2[1])/dist)) < 1.1) {
        //     if (Math.abs(Math.atan((p2[1]-p1[1])/dist)) < 1.1) {
        if (C > 160) {
            this.info.gas -= 0.2;
            this.x += 0.3 * direction;
            this.y = this.room.height - this.room.ground.harry[~~this.x] + 1;
            this.room.gasElement.sync();
            // }
        }
    }
    // dead, lets explode!
    explode() {
        new Explosion(this.room, this.layer, this.x, this.y, 60);
        this.destroyed = true;
    }
    update(delta) {
        // health is gone
        if (this.destroyed == false && this.info.health < 20) {
            this.explode();
            setTimeout(() => {
                this.room.checkGameOver();
            }, 1000);
        }
        if (this.state == PLAYERSTATES.CHILLING) {
            // check for change in x y, expensive computation
            if (this.oldx != this.x || this.oldy != this.y) {
                // adjust angle to match ground
                // sample 3 points and find average angle
                var dist = 16.0;
                var p1 = this.room.ground.harry[~~this.x - dist];
                var p2 = this.room.ground.harry[~~this.x];
                var p3 = this.room.ground.harry[~~this.x + dist];
                this.sprite.angle = -((Math.atan((p3 - p2) / dist) + Math.atan((p2 - p1) / dist)) / 2) - Math.PI / 2;
            }
            if (this.y < this.room.height - this.room.ground.harry[~~this.x]) {
                this.state = PLAYERSTATES.FALLING;
            }
        }
        else if (this.state == PLAYERSTATES.FALLING) {
            // function to keep tank on ground
            if (this.y < this.room.height - this.room.ground.harry[~~this.x]) {
                this.y += delta / 32;
                this.x += this.room.wind * 0.005;
                // check if off room
                if (this.y > this.room.height - 1) {
                    this.explode();
                    this.room.checkGameOver();
                }
            }
            else {
                if (this.switchTurnsWhenTouchesGround) {
                    this.room.switchTurns();
                    this.switchTurnsWhenTouchesGround = false;
                }
                this.state = PLAYERSTATES.CHILLING;
            }
        }
        else if (this.state == PLAYERSTATES.TELEPORTING) {
            if (InputSingleton.getInstance().mousedown) {
                new Explosion(this.room, this.layer, this.x, this.y, 45);
                setTimeout(() => {
                    // we teleport wherever we click
                    this.x = InputSingleton.getInstance().mx;
                    this.y = InputSingleton.getInstance().my;
                    this.switchTurnsWhenTouchesGround = true;
                }, 100);
                this.state = PLAYERSTATES.CHILLING;
            }
        }
        this.oldx = this.x;
        this.oldy = this.y;
        this.sprMuzzle.angle = -this.info.angle + this.sprite.angle + Math.PI / 2;
    }
    draw(context) {
        if (this.destroyed)
            return;
        // draw tank
        this.sprite.draw(context, this.x, this.y);
        var rotatedPoint = Utility.rotatePoint(this.x, this.y, this.sprite.width - 3, this.sprite.angle);
        this.sprMuzzle.draw(context, rotatedPoint[0], rotatedPoint[1]);
        if (this.state == PLAYERSTATES.FALLING) {
            this.parachute.draw(context, rotatedPoint[0], rotatedPoint[1]);
        }
        else if (this.state == PLAYERSTATES.TELEPORTING) {
            this.teleportSprite.draw(context, InputSingleton.getInstance().mx, InputSingleton.getInstance().my);
        }
        // draw arrow point down on tank
        if (this.showFocus) {
            this.focusArrow.draw(context, this.x, this.y - 75 + Math.abs(this.focusY - 20));
            this.focusY = (this.focusY + 0.2) % 40;
        }
    }
}
// ROOMS
class GameRoom extends Room {
    constructor(controller) {
        super(controller, "Game Room");
        this.players = [];
        this.player = null;
        this.wind = this.randomWind();
        this.state = GAMESTATES.READY;
        this.canvas = this.controller.canvas;
        this.context = this.controller.context;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    onEnter(props, backgroundContext) {
        var _a;
        var background;
        var color;
        if (props.terrain == TERRAINS.RANDOM) {
            props.terrain = ~~(Math.random() * 3) + 1;
        }
        if (props.terrain == TERRAINS.MOUNTAINS) {
            background = document.getElementById("bg-snow");
            color = [245, 245, 255];
        }
        else if (props.terrain == TERRAINS.FOREST) {
            background = document.getElementById("bg-forest");
            color = [144, 191, 54];
        }
        else if (props.terrain == TERRAINS.DESERT) {
            background = document.getElementById("bg-desert");
            // color = [186, 67, 12]
            color = [150, 51, 6];
        }
        else {
            background = document.getElementById("bg-snow");
            color = [213, 152, 126];
        }
        // draw the room background
        backgroundContext.drawImage(background, 0, 0, this.width, this.height);
        // create the ground
        this.ground = new Ground(this, this.context, color);
        // create the players
        props.infos.forEach(info => this.addPlayer(info));
        // create GUI Elements after players have been created
        // angle number
        var angleText = new DivElement(this, this.width / 3 + 170, 70, {}, (element) => {
            var _a;
            element.innerText = `${~~(((_a = this.player) === null || _a === void 0 ? void 0 : _a.info.angle) * 180 / Math.PI)}`;
        });
        // angle slider
        this.angleElement = new SliderElement(this, this.width / 3 + 150, 30, 1 - (((_a = this.player) === null || _a === void 0 ? void 0 : _a.info.angle) / Math.PI), { width: "150px", height: "10px", backgroundImage: "url(../img/gradient-horizontal.png)", backgroundSize: "cover", backgroundRepeat: "no-repeat" }, (event) => {
            // when the slider is moved
            this.player.info.angle = (1 - event.target.value) * Math.PI;
            angleText.sync();
        }, (element) => {
            var _a;
            element['value'] = 1 - (((_a = this.player) === null || _a === void 0 ? void 0 : _a.info.angle) / Math.PI);
            angleText.sync();
        });
        // power number
        var powerText = new DivElement(this, this.width / 3 + 30, 100, {}, (element) => {
            var _a;
            element.innerText = `${~~((_a = this.player) === null || _a === void 0 ? void 0 : _a.info.power)}`;
        });
        // power slider
        this.powerElement = new SliderElement(this, this.width / 3, 100, 0.5, { width: "100px", height: "40px", transform: "rotate(270deg)", backgroundImage: "url(../img/gradient-vertical.png)", backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }, (event) => {
            // check if slider is above health, if so restrict it
            // if (event.target.value > this.player?.stats.health/100) {
            //     this.powerElement.element['value'] = this.player?.stats.health/100
            // }
            var _a;
            // when the slider is moved
            this.player.info.power = (event.target.value) * ((_a = this.player) === null || _a === void 0 ? void 0 : _a.info.health);
            powerText.sync();
            // this.powerElement.sync()
        }, (element) => {
            var _a, _b, _c, _d;
            element['value'] = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.info.power) / ((_b = this.player) === null || _b === void 0 ? void 0 : _b.info.health);
            powerText.sync();
            this.powerElement.element.style.width = `${(_c = this.player) === null || _c === void 0 ? void 0 : _c.info.health}px`;
            this.powerElement.element.style.height = `${((_d = this.player) === null || _d === void 0 ? void 0 : _d.info.health) / 100 * 40}px`;
            this.powerElement.x = this.width / 3;
            this.powerElement.y = 100 - Number.parseInt(this.powerElement.element.style.height);
            this.powerElement.refresh(this.canvas.getBoundingClientRect());
        });
        // player name
        var nameText = new DivElement(this, 0, 0, { border: "solid", borderColor: "rgba(179, 179, 179, 0.329)", borderWidth: "2px", paddingBlock: "5px", paddingInline: "40px" }, (element) => {
            var _a;
            element.innerText = (_a = this.player) === null || _a === void 0 ? void 0 : _a.info.name;
            nameText.x = element.clientWidth / 2;
            nameText.y = element.clientHeight / 2;
        });
        // fire button
        new ButtonElement(this, this.width / 3 + 150, 100, { width: "75px", height: "35px" }, () => {
            var _a;
            (_a = this.player) === null || _a === void 0 ? void 0 : _a.shoot();
        }, (element) => {
            element.value = "Fire";
        });
        // wind image
        new ImageElement(this, this.width / 2 + 300, 90, "../img/cloudr.png", { width: "50px", height: "50px", objectFit: "contain" }, (element) => {
            if (this.wind > 0) {
                element.src = "../img/cloudr.png";
            }
            else {
                element.src = "../img/cloudl.png";
            }
        });
        // wind number
        new DivElement(this, this.width / 2 + 350, 90, {}, (element) => {
            element.innerText = `${Math.abs(this.wind)}`;
        });
        // gas amount
        this.gasElement = new DivElement(this, 75, 65, {}, (element) => {
            var _a;
            element.innerText = `${~~Math.abs((_a = this.player) === null || _a === void 0 ? void 0 : _a.info.gas)}`;
        });
        // gas image
        new ImageElement(this, 30, 60, "../img/gas.png", { width: "20px", height: "30px", backgroundSize: "contain", backgroundRepeat: "no-repeat" });
        // money
        new DivElement(this, this.width / 2 + 240, 90, { textAlign: "left", width: "220px" }, (element) => {
            var _a;
            element.innerText = `$${~~((_a = this.player) === null || _a === void 0 ? void 0 : _a.info.money)}`;
        });
        // draw the weapons background and images
        // weapon name
        new DivElement(this, this.width / 2 + 260, 40, { textAlign: "left", width: "220px" }, (element) => {
            var _a, _b;
            element.innerText = (_b = (_a = this.player) === null || _a === void 0 ? void 0 : _a.info.weapons[this.player.info.weaponIndex]) === null || _b === void 0 ? void 0 : _b.name;
        });
        // weapon count
        new DivElement(this, this.width / 2 + 383, 40, { textAlign: "left" }, (element) => {
            var _a, _b;
            element.innerText = (_b = (_a = this.player) === null || _a === void 0 ? void 0 : _a.info.weapons[this.player.info.weaponIndex]) === null || _b === void 0 ? void 0 : _b.amount;
        });
        // weapon image
        new ImageElement(this, this.width / 2 + 118, 37, "../img/icosm.png", { width: "35px", height: "35px" }, (element) => {
            var _a, _b;
            element.src = `${(_b = (_a = this.player) === null || _a === void 0 ? void 0 : _a.info.weapons[this.player.info.weaponIndex]) === null || _b === void 0 ? void 0 : _b.img}`;
        });
        // back weapon arrow
        new ButtonElement(this, this.width / 2 + 80, 38, { width: "30px", height: "30px", backgroundImage: "url(../img/leftarrow.png)", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "transparent", borderStyle: "none" }, () => {
            var _a;
            (_a = this.player) === null || _a === void 0 ? void 0 : _a.nextWeapon(-1);
        });
        // next weapon arrow
        new ButtonElement(this, this.width / 2 + 421, 38, { width: "30px", height: "30px", backgroundImage: "url(../img/rightarrow.png)", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "transparent", borderStyle: "none" }, () => {
            var _a;
            (_a = this.player) === null || _a === void 0 ? void 0 : _a.nextWeapon(1);
        });
        var repairCount = new DivElement(this, 160, 100, { textAlign: "left" }, (element) => {
            var _a;
            element.innerText = (_a = this.player) === null || _a === void 0 ? void 0 : _a.info.repairs;
        });
        // repair kit
        new ButtonElement(this, 120, 100, { width: "30px", height: "30px", backgroundImage: "url(../img/repair.png)", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "transparent", borderStyle: "none" }, () => {
            if (this.player.info.health == 100)
                return;
            this.player.info.health += 15;
            this.player.info.health = Math.min(this.player.info.health, 100);
            this.player.info.repairs--;
            repairCount.sync();
            this.powerElement.sync();
        });
        var teleportCount = new DivElement(this, 300, 100, { textAlign: "left" }, (element) => {
            var _a;
            element.innerText = (_a = this.player) === null || _a === void 0 ? void 0 : _a.info.teleports;
        });
        // teleport
        new ButtonElement(this, 260, 100, { width: "30px", height: "30px", backgroundImage: "url(../img/teleport.png)", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "transparent", borderStyle: "none" }, () => {
            this.player.state = PLAYERSTATES.TELEPORTING;
            this.player.info.teleports--;
            teleportCount.sync();
        });
        this.switchTurns();
    }
    switchTurns() {
        // check if only one player remains (whos health is above 0)
        if (this.checkGameOver())
            return;
        // filter out anyone whos dead but keep current player
        var playerTurnList = this.players.filter(player => player.info.health > 0 || player == this.player);
        // next player
        if (this.player) {
            this.player = playerTurnList[(playerTurnList.indexOf(this.player) + 1) % playerTurnList.length];
        }
        else {
            this.player = playerTurnList[0];
        }
        // reset environment variables
        this.wind = this.randomWind();
        this.state = GAMESTATES.READY;
        // reset UI elements
        this.guiHandler.syncAll();
        // set players turn to first player in list
        window.dispatchEvent(PLAYERCHANGE);
    }
    checkGameOver() {
        // filter out anyone whos dead
        var alivePlayers = this.players.filter(player => player.info.health > 20);
        // if only one tank remaining
        if (alivePlayers.length < 2) {
            this.state = GAMESTATES.GAMEOVER;
            this.controller.goToRoom(UpgradeRoom);
            return true;
        }
        return false;
    }
    onExit() {
        return null;
    }
    addPlayer(info) {
        this.players.push(new Player(this, info));
    }
    randomWind() {
        return ~~(Math.random() * 40 - 20);
    }
    update(delta) {
        super.update(delta);
        // key checks
        if (InputSingleton.getInstance().keys.has(' ') && this.state == GAMESTATES.READY) {
            // create new enemy bullet in room
            this.player.shoot();
        }
        if (InputSingleton.getInstance().keys.has('ArrowDown') && this.player.info.angle > 0) {
            this.player.info.angle -= 0.01;
            this.angleElement.sync();
        }
        if (InputSingleton.getInstance().keys.has('ArrowUp') && this.player.info.angle < Math.PI) {
            this.player.info.angle += 0.01;
            this.angleElement.sync();
        }
        // get moving
        if (InputSingleton.getInstance().keys.has("ArrowLeft")) {
            // check if the ground to the left is at a steep angle
            this.player.drive(-1);
        }
        // get moving
        if (InputSingleton.getInstance().keys.has("ArrowRight")) {
            // check if the ground to the left is at a steep angle
            this.player.drive(1);
        }
        if (this.state == GAMESTATES.FIRED && !this.entityHandler.entityExists(Bullet)) {
            this.state = GAMESTATES.WAITING;
            // set a timer
            setTimeout(() => {
                this.switchTurns();
            }, 1000);
        }
    }
    draw(context) {
        super.draw(context);
        context.globalAlpha = 0.5;
        context.fillStyle = "white";
        context.fillRect(0, 0, this.width, 120);
        context.globalAlpha = 1;
        // draw the weapons area
        context.fillRect(this.width / 2 + 100, 20, 300, 35);
        context.fillStyle = "rgb(200, 200, 200)";
        context.fillRect(this.width / 2 + 100, 20, 35, 35);
        context.fillRect(this.width / 2 + 365, 20, 35, 35);
    }
}
class PlayerDetailsRoom extends Room {
    constructor(controller) {
        super(controller, "Player Details Room");
        this.infos = [];
        this.player = 0;
    }
    onEnter(passed, backgroundContext) {
        backgroundContext.clearRect(0, 0, this.width, this.height);
        backgroundContext.drawImage(document.getElementById("bg-playerdetail"), 0, 0, this.width, this.height);
        this.passed = passed;
        // create GUI elements
        new DivElement(this, 540, 350, { fontWeight: "900", fontSize: "40px" }, (element) => {
            element.innerText = `PLAYER ${this.player + 1}`;
        });
        new DivElement(this, 400, 425, {}, (element) => {
            element.innerText = `NAME: `;
        });
        var name = new InputElement(this, 590, 420, { width: "250px", height: "50px", border: "solid", padding: "2px", borderWidth: "2px", borderColor: "black" }, (element) => {
            element.value = "";
        });
        new DivElement(this, 400, 500, {}, (element) => {
            element.innerText = `COLOR: `;
        });
        // create each of our radio inputs
        var radios = [
            new RadioButton("c", "", "red", { backgroundColor: "rgb(255, 100, 100)" }),
            new RadioButton("c", "", "green", { backgroundColor: "rgb(100, 255, 100)" }),
            new RadioButton("c", "", "yellow", { backgroundColor: "rgb(255, 255, 100)" }),
            new RadioButton("c", "", "blue", { backgroundColor: "rgb(100, 100, 255)" })
        ];
        var colors = new RadioElement(this, 540, 495, radios, { display: "flex", flexDirection: "row" });
        new DivElement(this, 490, 580, { fontWeight: "900", fontSize: "40px" }, (element) => {
            if (this.player == passed.players - 1) {
                element.innerText = `START!`;
            }
            else {
                element.innerText = `NEXT PLAYER`;
            }
        });
        new ButtonElement(this, 690, 575, { width: "70px", height: "50px", backgroundImage: "url(../img/nextarrow.png)", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "transparent", border: "none" }, () => {
            var info = this.defaultPlayer(name.element['value'], colors.getChecked());
            this.infos.push(info);
            // actually play the game
            if (this.player < passed.players - 1) {
                this.player++;
                this.guiHandler.syncAll();
            }
            else {
                this.controller.goToRoom(GameRoom);
            }
        });
        this.guiHandler.syncAll();
    }
    onExit() {
        return { infos: this.infos, terrain: this.passed.terrain };
    }
    defaultPlayer(name, color) {
        return {
            name,
            color,
            weapons: [
                new Weapon(99, SmallMissile, "Small missile", 2000, "../img/icosm.png")
            ],
            weaponIndex: 0,
            gas: 100,
            health: 100,
            repairs: 8,
            parachutes: 6,
            teleports: 6,
            power: 25,
            angle: Math.PI / 2,
            money: 0
        };
    }
}
class TerrainRoom extends Room {
    constructor(controller) {
        super(controller, "Terrain Room");
        this.playercount = 2;
    }
    onEnter(passed, backgroundContext) {
        backgroundContext.clearRect(0, 0, this.width, this.height);
        backgroundContext.drawImage(document.getElementById("bg-main"), 0, 0, this.width, this.height);
        // define GUI here
        new DivElement(this, 310, 350, { fontWeight: "900", fontSize: "40px" }, (element) => {
            element.innerText = "TERRAIN TYPE";
        });
        new DivElement(this, 690, 350, { fontWeight: "900", fontSize: "40px" }, (element) => {
            element.innerText = "CONTROLS";
        });
        new DivElement(this, 690, 575, { fontSize: "25px" }, (element) => {
            element.innerText = `LEFT & RIGHT ARROW\nMOVE\n\nUP & DOWN ARROW\nCANNON ROTATION\n\nPGUP & PGDN\nFIRE POWER\n\n"Q" & "W"\nCHANGE WEAPON\n\nSPACE\nFIRE`;
        });
        // create each of our radio inputs
        var radios = [
            new RadioButton("t", "MOUNTAINS", TERRAINS.MOUNTAINS),
            new RadioButton("t", "FOREST", TERRAINS.FOREST),
            new RadioButton("t", "DESERT", TERRAINS.DESERT),
            new RadioButton("t", "RANDOM", TERRAINS.RANDOM)
        ];
        this._terrains = new RadioElement(this, 275, 465, radios, {});
        new DivElement(this, 310, 595, { fontWeight: "900", fontSize: "40px" }, (element) => {
            element.innerText = "PLAYERS";
        });
        new DivElement(this, 310, 660, { fontSize: "25px" }, (element) => {
            element.innerText = `TOTAL PLAYERS\n(2 PLAYERS =\n2 HUMAN PLAYERS)`;
        });
        var playerdiv = new DivElement(this, 190, 730, { width: "50px", height: "50px", fontSize: "35px", borderRadius: "50%", border: "solid", borderColor: "black", borderWidth: "3px", backgroundColor: "white", display: "flex", justifyContent: "center", alignItems: "center" }, (element) => {
            element.innerText = `${this.playercount}`;
        });
        new ButtonElement(this, 320, 730, { width: "30px", height: "30px", backgroundImage: "url(../img/rightarrow.png)", backgroundSize: "contain", backgroundColor: "transparent", border: "none" }, () => {
            if (this.playercount < 5) {
                this.playercount++;
                playerdiv.sync();
            }
        });
        new ButtonElement(this, 260, 730, { width: "30px", height: "30px", backgroundImage: "url(../img/leftarrow.png)", backgroundSize: "contain", backgroundColor: "transparent", border: "none" }, () => {
            if (this.playercount > 2) {
                this.playercount--;
                playerdiv.sync();
            }
        });
        new ButtonElement(this, this.width - 100, this.height - 50, { width: "70px", height: "50px", backgroundImage: "url(../img/nextarrow.png)", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "transparent", border: "none" }, () => {
            // go to next room
            this.controller.goToRoom(PlayerDetailsRoom);
        });
        this.guiHandler.syncAll();
    }
    onExit() {
        // pass values of names and stuff to next room
        return { terrain: Number.parseInt(this._terrains.getChecked()), players: this.playercount };
    }
    update(delta) {
    }
    draw(context) {
    }
}
class UpgradeRoom extends Room {
    constructor(controller) {
        super(controller, "Upgrade Room");
    }
    onEnter(passed, backgroundContext) {
        // draw background
    }
    // go to GameRoom
    onExit() {
        return { infos: [], terrain: 1 };
    }
}
