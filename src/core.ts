/* new T() */
type Newable<T> = { new (...args: any[]): T; };

class InputHandler {
    canvas:HTMLCanvasElement
    resolution:number
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
        this.entities = this.entities.filter((entity:Entity)=>!entity._markedForDeletion)
    }

    draw (context:CanvasRenderingContext2D): void {
        this.entities.forEach((entity:Entity)=>entity.draw(context))
    }
}



abstract class Entity {
    layer: number
    _entityHandler: EntityHandler
    _markedForDeletion: boolean
    _id: number
    constructor(room:Room, layer=0) {
        // public
        this._entityHandler = room.entityHandler
        this._markedForDeletion = false
        this.layer = layer

        // private
        this._id = Math.round(Math.random()*8888888888+1111111111)
        room._addEntity(this)
    }

    destroy() {
        this._markedForDeletion = true
    }

    abstract draw(context): void

    abstract update(delta): void
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

    goToRoom(room) {
        var pass
        this.room?.onExit((info)=>pass=info)
        pass = {from:this.room?._name, info:pass}
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

abstract class Room {
    _name: string
    controller:Controller
    width: number
    height: number
    _id:number
    entityHandler:EntityHandler
    inputHandler: InputHandler
    constructor(controller, name) {
        this.controller = controller
        this.width = this.controller.canvas.width
        this.height = this.controller.canvas.height
        this._name = name
        this._id = Math.round(Math.random() * 8888888888 + 1111111111)
        this.entityHandler = new EntityHandler()
        this.inputHandler = new InputHandler(controller.canvas, controller.resolution)
    }

    _addEntity(entity) {
        this.entityHandler.addEntity(entity)
    }

    update(delta) {
        this.entityHandler.update(delta)
    }

    draw (context) {
        this.entityHandler.draw(context)
    }

    onEnter(passed) {

    }

    onExit(pass) {

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