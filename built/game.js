class Bullet extends Entity {
    constructor(room, x, y, power, angle) {
        super(room, 0);
        this.room = room;
        this.x = x;
        this.y = y;
        this.power = power;
        this.angle = angle;
        this.vx = this.power * Math.cos(this.angle);
        this.vy = this.power * Math.sin(this.angle);
        this.speed = 0.05;
    }
    draw(context) {
    }
    update(delta) {
        // the missle moving physics here
        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;
        this.vy += 9.8 * this.speed;
        this.vx += this.room.wind * 0.005;
        if (this.x < 0 || this.x > this.room.width || this.y < 0 || this.y > this.room.height)
            this.destroy();
    }
}
class SmallMissle extends Bullet {
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle);
        this.radius = 20;
    }
    update(delta) {
        super.update(delta);
        // check for collision with ground
        if (this.y > this.room.height - this.room.ground.harry[Math.round(this.x)]) {
            this.room.ground.blow(this.x, this.y, this.radius);
            this.destroy();
        }
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle = "black";
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill();
    }
}
class VolcanoBomb extends Bullet {
    constructor(room, x, y, power, angle) {
        super(room, x, y, power, angle);
        this.radius = 20;
        this.fragmentpower = 50;
        this.fragmentminpower = 30;
    }
    update(delta) {
        // check for collision with ground
        if (this.y > this.room.height - this.room.ground.harry[Math.round(this.x)]) {
            this.room.ground.blow(this.x, this.y, this.radius);
            // create 4 more bullets going in random directions
            new SmallMissle(this.room, this.x - 1, this.y - 11, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, -(Math.random() * Math.PI / 2 + Math.PI / 4));
            new SmallMissle(this.room, this.x + 2, this.y - 9, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, -(Math.random() * Math.PI / 2 + Math.PI / 4));
            new SmallMissle(this.room, this.x - 3, this.y - 12, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, -(Math.random() * Math.PI / 2 + Math.PI / 4));
            new SmallMissle(this.room, this.x, this.y - 4, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, -(Math.random() * Math.PI / 2 + Math.PI / 4));
            this.destroy();
        }
        super.update(delta);
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle = "#591415"; //red
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill();
    }
}
class Tank extends Entity {
    constructor(room, color, owningPlayer, ground) {
        super(room, 0);
        this.color = color;
        this.sprite = new Sprite(document.getElementById("tank"));
        this.muzzle = new Sprite(document.getElementById("muzzle"));
        this.sprite.center([0, this.sprite.height / 2]).tint(color);
        this.muzzle.center([0, this.muzzle.height / 2]);
        this.ground = ground;
        this.owningPlayer = owningPlayer;
        // set x and y coords of tank
        this.x = ~~(Math.random() * (room.width - 400) + 200);
        this.y = this.room.height - ground.harry[this.x];
        // to get state changes
        this.oldx = 0;
        this.oldy = 0;
    }
    shoot() {
        var startOfMuzzle = Utility.rotatePoint(this.x, this.y, this.sprite.width - 3, this.sprite.angle);
        var endOfMuzzle = Utility.rotatePoint(startOfMuzzle[0], startOfMuzzle[1], this.muzzle.width, this.muzzle.angle);
        new this.owningPlayer.bullet(this.room, endOfMuzzle[0], endOfMuzzle[1], this.owningPlayer.power / 100 * this.owningPlayer.maxpower, this.muzzle.angle);
    }
    update(delta) {
        // function to keep tank on ground
        if (this.y < this.room.height - this.ground.harry[~~this.x]) {
            this.y += delta / 32;
        }
        // check for change in x y, expensive computation
        if (this.oldx != this.x || this.oldy != this.y) {
            // adjust angle to match ground
            // sample 3 points and find average angle
            var dist = 45.0;
            var p1 = this.ground.harry[~~this.x - dist];
            var p2 = this.ground.harry[~~this.x];
            var p3 = this.ground.harry[~~this.x + dist];
            this.sprite.angle = -((Math.atan((p3 - p2) / dist) + Math.atan((p2 - p1) / dist)) / 2) - Math.PI / 2;
        }
        this.oldx = this.x;
        this.oldy = this.y;
        this.muzzle.angle = -this.owningPlayer.angle + this.sprite.angle + Math.PI / 2;
    }
    draw(context) {
        this.sprite.draw(context, this.x, this.y);
        var rotatedPoint = Utility.rotatePoint(this.x, this.y, this.sprite.width - 3, this.sprite.angle);
        this.muzzle.draw(context, rotatedPoint[0], rotatedPoint[1]);
    }
}
class Player {
    constructor(room, name, color, ground) {
        this.room = room;
        this.name = name;
        this.color = color;
        //all of our settings
        this.tank = new Tank(this.room, this.color, this, ground);
        this.gas = 100;
        this.health = 100;
        this.repairs = 8;
        this.parachutes = 3;
        this.teleports = 2;
        this.power = 80;
        this.maxpower = 100; // actual multiplier being passed into bullet, sensitive
        this.angle = Math.PI / 2; // from 0-PI/2
        this.ammo = { SmallMissle: 8 };
        this.bullet = VolcanoBomb;
    }
}
const PLAYERCHANGE = new Event("player-change");
var GAME_STATES;
(function (GAME_STATES) {
    GAME_STATES[GAME_STATES["READY"] = 0] = "READY";
    GAME_STATES[GAME_STATES["FIRED"] = 1] = "FIRED";
    GAME_STATES[GAME_STATES["PAUSED"] = 2] = "PAUSED";
    GAME_STATES[GAME_STATES["GAMEOVER"] = 3] = "GAMEOVER";
})(GAME_STATES || (GAME_STATES = {}));
class GameRoom extends Room {
    constructor(controller) {
        super(controller, "Game Room");
        this.canvas = this.controller.canvas;
        this.context = this.controller.context;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ground = new Ground(this, this.context, [245, 245, 255]);
        this.players = [];
        this.player = null;
        this.wind = this.randomWind();
        this.state = GAME_STATES.READY;
    }
    onEnter(passed) {
        this.addPlayer({ name: "Samantha", color: "blue" });
        this.addPlayer({ name: "Jeremy", color: "red" });
        // set players turn to first player in list
        this.player = this.players[0];
        this.player.angle = Math.PI / 4;
        // create GUI Elements after players have been created
        var angleText = new DivElement(this, this.width / 3 + 170, 50, { fontSize: "25px" }, (element) => {
            element.innerText = `${~~(this.player.angle * 180 / Math.PI)}`;
        });
        var angleElement = new SliderElement(this, this.width / 3 + 150, 20, 1 - (this.player.angle / Math.PI), { width: "150px", height: "10px" }, (event) => {
            // when the slider is moved
            this.player.angle = (1 - event.target.value) * Math.PI;
            angleText.sync();
        }, (element) => {
            element['value'] = 1 - (this.player.angle / Math.PI);
        });
        var powerText = new DivElement(this, this.width / 3 + 30, 100, { fontSize: "25px" }, (element) => {
            element.innerText = `${~~this.player.power}`;
        });
        var powerElement = new SliderElement(this, this.width / 3, 60, 0.5, { width: "100px", height: "10px", transform: "rotate(270deg)" }, (event) => {
            // when the slider is moved
            this.player.power = (event.target.value) * 100;
            powerText.sync();
        }, (element) => {
            element['value'] = this.player.power / 100;
        });
        var nameText = new DivElement(this, 0, 0, { fontSize: "25px", border: "solid", borderColor: "rgba(179, 179, 179, 0.329)", borderWidth: "2px", paddingBlock: "10px", paddingInline: "40px" }, (element) => {
            element.innerText = this.player.name;
            nameText.x = element.clientWidth / 2;
            nameText.y = element.clientHeight / 2;
        });
        // event that gets triggered whenever a player should change
        window.addEventListener("player-change", () => {
            // next player
            this.player = this.players[(this.players.indexOf(this.player) + 1) % this.players.length];
            this.wind = this.randomWind();
            this.state = GAME_STATES.READY;
            // reset UI elements
            this.guiHandler.syncAll();
        });
        this.guiHandler.syncAll();
    }
    onExit(pass) {
    }
    addPlayer({ name, color }) {
        this.players.push(new Player(this, name, color, this.ground));
    }
    randomWind() {
        return ~~(Math.random() * 40 - 20);
    }
    update(delta) {
        super.update(delta);
        // key checks
        if (InputSingleton.getInstance().keys.has(' ') && this.state == GAME_STATES.READY) {
            // create new enemy bullet in room
            this.player.tank.shoot();
            this.state = GAME_STATES.FIRED;
        }
        if (this.state == GAME_STATES.FIRED && !this.entityHandler.entityExists(Bullet)) {
            window.dispatchEvent(PLAYERCHANGE);
        }
    }
    draw(context) {
        super.draw(context);
        context.globalAlpha = 0.5;
        context.fillStyle = "white";
        context.fillRect(0, 0, this.width, 120);
        context.globalAlpha = 1;
    }
}
class TerrainRoom extends Room {
    constructor(controller) {
        super(controller, "Terrain Room");
    }
    onEnter(passed) {
    }
    onExit(pass) {
        // pass values of names and stuff to next room
        pass({ name: "Hello, world!" });
    }
    update(delta) {
    }
    draw(context) {
    }
}
