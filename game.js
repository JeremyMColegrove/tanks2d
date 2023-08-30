class InputHandler {
    constructor(game) {
        this.game = game
        this.rect = this.game.canvas.getBoundingClientRect()

        window.addEventListener("keydown", e => {
            this.game.keys.add(e.key)
        })
        window.addEventListener("keyup", e=>{
            this.game.keys.delete(e.key)
        })
        window.addEventListener("mousemove", e=>{
            mouseX = e.offsetX * this.game.resolution/this.game.canvas.clientWidth
            mouseY = e.offsetY * this.game.resolution/this.game.canvas.clientWidth
        })
        
    }
}

class UIWind {
    constructor(game, x, y) {
        this.game = game
        this.cloudright = document.getElementById("cloudr")
        this.cloudleft = document.getElementById("cloudl")
        this.speed = this.game.wind
        this.x = x
        this.y = y
    }

    update() {
        if (this.speed != this.game.wind) this.speed = this.game.wind
    }

    draw(context) {
        var cloudtodraw
        if (this.game.wind > 0)
            cloudtodraw = this.cloudright
        else
            cloudtodraw = this.cloudleft

        context.drawImage(cloudtodraw, this.x, this.y)
        context.fillText(Math.abs(this.game.wind), this.x + this.cloudright.width, this.y + this.cloudright.height)
    }
}

class UIAngle {
constructor(game, x, y, scale) {
    this.game = game
    this.gradient = document.getElementById("gradient-horizontal")
    this.x = x
    this.y = y
    this.w = 128 * scale
    this.h = 16 * scale
    this.handle = new UIHandle(this.x, this.y, 5, this.h)
}

update () {
    this.handle.update()

    // restrict handle
    if (this.handle.x > this.x + this.w) this.handle.x = this.x + this.w
    if (this.handle.x < this.x) this.handle.x = this.x
    this.handle.y = this.y // lock x

    // calculate power based on handle position
    if (this.handle.dragging) {
        const perc = 1 - (this.handle.x - this.x) / this.w
        this.game.player.angle = Math.round(perc * 180)
    } else {
        this.handle.x = (1-(this.game.player.angle/180)) * this.w + this.x
    }
}

draw(context) {
    context.drawImage(this.gradient, this.x, this.y, this.w, this.h)
    context.fillText(this.game.player.angle, this.x+this.w, this.y + this.h)
    this.handle.draw(context)
}
}

class UIPower {
constructor (game, x, y, scale) {
    this.game = game
    this.gradient = document.getElementById("gradient-vertical")
    this.x = x
    this.y = y
    this.w = 50 * scale
    this.h = 125 * scale
    this.handle = new UIHandle(this.x, this.y, this.w, 5)
}

update () {
    this.handle.update()
    this.handle.x = this.x // lock x

    // restrict handle
    if (this.handle.y < this.y) this.handle.y = this.y
    if (this.handle.y > this.y + this.h) this.handle.y = this.y + this.h

    // calculate power based on handle position
    if (this.handle.dragging) {
        const perc = 1 - (this.handle.y - this.y) / this.h
        this.game.player.power = Math.round(perc * 100)
    } else {
        this.handle.y = (1-(this.game.player.power/100)) * this.h + this.y
    }
}

draw(context) {
    context.drawImage(this.gradient, this.x, this.y, this.w, this.h)
    context.fillText(this.game.player?.power, this.x+this.w, this.y + this.h)
    this.handle.draw(context)
}
}

// handle all UI for our classes
class UI {
constructor(game) {
    this.game = game
    this.UIPower = new UIPower(game, this.game.width/3, 10, 0.9)
    this.UIAngle = new UIAngle(game, this.game.width/2, 10, 1.3)
    this.UIWind = new UIWind(game, this.game.width/2 + 100, 60)
}

update() {
    this.UIPower.update()
    this.UIAngle.update()
}

draw (context) {

    if (this.game.state == GAME_STATES.READY) {
        context.globalAlpha = 1
    } else {
        context.globalAlpha = 0.5
    }
    context.save()

    // draw white header bar
    context.globalAlpha = 0.8
    context.fillStyle = "white"
    context.fillRect(0, 0, this.game.width, this.game.height * 0.15)
    context.restore()



    context.fillStyle = "#292929"
    context.font = "30px Helvetica"
    // draw text here
    context.fillText(this.game.player.name, 20, 30)

    // draw other objects here
    this.UIPower.draw(context)
    this.UIAngle.draw(context)
    this.UIWind.draw(context)
    context.restore()
    context.globalAlpha = 1

}
}

class Bullet {
    constructor(game, x, y, power, angle) {
        this.game = game
        this.x = x
        this.y = y

        this.power = power
        this.angle = angle

        this.markedForDeletion = false
        this.vx = this.power*Math.cos(this.angle * Math.PI/180)
        this.vy = -this.power*Math.sin(this.angle * Math.PI/180)
        this.speed = 0.05

        // valdation checks
        if (this.game == null) console.error(`Game is undefined`)
        if (angle < 0 || angle > 180) console.error(`Angle should be between 0-180, got ${this.angle}`)
    }


    update () {

        // the missle moving physics here
        this.x += this.vx*this.speed
        this.y += this.vy*this.speed
        this.vy += 9.8*this.speed
        this.vx += this.game.wind*0.005

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height)
            this.markedForDeletion = true

    }
}

class SmallMissle extends Bullet {
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle)
        this.radius = 20
    }

    update () {
        super.update()
        // check for collision with ground
        if (this.y > this.game.height - this.game.ground.harry[Math.round(this.x)]) {
            this.game.ground.blow(this.x, this.y, this.radius)
            this.markedForDeletion = true
        }

    }

    draw(context) {
        // the missle appearance here
        context.fillStyle="black"
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill()
    }
}

class VolcanoBomb extends Bullet {
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle)
        this.radius = 20
        this.fragmentpower = 50
        this.fragmentminpower = 30
    }

    update () {
        // check for collision with ground
        if (this.y > this.game.height - this.game.ground.harry[Math.round(this.x)]) {
            this.game.ground.blow(this.x, this.y, this.radius)
            // create 4 more bullets going in random directions
            this.game.bullets.push(new SmallMissle(this.game, this.x-1, this.y-11, (this.fragmentpower-this.fragmentminpower)*Math.random()+this.fragmentminpower, Math.random()*90 + 45))
            this.game.bullets.push(new SmallMissle(this.game, this.x+2, this.y-9, (this.fragmentpower-this.fragmentminpower)*Math.random()+this.fragmentminpower, Math.random()*90 + 45))
            this.game.bullets.push(new SmallMissle(this.game, this.x-3, this.y-12, (this.fragmentpower-this.fragmentminpower)*Math.random()+this.fragmentminpower, Math.random()*90 + 45))
            this.game.bullets.push(new SmallMissle(this.game, this.x, this.y-4, (this.fragmentpower-this.fragmentminpower)*Math.random()+this.fragmentminpower, Math.random()*90 + 45))

            this.markedForDeletion = true
        }

        super.update()
    }

    draw(context) {
        // the missle appearance here
        context.fillStyle = "#591415"; //red
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill()
    }
}

class Tank {
    constructor(game, x, y, color, owningPlayer) {
        this.game = game
        this.x = x
        this.y = y
        this.color = color
        this.sprite = document.getElementById("tank")
        this.muzzle = document.getElementById("muzzle")
        this.width = this.sprite.width
        this.height = this.sprite.height
        this.owningPlayer = owningPlayer
        this.tankangle = 0

        // to get state changes
        this.oldx = 0
        this.oldy = 0
    }


    update(delta) {
        // function to keep tank on ground
        if (this.y < this.game.height - this.game.ground.harry[Math.round(this.x)]) {
            this.y += delta/32
        }

        if (this.oldx != this.x || this.oldy != this.y) {
            // adjust angle to match ground
            // sample 3 points and find average angle
            var dist = 45
            var p1 = this.game.ground.harry[Math.round(this.x - dist)]
            var p2 = this.game.ground.harry[Math.round(this.x)]
            var p3 = this.game.ground.harry[Math.round(this.x + dist)]
            this.tankangle = -((Math.atan((p3-p2)/dist) + Math.atan((p2-p1)/dist)) / 2) * 180/Math.PI                
        }
        this.oldx = this.x
        this.oldy = this.y
    }

    draw (context) {
        // draw body (at angle)
        context.save()
        context.translate(this.x , this.y)
        context.rotate(this.tankangle * Math.PI/180)
        context.drawImage(this.sprite, -this.width/2, -this.height, this.width, this.height)
        context.restore()

        // draw muzzle 
        context.save()
        context.translate(this.x + this.muzzle.width/2 + this.sprite.width/2*Math.cos((this.tankangle-90) * Math.PI/180), this.y - this.muzzle.width/2 + 5 - this.sprite.height + this.sprite.height*Math.sin((Math.abs(this.tankangle)) * Math.PI/180))
        context.rotate(-(this.owningPlayer.angle + 90) * Math.PI/180)
        context.drawImage(this.muzzle, -this.muzzle.width/2, 0, this.muzzle.width, this.muzzle.height)
        context.restore()
    }
}

class Player {
    constructor(game, x, name, color) {
        this.game = game
        this.name = name
        this.color = color
        this.x = x
        //all of our settings
        this.tank = new Tank(game, this.x, this.game.height - this.game.ground.harry[x], this.color, this)
        this.gas = 100
        this.health = 100
        this.repairs = 8
        this.parachutes = 3
        this.teleports = 2
        this.power = 80
        this.maxpower = 100 // actual multiplier being passed into bullet, sensitive
        this.angle = 90
        this.ammo = {SmallMissle:8}
        this.bullet = VolcanoBomb
    }

    update(delta) {
        this.tank.update(delta)
    }

    draw(context) {
        this.tank.draw(context)
    }
}

const GAME_STATES = {
    READY:0,
    FIRED:1,
    PAUSED:2,
    GAMEOVER:3
}




class Game {
    constructor(width, height, canvas, context, resolution) {
        this.canvas = canvas
        this.context = context
        this.resolution = resolution
        this._play = false
        this.width = width
        this.height = height
        this.input = new InputHandler(this)
        this.keys = new Set()
        this.ground = new Ground(this, this.context, [245, 245, 255])
        this.bullets = []
        this.players = []
        this.player = null
        this.wind = this.randomWind()
        this.UI = new UI(this)
        this.state = GAME_STATES.READY
    }

    play() {
        if (this.players.length == 0) {
            console.error("No players added")
            return
        }
        
        this.player = this.players[0]
        this._play = true
        return this
    }

    addPlayer({name, color}) {
        this.players.push(new Player(this, Math.round(Math.random()*(this.width-200))+100, name, color))
        return this
    }


    randomWind() {
        return Math.round(Math.random()*40) - 20
    }

    update (delta) {
        if (!this._play) return

        this.ground.update()
        this.players.forEach(player=>player.update(delta))          
        this.bullets.forEach(bullet => bullet.update())
        this.UI.update()

        // key checks
        if (this.keys.has(' ') && this.state == GAME_STATES.READY) {
            this.bullets.push(new this.player.bullet(this, this.player.tank.x, this.player.tank.y, this.player.power/100 * this.player.maxpower, this.player.angle))
            this.state = GAME_STATES.FIRED
        }
        

        if (this.state == GAME_STATES.FIRED && this.bullets.length == 0) {
            // next player
            var indexcurrentplayer = this.players.indexOf(this.player)
            if (indexcurrentplayer == this.players.length - 1) {
                this.player = this.players[0]
            } else {
                this.player = this.players[indexcurrentplayer + 1]
            }

            this.wind = this.randomWind()
            this.state = GAME_STATES.READY
        }
        // object deletion
        this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion)
    }

    draw(context) {
        if (!this._play) return
        
        this.ground.draw(context)
        this.players.forEach(player=>player.draw(context))
        this.bullets.forEach(bullet => bullet.draw(context))
        this.UI.draw(context)

    }
}