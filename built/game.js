class UIHandle extends Draggable {
    constructor(room, x, y, w, h) {
        super(room, x, y, w + 15, h + 15);
        this.startx = x; //override y movement by saving start y
        this.visibleHeight = h;
        this.visibleWidth = w;
    }
    update(delta) {
        super.update(delta);
    }
    draw(context) {
        context.fillRect(this.x, this.y, this.visibleWidth, this.visibleHeight);
    }
}
class UIWind {
    constructor(room, x, y) {
        this.room = room;
        this.cloudright = document.getElementById("cloudr");
        this.cloudleft = document.getElementById("cloudl");
        this.speed = this.room.wind;
        this.x = x;
        this.y = y;
    }
    update() {
        if (this.speed != this.room.wind)
            this.speed = this.room.wind;
    }
    draw(context) {
        var cloudtodraw;
        if (this.room.wind > 0)
            cloudtodraw = this.cloudright;
        else
            cloudtodraw = this.cloudleft;
        context.drawImage(cloudtodraw, this.x, this.y);
        // @ts-ignore 
        context.fillText(Math.abs(this.room.wind), this.x + this.cloudright.width, this.y + this.cloudright.height);
    }
}
class UIAngle {
    constructor(room, x, y, scale) {
        this.room = room;
        this.gradient = document.getElementById("gradient-horizontal");
        this.x = x;
        this.y = y;
        this.w = 128 * scale;
        this.h = 16 * scale;
        this.handle = new UIHandle(this.room, this.x, this.y, 5, this.h);
    }
    update(delta) {
        this.handle.update(delta);
        // restrict handle
        if (this.handle.x > this.x + this.w)
            this.handle.x = this.x + this.w;
        if (this.handle.x < this.x)
            this.handle.x = this.x;
        this.handle.y = this.y; // lock x
        // calculate power based on handle position
        if (this.handle.dragging) {
            const perc = 1 - (this.handle.x - this.x) / this.w;
            this.room.player.angle = Math.round(perc * 180);
        }
        else {
            this.handle.x = (1 - (this.room.player.angle / 180)) * this.w + this.x;
        }
    }
    draw(context) {
        context.drawImage(this.gradient, this.x, this.y, this.w, this.h);
        context.fillText(this.room.player.angle, this.x + this.w, this.y + this.h);
        this.handle.draw(context);
    }
}
class UIPower {
    constructor(room, x, y, scale) {
        this.room = room;
        this.gradient = document.getElementById("gradient-vertical");
        this.x = x;
        this.y = y;
        this.w = 50 * scale;
        this.h = 125 * scale;
        this.handle = new UIHandle(room, this.x, this.y, this.w, 5);
    }
    update(delta) {
        this.handle.update(delta);
        this.handle.x = this.x; // lock x
        // restrict handle
        if (this.handle.y < this.y)
            this.handle.y = this.y;
        if (this.handle.y > this.y + this.h)
            this.handle.y = this.y + this.h;
        // calculate power based on handle position
        if (this.handle.dragging) {
            const perc = 1 - (this.handle.y - this.y) / this.h;
            this.room.player.power = Math.round(perc * 100);
        }
        else {
            this.handle.y = (1 - (this.room.player.power / 100)) * this.h + this.y;
        }
    }
    draw(context) {
        var _a;
        context.drawImage(this.gradient, this.x, this.y, this.w, this.h);
        context.fillText((_a = this.room.player) === null || _a === void 0 ? void 0 : _a.power, this.x + this.w, this.y + this.h);
        this.handle.draw(context);
    }
}
// handle all UI for our classes
class UI {
    constructor(room) {
        this.room = room;
        this.UIPower = new UIPower(room, this.room.width / 3, 10, 0.9);
        this.UIAngle = new UIAngle(room, this.room.width / 2, 10, 1.3);
        this.UIWind = new UIWind(room, this.room.width / 2 + 100, 60);
    }
    update(delta) {
        this.UIPower.update(delta);
        this.UIAngle.update(delta);
    }
    draw(context) {
        if (this.room.state == GAME_STATES.READY) {
            context.globalAlpha = 1;
        }
        else {
            context.globalAlpha = 0.5;
        }
        context.save();
        // draw white header bar
        context.globalAlpha = 0.8;
        context.fillStyle = "white";
        context.fillRect(0, 0, this.room.width, this.room.height * 0.15);
        context.restore();
        context.fillStyle = "#292929";
        context.font = "30px Helvetica";
        // draw text here
        context.fillText(this.room.player.name, 20, 30);
        // draw other objects here
        this.UIPower.draw(context);
        this.UIAngle.draw(context);
        this.UIWind.draw(context);
        context.restore();
        context.globalAlpha = 1;
    }
}
class Bullet extends Entity {
    constructor(room, x, y, power, angle) {
        super(room, 0);
        this.room = room;
        this.x = x;
        this.y = y;
        this.power = power;
        this.angle = angle;
        this.vx = this.power * Math.cos(this.angle * Math.PI / 180);
        this.vy = -this.power * Math.sin(this.angle * Math.PI / 180);
        this.speed = 0.05;
    }
    draw(context) {
    }
    update() {
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
    update() {
        super.update();
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
    update() {
        // check for collision with ground
        if (this.y > this.room.height - this.room.ground.harry[Math.round(this.x)]) {
            this.room.ground.blow(this.x, this.y, this.radius);
            // create 4 more bullets going in random directions
            new SmallMissle(this.room, this.x - 1, this.y - 11, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, Math.random() * 90 + 45);
            new SmallMissle(this.room, this.x + 2, this.y - 9, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, Math.random() * 90 + 45);
            new SmallMissle(this.room, this.x - 3, this.y - 12, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, Math.random() * 90 + 45);
            new SmallMissle(this.room, this.x, this.y - 4, (this.fragmentpower - this.fragmentminpower) * Math.random() + this.fragmentminpower, Math.random() * 90 + 45);
            this.destroy();
        }
        super.update();
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
        this.sprite.setCenter([8, 16]);
        this.muzzle = document.getElementById("muzzle");
        this.ground = ground;
        // @ts-ignore 
        this.width = this.sprite.width;
        // @ts-ignore 
        this.height = this.sprite.height;
        this.owningPlayer = owningPlayer;
        // this.tankangle = 0
        // set x and y coords of tank
        this.x = ~~(Math.random() * (room.width - 400) + 200);
        this.y = this.room.height - ground.harry[this.x];
        // to get state changes
        this.oldx = 0;
        this.oldy = 0;
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
            this.sprite.angle = -((Math.atan((p3 - p2) / dist) + Math.atan((p2 - p1) / dist)) / 2);
        }
        this.oldx = this.x;
        this.oldy = this.y;
    }
    draw(context) {
        // draw body (at angle)
        // context.save()
        // context.translate(this.x , this.y)
        // context.rotate(this.tankangle * Math.PI/180)
        // @ts-ignore
        this.sprite.draw(context, this.x, this.y);
        // context.drawImage(this.sprite, -this.width/2, -this.height, this.width, this.height)
        // context.restore()
        // draw muzzle 
        // context.save()
        // // @ts-ignore 
        // context.translate(this.x + this.muzzle.width/2 + this.sprite.width/2*Math.cos((this.tankangle-90) * Math.PI/180), this.y - this.muzzle.width/2 + 5 - this.sprite.height + this.sprite.height*Math.sin((Math.abs(this.tankangle)) * Math.PI/180))
        // context.rotate(-(this.owningPlayer.angle + 90) * Math.PI/180)
        // // @ts-ignore 
        // context.drawImage(this.muzzle, -this.muzzle.width/2, 0, this.muzzle.width, this.muzzle.height)
        // context.restore()
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
        this.angle = 90;
        this.ammo = { SmallMissle: 8 };
        this.bullet = VolcanoBomb;
    }
}
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
        this.resolution = this.controller.resolution;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ground = new Ground(this, this.context, [245, 245, 255]);
        this.players = [];
        this.player = null;
        this.wind = this.randomWind();
        this.UI = new UI(this);
        this.state = GAME_STATES.READY;
    }
    onEnter(passed) {
        this.addPlayer({ name: "Samantha", color: "blue" });
        this.addPlayer({ name: "Jeremy", color: "red" });
        // set players turn to first player in list
        this.player = this.players[0];
    }
    addPlayer({ name, color }) {
        this.players.push(new Player(this, name, color, this.ground));
    }
    randomWind() {
        return ~~(Math.random() * 40 - 20);
    }
    update(delta) {
        super.update(delta);
        this.UI.update(delta);
        // key checks
        if (this.inputHandler.keys.has(' ') && this.state == GAME_STATES.READY) {
            // create new enemy bullet in room
            new this.player.bullet(this, this.player.tank.x, this.player.tank.y, this.player.power / 100 * this.player.maxpower, this.player.angle);
            this.state = GAME_STATES.FIRED;
        }
        if (this.state == GAME_STATES.FIRED && !this.entityHandler.entityExists(Bullet)) {
            // next player
            var indexcurrentplayer = this.players.indexOf(this.player);
            if (indexcurrentplayer == this.players.length - 1) {
                this.player = this.players[0];
            }
            else {
                this.player = this.players[indexcurrentplayer + 1];
            }
            this.wind = this.randomWind();
            this.state = GAME_STATES.READY;
        }
    }
    draw(context) {
        super.draw(context);
        this.UI.draw(context);
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
