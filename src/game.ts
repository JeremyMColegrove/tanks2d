abstract class Bullet extends Entity {
    room:GameRoom
    power:number
    angle:number
    vx:number
    vy:number
    speed:number
    abstract damage:number
    abstract radius:number
    constructor(room, x, y, power, angle) {
        super(room, 0)
        this.room = room
        this.x = x
        this.y = y
        this.power = power
        this.angle = angle
        this.vx = this.power*Math.cos(this.angle)
        this.vy = this.power*Math.sin(this.angle)
        this.speed = 0.05
    }

    onImpact() {}

    draw(context: CanvasRenderingContext2D) {}

    update (delta:number) {

        // the missle moving physics here
        this.x += this.vx*this.speed
        this.y += this.vy*this.speed
        this.vy += 9.8*this.speed
        this.vx += this.room.wind*0.005

        if (this.x < 0 || this.x > this.room.width || this.y > this.room.height)
            this.destroy()

        // check for collision with ground
        if (this.y > this.room.height - this.room.ground.harry[Math.round(this.x)]) {
            this.room.ground.blow(this.x, this.y, this.radius)
            this.destroy()
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
        this.damage = 20;
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
        this.damage = 40;
    }

    draw(context) {
        // the missle appearance here
        context.fillStyle="black"
        context.beginPath();
        context.arc(this.x, this.y, 4, 0, 2 * Math.PI, true);
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

    }

    draw(context) {
        // the missle appearance here
        context.fillStyle = "#591415"; //dark red
        context.beginPath();
        context.arc(this.x, this.y, 3, 0, 2 * Math.PI, true);
        context.fill()
    }
}


class Weapon {
    amount:number
    item:Newable<Bullet>
    name:string
    cost:number
    img:SupportedImageSource
    constructor(amount:number, item:Newable<Bullet>, name:string, cost:number, img:SupportedImageSource) {
        this.amount = amount
        this.item = item
        this.name = name
        this.cost = cost
        this.img = img
    }
}


class Tank extends Entity {
    room:GameRoom
    oldx:number
    oldy:number
    color:string
    sprite:Sprite
    muzzle:Sprite
    owningPlayer:Player
    ground:Ground
    constructor(room:GameRoom, color:string, owningPlayer:Player, ground:Ground) {
        super(room, 0)
        this.color = color
        this.room = room
        this.sprite = new Sprite(document.getElementById("tank"))
        this.muzzle = new Sprite(document.getElementById("muzzle"))

        this.sprite.center([0, this.sprite.height/2]).tint(color)
        this.muzzle.center([0, this.muzzle.height/2])

        this.ground = ground
        this.owningPlayer = owningPlayer

        // set x and y coords of tank
        this.x = ~~(Math.random()*(room.width-400)+200)
        this.y = this.room.height - ground.harry[this.x]

        // to get state changes
        this.oldx = 0
        this.oldy = 0
    }

    shoot() {
        var startOfMuzzle = Utility.rotatePoint(this.x, this.y, this.sprite.width-3, this.sprite.angle)
        var endOfMuzzle = Utility.rotatePoint(startOfMuzzle[0], startOfMuzzle[1], this.muzzle.width, this.muzzle.angle )
        if (this.owningPlayer.stats.weapons.length > 0) {
            new this.owningPlayer.stats.weapons[this.owningPlayer.stats.weaponIndex].item(this.room, endOfMuzzle[0], endOfMuzzle[1], this.owningPlayer.stats.power/100 * this.owningPlayer.maxpower, this.muzzle.angle)
            this.room['state'] = GAME_STATES.FIRED
        }
    }

    drive(direction:-1|1):void {
        if (this.owningPlayer.stats.gas  < 1) return

        var dist = 4.0*direction
        var p2 = this.ground.harry[~~this.x + dist]
        var p1 = this.ground.harry[~~this.x + dist * 2]
        var p3 = this.ground.harry[~~this.x + dist * 3]
        if (Math.abs(Math.atan((p3-p2)/dist)) < 1.1) {
            if (Math.abs(Math.atan((p2-p1)/dist)) < 1.1) {
                this.owningPlayer.stats.gas -= 0.2
                this.x += 0.3*direction
                this.y = this.room.height - this.ground.harry[~~this.x] - 1
                this.room.gasElement.sync()
            }
        }
    }


    update(delta:number): void {
        // function to keep tank on ground
        if (this.y < this.room.height - this.ground.harry[~~this.x]) {
            this.y += delta/32
        }

        // check for change in x y, expensive computation
        if (this.oldx != this.x || this.oldy != this.y) {
            // adjust angle to match ground
            // sample 3 points and find average angle
            var dist = 16.0
            var p1 = this.ground.harry[~~this.x - dist]
            var p2 = this.ground.harry[~~this.x]
            var p3 = this.ground.harry[~~this.x + dist]
            this.sprite.angle = -((Math.atan((p3-p2)/dist) + Math.atan((p2-p1)/dist)) / 2) - Math.PI/2
        }

        this.oldx = this.x
        this.oldy = this.y
        this.muzzle.angle = -this.owningPlayer.stats.angle + this.sprite.angle + Math.PI/2
    }

    draw (context:CanvasRenderingContext2D): void {
        this.sprite.draw(context, this.x, this.y)
        var rotatedPoint = Utility.rotatePoint(this.x, this.y, this.sprite.width - 3, this.sprite.angle)
        this.muzzle.draw(context, rotatedPoint[0], rotatedPoint[1])
    }
}

type PlayerStats = {
    weapons:Array<Weapon>,
    weaponIndex:number,
    gas:number, 
    health:number,
    repairs:number, 
    parachutes:number, 
    teleports:number,
    power:number,
    angle:number, 
    }

class Player {
    room: GameRoom
    name: string
    color: string
    x: number
    tank: Tank
    stats:PlayerStats
    maxpower:number
    ground:Ground
    constructor(room:GameRoom, name:string, color:string, ground:Ground) {
        this.room = room
        this.name = name
        this.color = color
        //all of our settings
        this.tank = new Tank(this.room, this.color, this, ground)
        this.maxpower = 200 // actual multiplier being passed into bullet, sensitive
        
        // default player settings and weapons
        this.stats = {weapons:[
            new Weapon(99, SmallMissile, "Small missle", 100, <HTMLImageElement>document.getElementById('')),
            new Weapon(10, VolcanoBomb, "Volcano bomb", 1000, <HTMLImageElement>document.getElementById('')),
            new Weapon(10, SmallAtomBomb, "Small atom bomb", 9000, <HTMLImageElement>document.getElementById('')),
            new Weapon(10, AtomBomb, "Atom bomb", 20000, <HTMLImageElement>document.getElementById(''))

        ],  
            
            weaponIndex:1, 
            gas:100,
            health:100,
            repairs:8,
            parachutes:6,
            teleports:8, 
            power:50, 
            angle:Math.PI/2}
    }

    nextWeapon(direction:1|-1) {
        this.stats.weaponIndex = (this.stats.weaponIndex + direction) % (this.stats.weapons.length)
        if (this.stats.weaponIndex < 0) this.stats.weaponIndex = this.stats.weapons.length - 1
        this.room.guiHandler.syncAll()
    }
}


const PLAYERCHANGE = new Event("player-change")

enum GAME_STATES {
    READY,
    FIRED,
    PAUSED,
    GAMEOVER
}

class GameRoom extends Room {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    resolution:number
    ground: Ground
    players: Array<Player>
    player: Player
    wind: number
    state: GAME_STATES
    angleElement:SliderElement
    powerElement:SliderElement
    gasElement:DivElement
    constructor(controller) {
        super(controller, "Game Room")
        this.canvas = this.controller.canvas
        this.context = this.controller.context
        this.width = this.canvas.width
        this.height = this.canvas.height
        this.players = []
        this.player = null
        this.wind = this.randomWind()
        this.state = GAME_STATES.READY
    }

    onEnter(passed:RoomInfo, backgroundContext:CanvasRenderingContext2D) {
        var background:SupportedImageSource
        var color:[number, number, number]

        if (passed.info.terrain == Terrains.RANDOM) {
            passed.info.terrain = ~~(Math.random()*3) + 1
        }

        if (passed.info.terrain == Terrains.MOUNTAINS) {
            background = <HTMLImageElement>document.getElementById("bg-snow")
            color = [245, 245, 255]
        } else if (passed.info.terrain == Terrains.FOREST) {
            background = <HTMLImageElement>document.getElementById("bg-forest")
            color = [144, 191, 54]
        } else if (passed.info.terrain == Terrains.DESERT) {
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
        passed.info['playerinfo'].forEach(player=>this.addPlayer({name:player.name, color:player.color}))
        
        // set players turn to first player in list
        this.player = this.players[0]

        

        // create GUI Elements after players have been created
        var angleText = new DivElement(this, this.width/3 + 170, 70, {}, (element)=>{
            element.innerText = `${~~(this.player.stats.angle * 180/Math.PI)}`
        })

        this.angleElement = new SliderElement(this, this.width/3 + 150, 30, 1-(this.player.stats.angle / Math.PI), 
            {width:"150px", height:"10px", backgroundImage:"url(../img/gradient-horizontal.png)", backgroundSize:"cover", backgroundRepeat:"no-repeat"}, 
            (event)=>{
            // when the slider is moved
            this.player.stats.angle = (1-event.target.value) * Math.PI
            angleText.sync()
        }, (element)=> {
            element['value'] = 1 - (this.player.stats.angle / Math.PI)
            angleText.sync()
        })

        var powerText = new DivElement(this, this.width/3 + 30, 100, {}, (element)=>{
            element.innerText = `${~~this.player.stats.power}`
        })

        this.powerElement = new SliderElement(this, this.width/3, 60, 0.5, 
        {width:"100px", height:"40px", transform:"rotate(270deg)", backgroundImage:"url(../img/gradient-vertical.png)", backgroundSize:"100% 100%", backgroundRepeat:"no-repeat"}, 
        (event)=>{
            // when the slider is moved
            this.player.stats.power = (event.target.value) * 100
            powerText.sync()
        }, (element)=>{
            element['value'] = this.player.stats.power / 100
            powerText.sync()
        })

        var nameText = new DivElement(this, 0, 0, {border:"solid",borderColor:"rgba(179, 179, 179, 0.329)", borderWidth:"2px", paddingBlock:"10px", paddingInline:"40px"}, (element)=>{
            element.innerText = this.player.name
            nameText.x = element.clientWidth / 2
            nameText.y = element.clientHeight / 2
        })

        // fire button
        var fireButton = new ButtonElement(this, this.width/3 + 150, 100, {width:"75px", height:"35px"},()=>{
            
            this.player.tank.shoot()
        }, 
        (element)=>{
            element.value = "Fire"
        })

        // clouds
        new ImageElement(this, this.width/2 + 300, 90, "../img/cloudr.png", {width:"50px", height:"50px", objectFit:"contain"}, (element)=>{
            if (this.wind > 0) {
                element.src = "../img/cloudr.png"
            } else {
                element.src = "../img/cloudl.png"
            }
        })

        new DivElement(this, this.width/2 + 350, 90, {}, (element) => {
            element.innerText = `${Math.abs(this.wind)}`
        })

        this.gasElement = new DivElement(this, 75, 75, {}, (element) => {
            element.innerText = `${~~Math.abs(this.player.stats.gas)}`
        })
        new ImageElement(this, 30, 70, "../img/gas.png", {width:"20px", height:"30px", backgroundSize:"contain", backgroundRepeat:"no-repeat"})
        

        // draw the weapons background and images
        // weapon name
        
        new DivElement(this, this.width/2 + 260, 40, {textAlign:"left",width:"220px"}, (element)=>{
            element.innerText = this.player.stats.weapons[this.player.stats.weaponIndex]?.name
        })

        // weapon count
        new DivElement(this, this.width/2 + 383, 40, {textAlign:"left"}, (element)=>{
            element.innerText = this.player.stats.weapons[this.player.stats.weaponIndex]?.amount
        })

        new ButtonElement(this, this.width/2 + 80, 38, {width:"30px", height:"30px", backgroundImage:"url(../img/leftarrow.png)", backgroundSize:"contain", backgroundRepeat:"no-repeat", backgroundColor:"transparent", borderStyle:"none"}, ()=>{
            this.player.nextWeapon(-1)
        })
        new ButtonElement(this, this.width/2 + 421, 38, {width:"30px", height:"30px", backgroundImage:"url(../img/rightarrow.png)", backgroundSize:"contain", backgroundRepeat:"no-repeat", backgroundColor:"transparent", borderStyle:"none"}, ()=>{
            this.player.nextWeapon(1)

        })

        // event that gets triggered whenever a player should change
        window.addEventListener("player-change", ()=> {
            // next player
            this.player = this.players[(this.players.indexOf(this.player) + 1) % this.players.length]
            this.wind = this.randomWind()
            this.state = GAME_STATES.READY

            // reset UI elements
            this.guiHandler.syncAll()
        })
        this.guiHandler.syncAll()
    }

    onExit(pass: Pass): void {
        
    }

    addPlayer({name, color}) {
        this.players.push(new Player(this, name, color, this.ground))
    }

    randomWind() {
        return ~~(Math.random()*40 - 20)
    }

    update (delta) {
        super.update(delta)
        
        // key checks
        if (InputSingleton.getInstance().keys.has(' ') && this.state == GAME_STATES.READY) {
            // create new enemy bullet in room
            this.player.tank.shoot()
        }
        
        if (InputSingleton.getInstance().keys.has('ArrowDown') && this.player.stats.angle > 0) {
            this.player.stats.angle -= 0.01
            this.angleElement.sync()
        }
        if (InputSingleton.getInstance().keys.has('ArrowUp') && this.player.stats.angle < Math.PI) {
            this.player.stats.angle += 0.01
            this.angleElement.sync()
        }
        // get moving
        if (InputSingleton.getInstance().keys.has("ArrowLeft")) {
            // check if the ground to the left is at a steep angle
            this.player.tank.drive(-1)
        }
        // get moving
        if (InputSingleton.getInstance().keys.has("ArrowRight")) {
            // check if the ground to the left is at a steep angle
            this.player.tank.drive(1)
        }
        if (this.state == GAME_STATES.FIRED && !this.entityHandler.entityExists(Bullet)) {
            window.dispatchEvent(PLAYERCHANGE)
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
    passed: Passer
    information:Array<Object>
    curplayer:number
    constructor(controller) {
        super(controller, "Player Details Room")
        this.curplayer = 0
    }

    onEnter(passed: Passer, backgroundContext: CanvasRenderingContext2D): void {
        backgroundContext.clearRect(0, 0, this.width, this.height)
        backgroundContext.drawImage(<HTMLImageElement>document.getElementById("bg-playerdetail"), 0, 0, this.width, this.height)
        this.passed = passed
        console.log(this.passed)
        
        // create GUI elements
        new DivElement(this, 540, 350, {fontWeight:"900", fontSize:"40px"}, (element)=>{
            element.innerText = `PLAYER ${this.curplayer + 1}`
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
            if (this.curplayer==passed.info['players']-1) {
                element.innerText = `START!`
            } else {
                element.innerText = `NEXT PLAYER`
            }
        })

        new ButtonElement(this, 690, 575, {width:"70px", height:"50px", backgroundImage:"url(../img/nextarrow.png)",backgroundSize:"contain",backgroundRepeat:"no-repeat", backgroundColor:"transparent", border:"none"}, ()=> {
            var playerinfo = {name:name.element['value'], color:colors.getChecked()}
            this.passed.info['playerinfo'].push(playerinfo)

            // actually play the game
            if (this.curplayer < passed.info['players'] - 1) {
                this.curplayer ++
                this.guiHandler.syncAll()
            } else {
                this.controller.goToRoom(GameRoom)
            }
        })
        this.guiHandler.syncAll()
    }

    onExit(pass: Pass): void {
        pass(this.passed.info)
    }
}

enum Terrains {
    MOUNTAINS=1,
    FOREST=2,
    DESERT=3,
    RANDOM=4
}

type PlayerInfo = {name:string, color:string}
type RoomInfo = {from:string, info:{players:number, terrain:Terrains, playerinfo:Array<PlayerInfo>}}

class TerrainRoom extends Room {
    private playercount:number
    private _terrains:RadioElement
    constructor(controller) {
        super(controller, "Terrain Room")
        this.playercount = 2
    }

    onEnter(passed: RoomInfo, backgroundContext:CanvasRenderingContext2D): void {
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
            new RadioButton("t", "MOUNTAINS", Terrains.MOUNTAINS), 
            new RadioButton("t", "FOREST", Terrains.FOREST), 
            new RadioButton("t", "DESERT", Terrains.DESERT), 
            new RadioButton("t", "RANDOM", Terrains.RANDOM)]
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
    
    onExit(pass: Pass): void {
        // pass values of names and stuff to next room
        pass({players:this.playercount, terrain:this._terrains.getChecked(), playerinfo:[]})
    }

    update(delta): void {
        
    }

    draw(context): void {

    }
}