// TYPE DEFINITIONS, ENUMS AND CUSTOM EVENTS
const PLAYERCHANGE = new Event("player-change")

enum GAMESTATES {
    READY,
    FIRED,
    WAITING,
    PAUSED,
    GAMEOVER
}

enum TERRAINS {
    MOUNTAINS=1,
    FOREST=2,
    DESERT=3,
    RANDOM=4
}
enum PLAYERSTATES {
    TELEPORTING,
    FALLING,
    CHILLING
}

type PlayerInfo = {
    name:string,
    color:string,
    weapons:Array<Weapon>,
    weaponIndex:number,
    gas:number, 
    health:number,
    repairs:number, 
    parachutes:number, 
    teleports:number,
    power:number,
    angle:number,
    money:number
}

type UpgradeRoomEntry = {infos:Array<PlayerInfo>}
type GameRoomEntry = {infos:Array<PlayerInfo>, terrain:TERRAINS}
type PlayerDetailsRoomEntry = {terrain:TERRAINS, players:number}

// WEAPONS

class Explosion extends Entity {
    sprite:Sprite = new Sprite(<HTMLImageElement>document.getElementById('explosion'))
    radius:number
    constructor(room, layer, x, y, radius) {
        super(room, layer)
        this.x = x
        this.y = y
        this.radius = radius/2
        this.sprite.center([this.sprite.width/2, this.sprite.height/2]).scale(this.radius/160)

        setTimeout(()=>{
            this.destroy()
        }, 100)
    }

    update(delta: any): void {
        this.radius += delta
        this.sprite.scale(this.radius/160)
    }

    draw(context: any): void {
        this.sprite.draw(context, this.x, this.y)
    }
}

abstract class Bullet extends Entity {
    room:GameRoom
    power:number
    angle:number
    vx:number
    vy:number
    physicsSpeed:number = 0.075
    windMultiplier:number = 0.005
    powerMultiplier:number = 100
    abstract damage:number
    abstract radius:number
    constructor(room, x, y, power, angle) {
        super(room, 0)
        this.room = room
        this.x = x
        this.y = y
        this.power = power * this.powerMultiplier
        this.angle = angle
        this.vx = this.power*Math.cos(this.angle)
        this.vy = this.power*Math.sin(this.angle)
    }

    abstract onImpact():void

    abstract draw(context: CanvasRenderingContext2D)

    explode():void {
        this.room.ground.blow(this.x, this.y, this.radius)
        // deduct damage from all tanks within certain radius
        this.room.players.forEach(player=>{
            var radius = this.radius * 2
            var distance = Utility.distance([player.x, player.y], [this.x, this.y])
            
            if (distance < player.sprite.width/2) distance = 0
            else distance = Math.min(distance, radius)

            var damage = (1 - distance/radius) * this.damage
            player.info.health -= ~~damage
        })
        new Explosion(this.room, this.layer, this.x, this.y, this.radius)
        this.destroy()
    }

    update (delta:number) {

        // physics
        this.x += this.vx*this.physicsSpeed
        this.y += this.vy*this.physicsSpeed
        this.vy += 9.8*this.physicsSpeed
        this.vx += this.room.wind*this.windMultiplier

        if (this.x < 0 || this.x > this.room.width || this.y > this.room.height - 1)
            this.destroy()

        // check for collision with ground
        if (this.y > this.room.height - this.room.ground.harry[Math.round(this.x)]) {
            this.onImpact()
        }
    }
}

class SmallMissile extends Bullet {
    radius:number
    damage:number
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle)
        this.radius = 20
        this.damage = 30;
    }

    onImpact(): void {
        this.explode()
    }
    
    draw(context) {
        // the missle appearance here
        context.fillStyle="black"
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill()
    }
}

class Missile extends Bullet {
    radius:number
    damage:number
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle)
        this.radius = 20
        this.damage = 30;
    }
    onImpact(): void {
        this.explode()
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle="red"
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill()
    }
}

class SmallAtomBomb extends Bullet {
    radius:number
    damage:number
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle)
        this.radius = 40
        this.damage = 50;
    }
    onImpact(): void {
        this.explode()
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle="red"
        context.beginPath();
        context.arc(this.x, this.y, 4, 0, 2 * Math.PI, true);
        context.fill()
    }
}

class AtomBomb extends Bullet {
    radius:number
    damage:number
    constructor(game, x, y, power, angle) {
        super(game, x, y, power, angle)
        this.radius = 60
        this.damage = 70;
    }
    onImpact(): void {
        this.explode()
    }
    draw(context) {
        // the missle appearance here
        context.fillStyle="red"
        context.beginPath();
        context.arc(this.x, this.y, 5, 0, 2 * Math.PI, true);
        context.fill()
    }
}

class VolcanoBomb extends Bullet {
    radius:number
    fragmentpower:number
    fragmentminpower:number
    damage:number
    constructor(room, x, y, power, angle) {
        super(room, x, y, power, angle)
        this.radius = 20
        this.fragmentpower = 70
        this.fragmentminpower = 30
        this.damage = 30;
    }

    onImpact(): void {
        // create 4 more bullets going in random directions
        new SmallMissile(this.room, this.x-1, this.y-11, (this.fragmentpower-this.fragmentminpower)*Math.random()+this.fragmentminpower, -(Math.random()*Math.PI/2 + Math.PI/4))
        new SmallMissile(this.room, this.x+2, this.y-9, (this.fragmentpower-this.fragmentminpower)*Math.random()+this.fragmentminpower, -(Math.random()*Math.PI/2 + Math.PI/4))
        new SmallMissile(this.room, this.x-3, this.y-12, (this.fragmentpower-this.fragmentminpower)*Math.random()+this.fragmentminpower, -(Math.random()*Math.PI/2 + Math.PI/4))
        new SmallMissile(this.room, this.x, this.y-4, (this.fragmentpower-this.fragmentminpower)*Math.random()+this.fragmentminpower, -(Math.random()*Math.PI/2 + Math.PI/4))
        new SmallMissile(this.room, this.x+1, this.y-8, (this.fragmentpower-this.fragmentminpower)*Math.random()+this.fragmentminpower, -(Math.random()*Math.PI/2 + Math.PI/4))
        this.explode()
    }

    draw(context) {
        // the missle appearance here
        context.fillStyle = "#591415"; //dark red
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill()
    }
}

class Shower extends Bullet {
    radius:number
    damage:number
    constructor(room, x, y, power, angle, count:number=5) {
        super(room, x, y, power + (6*(count-3)), angle)
        this.radius = 20
        this.damage = 35;

        // create 5 new shower bullets
        if (count > 0) {
            setTimeout(()=>{
                new Shower(room, x, y, power, angle, count - 1)
            }, 100)
        }
    }

    onImpact(): void {
        this.explode()
    }

    draw(context) {
        // the missle appearance here
        context.fillStyle = "#591415"; //dark red
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill()
    }
}

class HotShower extends Bullet {
    radius:number = 20
    damage:number = 35
    constructor(room, x, y, power, angle, count:number=5) {
        super(room, x, y, power + (6*(count-3)), angle)

        // create 5 new shower bullets
        if (count > 0) {
            setTimeout(()=>{
                new HotShower(room, x, y, power, angle, count - 1)
            }, 100)
        }
    }

    onImpact(): void {
        this.explode()
    }

    draw(context) {
        // the missle appearance here
        context.fillStyle = "red"; //dark red
        context.beginPath();
        context.arc(this.x, this.y, 3.5, 0, 2 * Math.PI, true);
        context.fill()
    }
}

class Weapon {
    amount:number
    item:Newable<Bullet>
    name:string
    cost:number
    img:string
    constructor(amount:number, item:Newable<Bullet>, name:string, cost:number, img:string) {
        this.amount = amount
        this.item = item
        this.name = name
        this.cost = cost
        this.img = img
    }
}

// PLAYERS

class Player extends Entity {
    room:GameRoom
    color:string
    info:PlayerInfo

    // sprites
    sprite:Sprite = new Sprite(document.getElementById("tank"))
    sprMuzzle:Sprite = new Sprite(document.getElementById("muzzle"))
    parachute:Sprite = new Sprite(<HTMLImageElement>document.getElementById('parachute'))
    focusArrow:Sprite = new Sprite(<HTMLImageElement>document.getElementById('arrowdown')).scale(0.75)
    teleportSprite:Sprite = new Sprite(<HTMLImageElement>document.getElementById('teleport-circle'))

    // flags
    falling:boolean = false
    showFocus:boolean = false
    state:PLAYERSTATES = PLAYERSTATES.CHILLING
    switchTurnsWhenTouchesGround:boolean = false
    destroyed:boolean = false

    // counters
    focusY:number = 0
    oldx:number = 0
    oldy:number = 0
    constructor(room:GameRoom, info:PlayerInfo) {
        super(<Room>room, 0)
        this.room = <GameRoom>room
        this.info = info

        this.sprite.center([0, this.sprite.height/2]).tint(this.info.color)
        this.sprMuzzle.center([0, this.sprMuzzle.height/2])
        this.parachute.center([this.parachute.width/2, this.parachute.height])
        this.focusArrow.center([this.focusArrow.width/2, this.focusArrow.height])
        this.teleportSprite.center([this.teleportSprite.width/2 + 10, this.teleportSprite.height/2 + 15]).scale(0.5)
        // set x and y coords of tank
        this.x = ~~(Math.random()*(room.width-400)+200)
        this.y = this.room.height - this.room.ground.harry[this.x]

        window.addEventListener('player-change', ()=>{
            this.info.power = Math.min(this.info.power, this.info.health)
            if (this.room.player == this) this.showFocus = true
            setTimeout(()=>{
                this.showFocus = false
            }, 3000)
        })
    }

    nextWeapon(direction:1|-1) {
        this.info.weaponIndex = (this.info.weaponIndex + direction) % (this.info.weapons.length)
        if (this.info.weaponIndex < 0) this.info.weaponIndex = this.info.weapons.length - 1
        this.room.guiHandler.syncAll()
    }

    shoot() {
        var startOfMuzzle, endOfMuzzle

        if (this.state == PLAYERSTATES.CHILLING) {
            startOfMuzzle = Utility.rotatePoint(this.x, this.y, this.sprite.width-3, this.sprite.angle)
            endOfMuzzle = Utility.rotatePoint(startOfMuzzle[0], startOfMuzzle[1], this.sprMuzzle.width, this.sprMuzzle.angle )
            if (this.info.weapons.length > 0) {
                new this.info.weapons[this.info.weaponIndex].item(this.room, endOfMuzzle[0], endOfMuzzle[1], this.info.power/100, this.sprMuzzle.angle)
                this.room.state = GAMESTATES.FIRED
            }
        }
    }

    /**
     * Drive the tank in a direction
     * @param direction Whether to drive in a positive direction
     * @returns void
     */
    drive(direction:-1|1):void {
        var p1, p2, p3, a, b, c, dist

        if (this.info.gas  < 1) return

        dist = 4.0*direction
        p1 = [~~this.x + dist, this.room.ground.harry[~~this.x + dist]]
        p2 = [~~this.x + dist * 2, this.room.ground.harry[~~this.x + dist * 2]]
        p3 = [~~this.x + dist * 3, this.room.ground.harry[~~this.x + dist * 3]]
        a = Utility.distance(p1, p2)
        b = Utility.distance(p2, p3)
        c = Utility.distance(p1, p3)
        var C = Math.acos((a*a + b*b - c*c) / (2*a*b)) * 180/Math.PI

        // console.log()
        // if (Math.abs(Math.atan((p3[1]-p2[1])/dist)) < 1.1) {
        //     if (Math.abs(Math.atan((p2[1]-p1[1])/dist)) < 1.1) {
            if (C > 160) {
                this.info.gas -= 0.2
                this.x += 0.3*direction
                this.y = this.room.height - this.room.ground.harry[~~this.x] + 1
                this.room.gasElement.sync()
            // }
        }
    }

    // dead, lets explode!
    explode() {
        new Explosion(this.room, this.layer, this.x, this.y, 60)
        this.destroyed = true
    }

    update(delta:number): void {
        // health is gone
        if (this.destroyed == false && this.info.health < 20) {
            this.explode()
            setTimeout(()=>{
                this.room.checkGameOver()
            }, 1000)
        }



        if (this.state == PLAYERSTATES.CHILLING) {
            // check for change in x y, expensive computation
            if (this.oldx != this.x || this.oldy != this.y) {
                // adjust angle to match ground
                // sample 3 points and find average angle
                var dist = 16.0
                var p1 = this.room.ground.harry[~~this.x - dist]
                var p2 = this.room.ground.harry[~~this.x]
                var p3 = this.room.ground.harry[~~this.x + dist]
                this.sprite.angle = -((Math.atan((p3-p2)/dist) + Math.atan((p2-p1)/dist)) / 2) - Math.PI/2
            }
            if (this.y < this.room.height - this.room.ground.harry[~~this.x]) {
                this.state = PLAYERSTATES.FALLING
            }
        } else if (this.state == PLAYERSTATES.FALLING) {
            // function to keep tank on ground
            if (this.y < this.room.height - this.room.ground.harry[~~this.x]) {
                this.y += delta/32
                this.x += this.room.wind * 0.005
                // check if off room
                if (this.y > this.room.height - 1) {
                    this.explode()
                    this.room.checkGameOver()
                }
            } else {
                if (this.switchTurnsWhenTouchesGround) {
                    this.room.switchTurns()
                    this.switchTurnsWhenTouchesGround = false
                }
                this.state = PLAYERSTATES.CHILLING
            }
        } else if (this.state == PLAYERSTATES.TELEPORTING) {
            if (InputSingleton.getInstance().mousedown) {
                new Explosion(this.room, this.layer, this.x, this.y, 45)
                setTimeout(()=>{
                    // we teleport wherever we click
                    this.x = InputSingleton.getInstance().mx
                    this.y = InputSingleton.getInstance().my
                    this.switchTurnsWhenTouchesGround = true
                }, 100)
                this.state = PLAYERSTATES.CHILLING
            }
        }

        this.oldx = this.x
        this.oldy = this.y
        this.sprMuzzle.angle = -this.info.angle + this.sprite.angle + Math.PI/2
    }

    draw (context:CanvasRenderingContext2D): void {
        if (this.destroyed) return

        // draw tank
        this.sprite.draw(context, this.x, this.y)
        var rotatedPoint = Utility.rotatePoint(this.x, this.y, this.sprite.width - 3, this.sprite.angle)
        this.sprMuzzle.draw(context, rotatedPoint[0], rotatedPoint[1])
        

        if (this.state == PLAYERSTATES.FALLING) {
            this.parachute.draw(context, rotatedPoint[0], rotatedPoint[1])
        } else if (this.state == PLAYERSTATES.TELEPORTING) {
            this.teleportSprite.draw(context, InputSingleton.getInstance().mx, InputSingleton.getInstance().my)
        } 

        // draw arrow point down on tank
        if (this.showFocus) {
            this.focusArrow.draw(context, this.x, this.y - 75 + Math.abs(this.focusY - 20))
            this.focusY = (this.focusY + 0.2) % 40
        }

        
    }
}

// ROOMS

class GameRoom extends Room {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    resolution:number
    ground: Ground
    players: Array<Player> = []
    player: Player = null
    wind: number = this.randomWind()
    state: GAMESTATES = GAMESTATES.READY
    angleElement:SliderElement
    powerElement:SliderElement
    gasElement:DivElement
    constructor(controller) {
        super(controller, "Game Room")
        this.canvas = this.controller.canvas
        this.context = this.controller.context
        this.width = this.canvas.width
        this.height = this.canvas.height
    }

    onEnter(props:GameRoomEntry, backgroundContext:CanvasRenderingContext2D) {
        var background:SupportedImageSource
        var color:[number, number, number]

        if (props.terrain == TERRAINS.RANDOM) {
            props.terrain = ~~(Math.random()*3) + 1
        }

        if (props.terrain == TERRAINS.MOUNTAINS) {
            background = <HTMLImageElement>document.getElementById("bg-snow")
            color = [245, 245, 255]
        } else if (props.terrain == TERRAINS.FOREST) {
            background = <HTMLImageElement>document.getElementById("bg-forest")
            color = [144, 191, 54]
        } else if (props.terrain == TERRAINS.DESERT) {
            background = <HTMLImageElement>document.getElementById("bg-desert")
            // color = [186, 67, 12]
            color = [150, 51, 6]
        } else {
            background = <HTMLImageElement>document.getElementById("bg-snow")
            color = [213, 152, 126]
        } 

        // draw the room background
        backgroundContext.drawImage(background, 0, 0, this.width, this.height)

        // create the ground
        this.ground = new Ground(this, this.context, color)

        // create the players
        props.infos.forEach(info=>this.addPlayer(info))


        // create GUI Elements after players have been created
        // angle number
        var angleText = new DivElement(this, this.width/3 + 170, 70, {}, (element)=>{
            element.innerText = `${~~(this.player?.info.angle * 180/Math.PI)}`
        })

        // angle slider
        this.angleElement = new SliderElement(this, this.width/3 + 150, 30, 1-(this.player?.info.angle / Math.PI), 
            {width:"150px", height:"10px", backgroundImage:"url(../img/gradient-horizontal.png)", backgroundSize:"cover", backgroundRepeat:"no-repeat"}, 
            (event)=>{
            // when the slider is moved
            this.player.info.angle = (1-event.target.value) * Math.PI
            angleText.sync()
        }, (element)=> {
            element['value'] = 1 - (this.player?.info.angle / Math.PI)
            angleText.sync()
        })

        // power number
        var powerText = new DivElement(this, this.width/3 + 30, 100, {}, (element)=>{
            element.innerText = `${~~this.player?.info.power}`
        })


        // power slider
        this.powerElement = new SliderElement(this, this.width/3, 100, 0.5, 
        {width:"100px", height:"40px", transform:"rotate(270deg)", backgroundImage:"url(../img/gradient-vertical.png)", backgroundSize:"100% 100%", backgroundRepeat:"no-repeat"}, 
        (event)=>{
            // check if slider is above health, if so restrict it
            // if (event.target.value > this.player?.stats.health/100) {
            //     this.powerElement.element['value'] = this.player?.stats.health/100
            // }

            // when the slider is moved
            this.player.info.power = (event.target.value) * this.player?.info.health
            powerText.sync()
            // this.powerElement.sync()

        }, (element:HTMLElement)=>{
            element['value'] = this.player?.info.power / this.player?.info.health
            powerText.sync()

            this.powerElement.element.style.width = `${this.player?.info.health}px`
            this.powerElement.element.style.height = `${this.player?.info.health/100 * 40}px`
            this.powerElement.x = this.width/3
            this.powerElement.y = 100 - Number.parseInt(this.powerElement.element.style.height)
            this.powerElement.refresh(this.canvas.getBoundingClientRect())
        })

        // player name
        var nameText = new DivElement(this, 0, 0, {border:"solid",borderColor:"rgba(179, 179, 179, 0.329)", borderWidth:"2px", paddingBlock:"5px", paddingInline:"40px"}, (element)=>{
            element.innerText = this.player?.info.name
            nameText.x = element.clientWidth / 2
            nameText.y = element.clientHeight / 2
        })

        // fire button
        new ButtonElement(this, this.width/3 + 150, 100, {width:"75px", height:"35px"},()=>{    
            this.player?.shoot()
        }, 
        (element)=>{
            element.value = "Fire"
        })

        // wind image
        new ImageElement(this, this.width/2 + 300, 90, "../img/cloudr.png", {width:"50px", height:"50px", objectFit:"contain"}, (element)=>{
            if (this.wind > 0) {
                element.src = "../img/cloudr.png"
            } else {
                element.src = "../img/cloudl.png"
            }
        })

        // wind number
        new DivElement(this, this.width/2 + 350, 90, {}, (element) => {
            element.innerText = `${Math.abs(this.wind)}`
        })

        // gas amount
        this.gasElement = new DivElement(this, 75, 65, {}, (element) => {
            element.innerText = `${~~Math.abs(this.player?.info.gas)}`
        })

        // gas image
        new ImageElement(this, 30, 60, "../img/gas.png", {width:"20px", height:"30px", backgroundSize:"contain", backgroundRepeat:"no-repeat"})
        
        // money
        new DivElement(this, this.width/2 + 240, 90, {textAlign:"left",width:"220px"}, (element)=>{
            element.innerText = `$${~~this.player?.info.money}`
        })

        // draw the weapons background and images

        // weapon name
        new DivElement(this, this.width/2 + 260, 40, {textAlign:"left",width:"220px"}, (element)=>{
            element.innerText = this.player?.info.weapons[this.player.info.weaponIndex]?.name
        })

        // weapon count
        new DivElement(this, this.width/2 + 383, 40, {textAlign:"left"}, (element)=>{
            element.innerText = this.player?.info.weapons[this.player.info.weaponIndex]?.amount
        })

        // weapon image
        new ImageElement(this, this.width/2 + 118, 37, "../img/icosm.png", {width:"35px", height:"35px"}, (element)=>{
            element.src = `${this.player?.info.weapons[this.player.info.weaponIndex]?.img}`
        })

        // back weapon arrow
        new ButtonElement(this, this.width/2 + 80, 38, {width:"30px", height:"30px", backgroundImage:"url(../img/leftarrow.png)", backgroundSize:"contain", backgroundRepeat:"no-repeat", backgroundColor:"transparent", borderStyle:"none"}, ()=>{
            this.player?.nextWeapon(-1)
        })

        // next weapon arrow
        new ButtonElement(this, this.width/2 + 421, 38, {width:"30px", height:"30px", backgroundImage:"url(../img/rightarrow.png)", backgroundSize:"contain", backgroundRepeat:"no-repeat", backgroundColor:"transparent", borderStyle:"none"}, ()=>{
            this.player?.nextWeapon(1)

        })

        var repairCount = new DivElement(this, 160, 100, {textAlign:"left"}, (element)=>{
            element.innerText = this.player?.info.repairs
        })

        // repair kit
        new ButtonElement(this, 120, 100, {width:"30px", height:"30px", backgroundImage:"url(../img/repair.png)", backgroundSize:"contain", backgroundRepeat:"no-repeat", backgroundColor:"transparent", borderStyle:"none"}, ()=>{
            if (this.player.info.health == 100) return
            this.player.info.health += 15
            this.player.info.health = Math.min(this.player.info.health, 100)
            this.player.info.repairs --
            repairCount.sync()
            this.powerElement.sync()
        })

        var teleportCount = new DivElement(this, 300, 100, {textAlign:"left"}, (element)=>{
            element.innerText = this.player?.info.teleports
        })

        // teleport
        new ButtonElement(this, 260, 100, {width:"30px", height:"30px", backgroundImage:"url(../img/teleport.png)", backgroundSize:"contain", backgroundRepeat:"no-repeat", backgroundColor:"transparent", borderStyle:"none"}, ()=>{
            this.player.state = PLAYERSTATES.TELEPORTING
            this.player.info.teleports --
            teleportCount.sync()
        })

        this.switchTurns()
        
    }

    switchTurns() {
        // check if only one player remains (whos health is above 0)
        if (this.checkGameOver()) return

        // filter out anyone whos dead but keep current player
        var playerTurnList = this.players.filter(player=>player.info.health > 0 || player==this.player)

        // next player
        if (this.player) {
            this.player = playerTurnList[(playerTurnList.indexOf(this.player) + 1) % playerTurnList.length]
        } else {
            this.player = playerTurnList[0]
        }

        // reset environment variables
        this.wind = this.randomWind()
        this.state = GAMESTATES.READY

        // reset UI elements
        this.guiHandler.syncAll()

        // set players turn to first player in list
        window.dispatchEvent(PLAYERCHANGE)
    }

    checkGameOver() {
        // filter out anyone whos dead
        var alivePlayers = this.players.filter(player=>player.info.health > 20)
        // if only one tank remaining
        if (alivePlayers.length  < 2) {
            this.state = GAMESTATES.GAMEOVER
            this.controller.goToRoom(UpgradeRoom)
            return true
        }
        return false
    }

    onExit(): null {
        return null
    }

    addPlayer(info:PlayerInfo) {
        this.players.push(new Player(this, info))
    }

    randomWind() {
        return ~~(Math.random()*40 - 20)
    }

    update (delta) {
        super.update(delta)
        
        // key checks
        if (InputSingleton.getInstance().keys.has(' ') && this.state == GAMESTATES.READY) {
            // create new enemy bullet in room
            this.player.shoot()
        }
        
        if (InputSingleton.getInstance().keys.has('ArrowDown') && this.player.info.angle > 0) {
            this.player.info.angle -= 0.01
            this.angleElement.sync()
        }
        if (InputSingleton.getInstance().keys.has('ArrowUp') && this.player.info.angle < Math.PI) {
            this.player.info.angle += 0.01
            this.angleElement.sync()
        }
        // get moving
        if (InputSingleton.getInstance().keys.has("ArrowLeft")) {
            // check if the ground to the left is at a steep angle
            this.player.drive(-1)
        }
        // get moving
        if (InputSingleton.getInstance().keys.has("ArrowRight")) {
            // check if the ground to the left is at a steep angle
            this.player.drive(1)
        }
        if (this.state == GAMESTATES.FIRED && !this.entityHandler.entityExists(Bullet)) {
            this.state = GAMESTATES.WAITING
            // set a timer
            setTimeout(()=>{
                this.switchTurns()
            }, 1000)
        }
    }

    draw(context:CanvasRenderingContext2D) {
        super.draw(context)
        context.globalAlpha = 0.5
        context.fillStyle = "white"
        context.fillRect(0, 0, this.width, 120)
        context.globalAlpha = 1

        // draw the weapons area
        context.fillRect(this.width/2 + 100, 20, 300, 35)
        context.fillStyle="rgb(200, 200, 200)"
        context.fillRect(this.width/2 + 100, 20, 35, 35)
        context.fillRect(this.width/2 + 365, 20, 35, 35)
    }
}

class PlayerDetailsRoom extends Room {
    passed: PlayerDetailsRoomEntry
    infos:Array<PlayerInfo> = []
    player:number = 0
    constructor(controller) {
        super(controller, "Player Details Room")
    }

    onEnter(passed: PlayerDetailsRoomEntry, backgroundContext: CanvasRenderingContext2D): void {
        backgroundContext.clearRect(0, 0, this.width, this.height)
        backgroundContext.drawImage(<HTMLImageElement>document.getElementById("bg-playerdetail"), 0, 0, this.width, this.height)
        this.passed = passed
                
        // create GUI elements
        new DivElement(this, 540, 350, {fontWeight:"900", fontSize:"40px"}, (element)=>{
            element.innerText = `PLAYER ${this.player + 1}`
        })

        new DivElement(this, 400, 425, {}, (element)=>{
            element.innerText = `NAME: `
        })

        var name = new InputElement(this, 590, 420, {width:"250px", height:"50px", border:"solid",padding:"2px", borderWidth:"2px", borderColor:"black"}, (element)=>{
            element.value = ""
        })

        new DivElement(this, 400, 500, {}, (element)=>{
            element.innerText = `COLOR: `
        })
        // create each of our radio inputs
        var radios = [
            new RadioButton("c", "", "red", {backgroundColor:"rgb(255, 100, 100)"}), 
            new RadioButton("c", "", "green", {backgroundColor:"rgb(100, 255, 100)"}), 
            new RadioButton("c", "", "yellow", {backgroundColor:"rgb(255, 255, 100)"}), 
            new RadioButton("c", "", "blue", {backgroundColor:"rgb(100, 100, 255)"})]
        var colors = new RadioElement(this, 540, 495, radios, {display:"flex", flexDirection:"row"})

        new DivElement(this, 490, 580, {fontWeight:"900", fontSize:"40px"}, (element)=>{
            if (this.player==passed.players-1) {
                element.innerText = `START!`
            } else {
                element.innerText = `NEXT PLAYER`
            }
        })

        new ButtonElement(this, 690, 575, {width:"70px", height:"50px", backgroundImage:"url(../img/nextarrow.png)",backgroundSize:"contain",backgroundRepeat:"no-repeat", backgroundColor:"transparent", border:"none"}, ()=> {
            var info:PlayerInfo = this.defaultPlayer(name.element['value'], colors.getChecked())
            this.infos.push(info)

            // actually play the game
            if (this.player < passed.players - 1) {
                this.player ++
                this.guiHandler.syncAll()
            } else {
                this.controller.goToRoom(GameRoom)
            }
        })
        this.guiHandler.syncAll()
    }

    onExit(): GameRoomEntry {
        return {infos:this.infos, terrain:this.passed.terrain}
    }

    defaultPlayer(name, color):PlayerInfo {
        return {
                name,
                color,
                weapons:[
                    new Weapon(99, SmallMissile, "Small missile", 2000, "../img/icosm.png")
                ],
                weaponIndex:0,
                gas:100, 
                health:100,
                repairs:8, 
                parachutes:6, 
                teleports:6,
                power:25,
                angle:Math.PI/2,
                money:0
            }
    }
}

class TerrainRoom extends Room {
    private playercount:number
    private _terrains:RadioElement
    constructor(controller) {
        super(controller, "Terrain Room")
        this.playercount = 2
    }

    onEnter(passed: any, backgroundContext:CanvasRenderingContext2D): void {
        backgroundContext.clearRect(0, 0, this.width, this.height)
        backgroundContext.drawImage(<HTMLImageElement>document.getElementById("bg-main"), 0, 0, this.width, this.height)
    
        // define GUI here
        new DivElement(this, 310, 350, {fontWeight:"900", fontSize:"40px"}, (element)=>{
            element.innerText = "TERRAIN TYPE"
        })

        new DivElement(this, 690, 350, {fontWeight:"900", fontSize:"40px"}, (element)=>{
            element.innerText = "CONTROLS"
        })

        new DivElement(this, 690, 575, {fontSize:"25px"}, (element)=>{
            element.innerText = `LEFT & RIGHT ARROW\nMOVE\n\nUP & DOWN ARROW\nCANNON ROTATION\n\nPGUP & PGDN\nFIRE POWER\n\n"Q" & "W"\nCHANGE WEAPON\n\nSPACE\nFIRE`
        })

        // create each of our radio inputs
        var radios = [
            new RadioButton("t", "MOUNTAINS", TERRAINS.MOUNTAINS), 
            new RadioButton("t", "FOREST", TERRAINS.FOREST), 
            new RadioButton("t", "DESERT", TERRAINS.DESERT), 
            new RadioButton("t", "RANDOM", TERRAINS.RANDOM)]
        this._terrains = new RadioElement(this, 275, 465, radios, {})

        new DivElement(this, 310, 595, {fontWeight:"900", fontSize:"40px"}, (element)=>{
            element.innerText = "PLAYERS"
        })

        new DivElement(this, 310, 660, {fontSize:"25px"}, (element)=>{
            element.innerText = `TOTAL PLAYERS\n(2 PLAYERS =\n2 HUMAN PLAYERS)`
        })

        var playerdiv =new DivElement(this, 190, 730, {width:"50px", height:"50px",fontSize:"35px", borderRadius:"50%", border:"solid", borderColor:"black", borderWidth:"3px", backgroundColor:"white", display:"flex", justifyContent:"center", alignItems:"center"}, (element)=> {
            element.innerText = `${this.playercount}`
        })

        new ButtonElement(this, 320, 730, {width:"30px", height:"30px", backgroundImage:"url(../img/rightarrow.png)",backgroundSize:"contain", backgroundColor:"transparent", border:"none"}, ()=> {
            if (this.playercount < 5) {
                this.playercount ++
                playerdiv.sync()
            }
        })
        new ButtonElement(this, 260, 730, {width:"30px", height:"30px", backgroundImage:"url(../img/leftarrow.png)",backgroundSize:"contain", backgroundColor:"transparent", border:"none"}, ()=> {
            if (this.playercount > 2) {
                this.playercount --
                playerdiv.sync()
            }
        })

        new ButtonElement(this, this.width - 100, this.height - 50, {width:"70px", height:"50px", backgroundImage:"url(../img/nextarrow.png)",backgroundSize:"contain",backgroundRepeat:"no-repeat", backgroundColor:"transparent", border:"none"}, ()=> {
            // go to next room
            this.controller.goToRoom(PlayerDetailsRoom)
        })
        
        this.guiHandler.syncAll()
    }
    
    onExit(): PlayerDetailsRoomEntry {
        // pass values of names and stuff to next room
        return {terrain:Number.parseInt(this._terrains.getChecked()), players:this.playercount}
    }

    update(delta): void {
        
    }

    draw(context): void {

    }
}

class UpgradeRoom extends Room {
    constructor(controller) {
        super(controller, "Upgrade Room")
    }

    onEnter(passed: UpgradeRoomEntry, backgroundContext: CanvasRenderingContext2D): void {
        // draw background
    }

    // go to GameRoom
    onExit(): GameRoomEntry {
        return {infos: [], terrain:1}
    }
}