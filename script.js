let mouseX, mouseY

window.addEventListener("load", function () {
    // const evPlayerChange = new Event("player-change")
    const canvas = this.document.getElementById("canvas")
    const ctx = canvas.getContext('2d')
    const resolution = 1280
    canvas.width = resolution
    canvas.height = resolution/1.5

    class InputHandler {
        constructor(game) {
            this.rect = canvas.getBoundingClientRect()
            this.game = game
            window.addEventListener("keydown", e => {
                this.game.keys.add(e.key)
            })
            window.addEventListener("keyup", e=>{
                this.game.keys.delete(e.key)
            })
            window.addEventListener("mousemove", e=>{
                mouseX = e.offsetX * resolution/canvas.clientWidth
                mouseY = e.offsetY * resolution/canvas.clientWidth
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
        context.fillText(this.game.player.power, this.x+this.w, this.y + this.h)
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
            this.speed = 0.5

            // valdation checks
            if (power < 0 || power > 20) console.error(`Power should be between 1-15, got ${this.power}`)
            if (this.game == null) console.error(`Game is undefined`)
            if (angle < 0 || angle > 180) console.error(`Angle should be between 0-180, got ${this.angle}`)
        }


        update () {

            // the missle moving physics here
            this.x += this.vx*this.speed
            this.y += this.vy*this.speed
            this.vy += 0.2*this.speed
            this.vx += this.game.wind*0.002

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
        }

        update () {
            // check for collision with ground
            if (this.y > this.game.height - this.game.ground.harry[Math.round(this.x)]) {
                this.game.ground.blow(this.x, this.y, this.radius)
                // create 4 more bullets going in random directions
                this.game.bullets.push(new SmallMissle(this.game, this.x-1, this.y-11, 7*Math.random()+1, Math.random()*90 + 45))
                this.game.bullets.push(new SmallMissle(this.game, this.x+2, this.y-9, 7*Math.random()+1, Math.random()*90 + 45))
                this.game.bullets.push(new SmallMissle(this.game, this.x-3, this.y-12, 7*Math.random()+1, Math.random()*90 + 45))
                this.game.bullets.push(new SmallMissle(this.game, this.x, this.y-4, 7*Math.random()+1, Math.random()*90 + 45))

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

        }

        update() {
        }

        draw (context) {
            context.drawImage(this.sprite, this.x - this.width/2, this.y - this.height, this.width, this.height)
            
            context.save()
            context.translate(this.x + this.muzzle.width/2, this.y - this.muzzle.height + 5)
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
            //all of our settings
            this.tank = new Tank(game, x, this.game.height - this.game.ground.harry[x], this.color, this)
            this.gas = 100
            this.health = 100
            this.repairs = 8
            this.parachutes = 3
            this.teleports = 2
            this.power = 80
            this.maxpower = 25 // actual multiplier being passed into bullet, sensitive
            this.angle = 90
            this.ammo = {SmallMissle:8}
            this.bullet = VolcanoBomb
        }

        update() {
            this.tank.update()
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
        constructor(width, height) {
            this.width = width
            this.height = height
            this.input = new InputHandler(this)
            this.keys = new Set()
            this.ground = new Ground(this, ctx, [245, 245, 255])
            this.bullets = []
            this.player1 = new Player(this, 200, "Jeremy", "red")
            this.player2 = new Player(this, this.width - 200, "Samantha", "blue")
            this.player = this.player1
            this.wind = this.randomWind()
            this.UI = new UI(this)
            this.state = GAME_STATES.READY

        }

        randomWind() {
            return Math.round(Math.random()*40) - 20
        }

        update (delta) {
            this.ground.update()
            this.player1.update()
            this.player2.update()            
            this.bullets.forEach(bullet => bullet.update())
            this.UI.update()

            // key checks
            if (this.keys.has(' ') && this.state == GAME_STATES.READY) {
                this.bullets.push(new this.player.bullet(this, this.player.tank.x, this.player.tank.y, this.player.power/100 * this.player.maxpower, this.player.angle))
                this.state = GAME_STATES.FIRED
            }
            

            if (this.state == GAME_STATES.FIRED && this.bullets.length == 0) {
                this.player = this.player==this.player1?this.player2:this.player1
                this.wind = this.randomWind()
                this.state = GAME_STATES.READY
            }
            // object deletion
            this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion)
        }

        draw(context) {
            this.ground.draw(context)
            this.player1.draw(context)
            this.player2.draw(context)
            this.bullets.forEach(bullet => bullet.draw(context))
            this.UI.draw(context)

        }
    }

    const game = new Game(canvas.width, canvas.height)

    var lastTime = 0
    function animate (timeStamp) {
        var delta = timeStamp - lastTime
        lastTime = timeStamp

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        game.update(delta)
        
        game.draw(ctx)


        requestAnimationFrame(animate)
    }
    animate(0)
})