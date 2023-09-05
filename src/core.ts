/***
 * @internal
 * new T() */
type Newable<T> = { new (...args: any[]): T; };
type Constructor<T> = Function & { prototype: T }

// class for defining helpful static functions
class Utility {
    public static rotatePoint(x:number, y:number, distance:number, angle:number): [number, number] {

        // rotate the point around this x and y with distance from x and y distance, rotated angle radians
        var xx = x + distance*Math.cos(angle)
        var yy = y + distance*Math.sin(angle)
        return [xx, yy]
    }
    public static distance(point1:[number, number], point2:[number, number]) {
        return Math.sqrt(  Math.pow(point1[0]-point2[0], 2) + Math.pow(point1[1]-point2[1], 2))
    }
    public static randomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    }
}

/**
 * base class for all UI elements
 * @internal
 * */
abstract class UIElement {
    x:number
    y:number
    private _id
    private _ele: HTMLElement
    private _room:Room
    private _style:Partial<CSSStyleDeclaration>
    private _defaultStyle:Partial<CSSStyleDeclaration>
    private _scale:number
    private _onsync:Function
    constructor(room:Room, x:number, y:number, style:Partial<CSSStyleDeclaration>={}, onsync:Function=null) {
        this.x = x
        this.y = y
        this._room = room
        this._style = style
        this._onsync = onsync
        this._id = Utility.randomString(10)
        this._scale = this._room.controller.canvas.clientHeight/this._room.controller.canvas.height
        // create our element and define some styles
        this._ele = this.createElement()
        this._defaultStyle = this.defaultStyles()

        // combine given styles and default styles
        this._style = Object.assign(this._defaultStyle, this._style)

        // set global things for each UI element that always stay true
        this._ele.style.position = `absolute`
        this._ele.id = `${this._id}`
        
        // apply styles passed to styles on element
        for (const [key, value] of Object.entries(this._style)) {
            this._ele.style[key] = value
        }

        // add element to room
        this._room.guiHandler.addElement(this)
    }

    get id() {
        return this._id
    }
    get scale() {
        return this._scale
    }
    get room() {
        return this._room
    }
    get style() {
        return this._style
    }

    set element(element:HTMLElement) {
        this._ele = element
    }
    get element() {
        return this._ele
    }

    abstract createElement():HTMLElement

    abstract defaultStyles():Partial<CSSStyleDeclaration>

    sync() {
        if (this._onsync) this._onsync(this.element)
    }

    delete() {
        this._room.guiHandler.removeElement(this)
    }

    // refreshes positions of gui elements
    refresh(canvasRect:DOMRect) {
        this._scale = this._room.controller.canvas.clientHeight/this._room.controller.canvas.height
        var w = this._ele.clientWidth
        var h = this._ele.clientHeight
        this._ele.style.scale = `${this._scale}`
        this._ele.style.left = `${((this.x*this._scale - w/2) + canvasRect.left )}px`
        this._ele.style.top = `${((this.y*this._scale - h/2) + canvasRect.top)}px`
    }
}

// HTML DOM input of type text
class InputElement extends UIElement {
    constructor(room:Room, x:number, y:number, style:Partial<CSSStyleDeclaration>={}, sync:Function=null) {
        super(room, x, y, style, sync)
    }
    createElement(): HTMLElement {
        var ele = document.createElement("input")
        ele.className = "_inputelement"
        return ele
    }
    defaultStyles(): Partial<CSSStyleDeclaration> {
        return {outline:'none', outlineStyle:"none"}
    }
    refresh(canvasRect: DOMRect): void { 
        super.refresh(canvasRect)
        // this.element.style.fontSize = `${Number.parseInt(this.style.fontSize) * this.scale}px`
    }
}

// HTML DOM button element
class ButtonElement extends UIElement {
    private _callback:Function
    constructor(room:Room, x:number, y:number, style:Partial<CSSStyleDeclaration>={}, callback:Function, sync:Function=null) {
        super(room, x, y, style, sync)
        this._callback = callback
    }
    createElement(): HTMLElement {
        var ele = document.createElement("input")
        ele.type = "button"
        ele.onclick = ()=>this._callback()
        ele.className = "_buttonelement"
        return ele
    }
    defaultStyles(): Partial<CSSStyleDeclaration> {
        return {}
    }
    refresh(canvasRect: DOMRect): void {
        super.refresh(canvasRect)
        this.element.style.fontSize = `${Number.parseInt(this.style.fontSize) * this.scale}px`
    }
}

// HTML DOM image element
class ImageElement extends UIElement {
    constructor(room:Room, x:number, y:number, src:string, style:Partial<CSSStyleDeclaration>={}, sync:Function=null) {
        super(room, x, y, style, sync)
        this.element['src'] = src
    }

    createElement(): HTMLElement {
        var ele = document.createElement("img")
        ele.className = "_imageelement"
        return ele
    }
    defaultStyles(): Partial<CSSStyleDeclaration> {
        return {backgroundSize:"contain", backgroundRepeat:"no-repeat"}
    }
}

// HTML DOM div element
class DivElement extends UIElement {
    constructor(room:Room, x:number, y:number, style:Partial<CSSStyleDeclaration>={},  sync:Function=null) {
        super(room, x, y, style, sync)
    }
    createElement(): HTMLElement {
        var ele = document.createElement("div")
        ele.className = "_divelement"
        return ele
    }

    defaultStyles(): Partial<CSSStyleDeclaration> {
        return {textAlign:'center'}
    }
}

// HTML DOM slider element
class SliderElement extends UIElement {
    _onchange:Function
    _onrefresh:Function
    constructor(room:Room, x:number, y:number, value:number, style:Partial<CSSStyleDeclaration>={}, onchange:Function, sync:Function=null) {
        super(room, x, y, style, sync)
        this.element['value'] = `${value}`
        this._onchange = onchange
    }
    
    createElement(): HTMLElement {
        var ele = document.createElement("input")
        ele.type = "range"
        ele.min = `0.0`
        ele.max = `1.0`
        ele.step="0.01"
        ele.className = "_sliderelement"
        ele.oninput = (e)=> this._onchange(e)
        return ele
    }
    defaultStyles(): Partial<CSSStyleDeclaration> {
        return {}
    }
}

class RadioButton {
    element:HTMLInputElement
    label:string
    value:string
    constructor(group:string, label:string, value:any, style:Partial<CSSStyleDeclaration>={}) {
        this.element = document.createElement('input')
        this.element.type = 'radio'
        this.element.name = group
        this.element.value = value
        this.label = label
        this.value = value

        // apply styles passed to styles on element
        for (const [key, value] of Object.entries(style)) {
            this.element.style[key] = value
        }
    }
}

class RadioElement extends UIElement {
    _radios:Array<RadioButton>
    constructor(room:Room, x:number, y:number, radioButtons:Array<RadioButton>, style:Partial<CSSStyleDeclaration>, onsync:Function=null) {
        super(room, x, y, style, onsync)

        // add all of the radio groups to the parent div
        this._radios = radioButtons
        this._radios.forEach(radio=>{
            // create a label and append 
            var label = document.createElement('label')
            label.innerText = radio.label
            label.style.display = "flex"
            label.style.alignItems = "center"

            label.prepend(radio.element)
            this.element.appendChild(label)
        })
        if (this._radios.length > 0) this._radios[~~(Math.random()*this._radios.length-1)].element.checked = true
    }
    
    // returns value of the one who is checked
    getChecked():string|null {
        for (var i=0; i<this._radios.length; i++) {
            if (this._radios[i].element['checked']) {
                return this._radios[i].element['value']
            }
        }
        return null
    }

    createElement(): HTMLElement {
        // wrap inputs in a div
        var div = document.createElement('div')
        div.className="_radiogroup"
        return div
    }

    defaultStyles(): Partial<CSSStyleDeclaration> {
        return {display:"flex", flexDirection:"column"}
    }
}

/**
 * Handles all UI elements and handles each elements refreshing, not user-accessible
 * @internal
 * */
class GUIHandler {
    private _elements:Array<UIElement>
    private _GUIparent:HTMLElement
    private _canvas:HTMLCanvasElement
    constructor() {
        this._elements = []
        this._GUIparent = document.getElementById("GUI")
        this._canvas = <HTMLCanvasElement>document.getElementById("canvas")

        // create watcher on canvas size
        new ResizeObserver(()=>this.refresh()).observe(this._canvas)
    }

    syncAll() {
        this._elements.forEach(element=>element.sync())
    }

    // refreshes the position of each of the gui elements
    refresh() {
        var rect = this._canvas.getBoundingClientRect()
        this._elements.forEach(ele=>ele.refresh(rect))
    }

    removeElement(GUIelement:UIElement) {
        this._elements.filter(ele=>ele!=GUIelement)
        this._GUIparent.removeChild(GUIelement.element)
    }

    addElement(GUIelement: UIElement) {
        this._elements.push(GUIelement)
        this._GUIparent.appendChild(GUIelement.element)
        this.refresh()
    }

    unmount() {
        // remove all items from DOM
        this._elements.forEach(ele=>this.removeElement(ele))
    }
}

// Singleton class for handling all inputs (keyboard, mouse, etc)
class InputSingleton {
    private static instance:InputSingleton
    private canvas:HTMLCanvasElement
    private _oldx:number
    private _oldy:number
    private _mx: number
    private _my: number
    private _keys: Set<string>
    private _delta: [number, number]
    private _mousedown:boolean
    private constructor(canvas:HTMLCanvasElement) {
        this.canvas = canvas
        this._mx = 0
        this._my = 0
        this._oldx = 0
        this._oldy = 0
        this._keys = new Set()
        this._mousedown = false

        window.addEventListener("keydown", e => {
            this._keys.add(e.key)
        })

        window.addEventListener("keyup", e=>{
            this._keys.delete(e.key)
        })

        window.addEventListener("mousemove", e=>{
            this._mx = e.offsetX * this.canvas.width/this.canvas.clientWidth
            this._my = e.offsetY * this.canvas.height/this.canvas.clientHeight
            this._delta = [(this._mx - this._oldx)/2, (this._my - this._oldy)/2]
            this._oldx = this._mx
            this._oldy = this._my
        })

        window.addEventListener("mousedown", e=>{
            this._mousedown = true
        })

        window.addEventListener("mouseup", e=>{
            this._mousedown = false
        })
    }

    get mousedown() {
        return this._mousedown
    }
    get delta() {
        return this._delta
    }

    get mx() {

        return this._mx
    }

    get my() {
        return this._my
    }

    get keys() {
        return this._keys
    }

    public static getInstance() {
        if (!InputSingleton.instance) {
            var canvas = <HTMLCanvasElement> document.getElementById('canvas')
            InputSingleton.instance = new InputSingleton(canvas)
        }

        return InputSingleton.instance
    }

}

/**
 * Manages, draws, and updates all entities for each room
 * @hidden
 * */
class EntityHandler {
    entities: Array<Entity>
    constructor() {
        // generate unique IDs for all subtypes of Entity
        this.entities = []
    }

    addEntity(entity:Entity) {
        this.entities.push(entity)
    }

    entityExists(eClass:Constructor<Entity>): boolean {
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


// Supported image sources for a Sprite
type SupportedImageSource = Exclude<Exclude<CanvasImageSource, VideoFrame>, SVGImageElement>

// Container around an image source useful for drawing to canvas
class Sprite {
    private img: SupportedImageSource
    private imgNoTint: SupportedImageSource
    private _center:[number, number] = [0, 0]
    private _width:number = 0
    private _height:number = 0
    private _scale:number = 1
    angle:number = 0
    constructor(img:SupportedImageSource|HTMLElement=null) {
        if (img) this.sprite(<SupportedImageSource>img)
    }


    tint(color):Sprite {
        // take imgNoTint, apply tint to it and set to img
        var canvas = new OffscreenCanvas(this._width, this._height)
        var context = canvas.getContext('2d')

        context.drawImage(this.imgNoTint, 0, 0, this._width, this._height)

        context.globalAlpha = 0.4

        context.fillStyle = color

        context.globalCompositeOperation = "multiply"

        context.fillRect(0, 0, this._width, this._height)

        context.globalCompositeOperation = "destination-in"

        context.globalAlpha = 1

        context.drawImage(this.imgNoTint, 0, 0, this._width, this._height)

        this.img = canvas.transferToImageBitmap()
        
        return this
    }

    get width() {
        return this._width
    }

    get height() {
        return this._height
    }

    draw(context:CanvasRenderingContext2D, x:number, y:number) {
        // translate to sprite center
        context.translate( x, y)

        // rotate
        if (this.angle != 0) context.rotate(this.angle)


        // draw offscreen canvas to this canvas
        context.drawImage(this.img, -this._center[0], -this._center[1], this.width, this.height)

        // rotate back
        if (this.angle != 0) context.rotate(-this.angle)

        // translate back
        context.translate(-(x), -(y))
    }

    scale(scale:number):Sprite {
        
        this._width = this.img.width * scale
        this._height = this.img.height * scale
        this._center = [this._center[0]*(scale/this._scale), this._center[1]*(scale/this._scale)]
        this._scale = scale
        return this
    }

    center(center:[number, number]):Sprite {
        this._center = center
        return this
    }

    sprite(img:SupportedImageSource):Sprite {
        this.imgNoTint = img
        this._width = this.imgNoTint.width
        this._height = this.imgNoTint.height
        this.img = img
        return this
    }
}

// Abstract entity class with builtin properties and methods
abstract class Entity {
    layer: number
    markedForDeletion: boolean
    room:Room
    x:number
    y:number
    sprite:Sprite
    private id: number
    constructor(room:Room, layer=0) {
        // public
        this.markedForDeletion = false
        this.layer = layer
        this.room = room
        this.x = 0
        this.y = 0
        // private
        this.id = Math.round(Math.random()*8888888888+1111111111)
        room.addEntity(this)
    }

    drag () {
        var deltas:[number, number] = InputSingleton.getInstance().delta
        // console.log(deltas)
        this.x += deltas[0]
        this.y += deltas[1]
    }

    setSprite(sprite:Sprite):Entity {
        this.sprite = sprite
        return this
    }

    destroy():void {
        this.markedForDeletion = true
    }

    abstract draw(context):void

    abstract update(delta):void
}

// Root object of all other objects, responsible for keeping track of rooms
class Controller {
    canvas: HTMLCanvasElement
    backgroundCanvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    backgroundContext:CanvasRenderingContext2D
    room: Room
    constructor(canvas, backgroundCanvas) {
        this.canvas = canvas
        this.backgroundCanvas = backgroundCanvas
        this.context = canvas.getContext('2d')
        this.backgroundContext = backgroundCanvas.getContext('2d')
        this.room = null
    }

    goToRoom(room:Newable<Room>) {
        var infoToNextRoom:any = this.room?.onExit()
        this.room?._unmount()
        this.room = new room(this)
        this.room.onEnter(infoToNextRoom, this.backgroundContext)
    }

    update(delta):void {
        this.room?.update(delta)
    }

    draw():void {
        // this.backgroundContext.
        this.room?.draw(this.context, this.backgroundContext)
    }
}

// A container holding entities and GUI elements
abstract class Room {
    name: string
    controller:Controller
    width: number
    height: number
    id:number
    entityHandler:EntityHandler
    guiHandler:GUIHandler
    constructor(controller:Controller, name:string) {
        this.controller = controller
        this.width = this.controller.canvas.width
        this.height = this.controller.canvas.height
        this.name = name
        this.id = Math.round(Math.random() * 8888888888 + 1111111111)
        this.entityHandler = new EntityHandler()
        this.guiHandler = new GUIHandler()
    }

    addEntity(entity:Entity) {
        this.entityHandler.addEntity(entity)
    }

    update(delta:number) {
        this.entityHandler.update(delta)
    }

    draw (context:CanvasRenderingContext2D, backgroundContext:CanvasRenderingContext2D|null=null) {
        // clear the room
        context.clearRect(0, 0, this.width, this.height)
        // draw all entities to room to main context
        this.entityHandler.draw(context)
    }

    /**@internal */
    _unmount() {
        this.guiHandler.unmount()
    }

    abstract onEnter(info:any, backgroundContext:CanvasRenderingContext2D):void

    abstract onExit():void
}

