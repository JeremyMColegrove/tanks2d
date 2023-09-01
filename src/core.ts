/* new T() */
type Newable<T> = { new (...args: any[]): T; };

// object type of information passed current room to next room when changed
type Passer = {
    from:string,
    info: Object
}

type Pass = (info: Object) => void

class InputHandler {
    private canvas:HTMLCanvasElement
    private resolution:number
    mx: number
    my: number
    keys: Set<string>
    constructor(canvas:HTMLCanvasElement, resolution:number) {
        this.canvas = canvas
        this.resolution = resolution
        this.mx = 0
        this.my = 0
        this.keys = new Set()
        window.addEventListener("keydown", e => {
            this.keys.add(e.key)
        })
        window.addEventListener("keyup", e=>{
            this.keys.delete(e.key)
        })
        window.addEventListener("mousemove", e=>{
            this.mx = e.offsetX * this.resolution/this.canvas.clientWidth
            this.my = e.offsetY * this.resolution/this.canvas.clientWidth
        })
    }
}

class EntityHandler {
    entities: Array<Entity>
    constructor() {
        // generate unique IDs for all subtypes of Entity
        this.entities = []
    }

    addEntity(entity:Entity) {
        this.entities.push(entity)
    }

    entityExists(eClass:Newable<Entity>): boolean {
        for (var i=0;  i<this.entities.length; i++) {
            if (this.entities[i] instanceof eClass) return true
        }
        return false
    }

    entityCount(eClass:Newable<Entity>): number {
        var count = 0
        this.entities.forEach((entity:Entity)=>{
            if (entity instanceof eClass) count ++
        })
        return count
    }

    update(delta:number): void {
        this.entities.forEach(entity=>entity.update(delta))
        // remove deleted entities and update map
        this.entities = this.entities.filter((entity:Entity)=>!entity.markedForDeletion)
    }

    draw (context:CanvasRenderingContext2D): void {
        this.entities.forEach((entity:Entity)=>entity.draw(context))
    }
}

type SupportedImageSource = Exclude<Exclude<CanvasImageSource, VideoFrame>, SVGImageElement>

class Sprite {
    private img: SupportedImageSource
    center:[number, number]
    tint:string
    width:number
    height:number
    scale:number
    angle:number
    constructor(img:SupportedImageSource|HTMLElement) {
        this.setSprite(<SupportedImageSource>img)
        this.center = [0, 0]
        this.tint = "white"
        this.angle = 0
        this.width = 0
        this.height = 0
        this.scale = 1
    }

    draw(context:CanvasRenderingContext2D, x:number, y:number) {

        // translate to sprite center
        context.translate( x - this.center[0], y - this.center[1])

        // rotate
        if (this.angle != 0.0) {
            context.rotate(this.angle)
        }

        // draw image
        context.drawImage(this.img, 0, 0)

        // rotate back
        if (this.angle != 0.0) {
            context.rotate(-this.angle)
        }
        // translate back
        context.translate(-(x - this.center[0]), -(y - this.center[1]))
    }

    setScale(scale:number):Sprite {
        this.scale = scale
        return this
    }

    setTint(tint:string):Sprite {
        this.tint = tint
        return this
    }

    setCenter(center:[number, number]):Sprite {
        this.center = center
        return this
    }

    setSprite(img:SupportedImageSource):Sprite {
        this.img = img
        this.width = this.img.width
        this.height = this.img.height
        return this
    }
}

class Draggable {
    inputHandler: InputHandler
    x: number
    y: number
    w: number
    h: number
    dragging: boolean
    _sx: number
    _sy: number
    constructor (room, x, y, w, h) {
        this.inputHandler = room.inputHandler
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.dragging = false
        this._sx = this.inputHandler.mx
        this._sy = this.inputHandler.my
        window.addEventListener("mousedown", e=>{
            if (this.inputHandler.mx > this.x && this.inputHandler.mx < this.x + this.w && this.inputHandler.my > this.y && this.inputHandler.my < this.y + this.h) {// 
                // trigger draggable
                this.dragging = true
                this._sx = this.inputHandler.mx
                this._sy = this.inputHandler.my
            }

        })

        window.addEventListener("mouseup", e=>{
            this.dragging = false
        })
    }

    update (delta) {
        if (this.dragging) {
            this.x += this.inputHandler.mx-this._sx
            this.y += this.inputHandler.my-this._sy
            this._sx = this.inputHandler.mx
            this._sy = this.inputHandler.my
        }
    }
}

abstract class Entity {
    layer: number
    markedForDeletion: boolean
    room:Room
    x:number
    y:number
    sprite:Sprite
    protected id: number
    constructor(room:Room, layer=0) {
        // public
        this.markedForDeletion = false
        this.layer = layer
        this.room = room
        this.x = 0
        this.y = 0
        this.sprite = null
        // private
        this.id = Math.round(Math.random()*8888888888+1111111111)
        room.addEntity(this)
    }

    setSprite(sprite:Sprite):Entity {
        this.sprite = sprite
        return this
    }

    destroy():void {
        this.markedForDeletion = true
    }

    drawSprite(sprite:HTMLCanvasElement, x:number, y:number, angle:number):void {
        this.room.controller.context.drawImage(sprite, x, y)
    }

    abstract draw(context):void

    abstract update(delta):void
}

class Controller {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    resolution: number
    room: Room
    constructor(canvas, context, resolution) {
        this.canvas = canvas
        this.context = context
        this.resolution = resolution
        this.room = null
    }

    goToRoom(room:Newable<Room>) {
        var pass:Passer
        this.room?.onExit((info:Passer)=>pass=info)
        pass = {from:this.room?.name, info:pass}
        this.room = new room(this)
        this.room.onEnter(pass)
    }

    update(delta):void {
        this.room?.update(delta)
    }

    draw():void {
        this.room?.draw(this.context)
    }
}

class Room {
    name: string
    controller:Controller
    width: number
    height: number
    id:number
    entityHandler:EntityHandler
    inputHandler: InputHandler
    constructor(controller, name) {
        this.controller = controller
        this.width = this.controller.canvas.width
        this.height = this.controller.canvas.height
        this.name = name
        this.id = Math.round(Math.random() * 8888888888 + 1111111111)
        this.entityHandler = new EntityHandler()
        this.inputHandler = new InputHandler(controller.canvas, controller.resolution)
    }

    addEntity(entity) {
        this.entityHandler.addEntity(entity)
    }

    update(delta) {
        this.entityHandler.update(delta)
    }

    draw (context) {
        this.entityHandler.draw(context)
    }

    onEnter(passed:Passer) {

    }

    onExit(pass:Pass) {

    }
}

