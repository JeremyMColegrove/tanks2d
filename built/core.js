// class for defining helpful static functions
class Utility {
    static rotatePoint(x, y, distance, angle) {
        // rotate the point around this x and y with distance from x and y distance, rotated angle radians
        var xx = x + distance * Math.cos(angle);
        var yy = y + distance * Math.sin(angle);
        return [xx, yy];
    }
    static randomString(length) {
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
class UIElement {
    constructor(room, x, y, style = {}, onsync = null) {
        this.x = x;
        this.y = y;
        this._room = room;
        this._style = style;
        this._onsync = onsync;
        this._id = Utility.randomString(10);
        this._scale = this._room.controller.canvas.clientHeight / this._room.controller.canvas.height;
        // create our element and define some styles
        this._ele = this.createElement();
        this._defaultStyle = this.defaultStyles();
        // combine given styles and default styles
        this._style = Object.assign(this._defaultStyle, this._style);
        // set global things for each UI element that always stay true
        this._ele.style.position = `absolute`;
        this._ele.id = `${this._id}`;
        // apply styles passed to styles on element
        for (const [key, value] of Object.entries(this._style)) {
            this._ele.style[key] = value;
        }
        // add element to room
        this._room.guiHandler.addElement(this);
    }
    get id() {
        return this._id;
    }
    get scale() {
        return this._scale;
    }
    get room() {
        return this._room;
    }
    get style() {
        return this._style;
    }
    set element(element) {
        this._ele = element;
    }
    get element() {
        return this._ele;
    }
    sync() {
        if (this._onsync)
            this._onsync(this.element);
    }
    delete() {
        this._room.guiHandler.removeElement(this);
    }
    // refreshes positions of gui elements
    refresh(canvasRect) {
        this._scale = this._room.controller.canvas.clientHeight / this._room.controller.canvas.height;
        var w = this._ele.clientWidth;
        var h = this._ele.clientHeight;
        this._ele.style.scale = `${this._scale}`;
        this._ele.style.left = `${((this.x * this._scale - w / 2) + canvasRect.left)}px`;
        this._ele.style.top = `${((this.y * this._scale - h / 2) + canvasRect.top)}px`;
    }
}
// HTML DOM input of type text
class InputElement extends UIElement {
    constructor(room, x, y, style = {}, sync = null) {
        super(room, x, y, style, sync);
    }
    createElement() {
        var ele = document.createElement("input");
        ele.className = "_inputelement";
        return ele;
    }
    defaultStyles() {
        return { outline: 'none', outlineStyle: "none" };
    }
    refresh(canvasRect) {
        super.refresh(canvasRect);
        // this.element.style.fontSize = `${Number.parseInt(this.style.fontSize) * this.scale}px`
    }
}
// HTML DOM button element
class ButtonElement extends UIElement {
    constructor(room, x, y, style = {}, callback, sync = null) {
        super(room, x, y, style, sync);
        this._callback = callback;
    }
    createElement() {
        var ele = document.createElement("input");
        ele.type = "button";
        ele.onclick = () => this._callback();
        ele.className = "_buttonelement";
        return ele;
    }
    defaultStyles() {
        return {};
    }
    refresh(canvasRect) {
        super.refresh(canvasRect);
        this.element.style.fontSize = `${Number.parseInt(this.style.fontSize) * this.scale}px`;
    }
}
// HTML DOM image element
class ImageElement extends UIElement {
    constructor(room, x, y, src, style = {}, sync = null) {
        super(room, x, y, style, sync);
        var img = this.element;
        img['src'] = src;
    }
    createElement() {
        var ele = document.createElement("img");
        ele.className = "_imageelement";
        return ele;
    }
    defaultStyles() {
        return { backgroundSize: "contain", backgroundRepeat: "no-repeat" };
    }
}
// HTML DOM div element
class DivElement extends UIElement {
    constructor(room, x, y, style = {}, sync = null) {
        super(room, x, y, style, sync);
    }
    createElement() {
        var ele = document.createElement("div");
        ele.className = "_divelement";
        return ele;
    }
    defaultStyles() {
        return { textAlign: 'center' };
    }
}
// HTML DOM slider element
class SliderElement extends UIElement {
    constructor(room, x, y, value, style = {}, onchange, sync = null) {
        super(room, x, y, style, sync);
        this.element['value'] = `${value}`;
        this._onchange = onchange;
    }
    createElement() {
        var ele = document.createElement("input");
        ele.type = "range";
        ele.min = `0.0`;
        ele.max = `1.0`;
        ele.step = "0.01";
        ele.className = "_sliderelement";
        ele.oninput = (e) => this._onchange(e);
        return ele;
    }
    defaultStyles() {
        return {};
    }
}
class RadioButton {
    constructor(group, label, value, style = {}) {
        this.element = document.createElement('input');
        this.element.type = 'radio';
        this.element.name = group;
        this.element.value = value;
        this.label = label;
        this.value = value;
        // apply styles passed to styles on element
        for (const [key, value] of Object.entries(style)) {
            this.element.style[key] = value;
        }
    }
}
class RadioElement extends UIElement {
    constructor(room, x, y, radioButtons, style, onsync = null) {
        super(room, x, y, style, onsync);
        // add all of the radio groups to the parent div
        this._radios = radioButtons;
        this._radios.forEach(radio => {
            // create a label and append 
            var label = document.createElement('label');
            label.innerText = radio.label;
            label.style.display = "flex";
            label.style.alignItems = "center";
            label.insertBefore(radio.element, label.firstChild);
            this.element.appendChild(label);
        });
        if (this._radios.length > 0)
            this._radios[~~(Math.random() * this._radios.length - 1)].element.checked = true;
    }
    // returns value of the one who is checked
    getChecked() {
        for (var i = 0; i < this._radios.length; i++) {
            if (this._radios[i].element['checked']) {
                return this._radios[i].element['value'];
            }
        }
        return null;
    }
    createElement() {
        // wrap inputs in a div
        var div = document.createElement('div');
        div.className = "_radiogroup";
        return div;
    }
    defaultStyles() {
        return { display: "flex", flexDirection: "column" };
    }
}
/**
 * Handles all UI elements and handles each elements refreshing, not user-accessible
 * @internal
 * */
class GUIHandler {
    constructor() {
        this._elements = [];
        this._GUIparent = document.getElementById("GUI");
        this._canvas = document.getElementById("canvas");
        // create watcher on canvas size
        new ResizeObserver(() => this.refresh()).observe(this._canvas);
    }
    syncAll() {
        this._elements.forEach(element => element.sync());
    }
    // refreshes the position of each of the gui elements
    refresh() {
        var rect = this._canvas.getBoundingClientRect();
        this._elements.forEach(ele => ele.refresh(rect));
    }
    removeElement(GUIelement) {
        this._elements.filter(ele => ele != GUIelement);
        this._GUIparent.removeChild(GUIelement.element);
    }
    addElement(GUIelement) {
        this._elements.push(GUIelement);
        this._GUIparent.appendChild(GUIelement.element);
        this.refresh();
    }
    unmount() {
        // remove all items from DOM
        this._elements.forEach(ele => this.removeElement(ele));
    }
}
// Singleton class for handling all inputs (keyboard, mouse, etc)
class InputSingleton {
    constructor(canvas) {
        this.canvas = canvas;
        this._mx = 0;
        this._my = 0;
        this._oldx = 0;
        this._oldy = 0;
        this._keys = new Set();
        this._mousedown = false;
        window.addEventListener("keydown", e => {
            this._keys.add(e.key);
        });
        window.addEventListener("keyup", e => {
            this._keys.delete(e.key);
        });
        window.addEventListener("mousemove", e => {
            this._mx = e.offsetX * this.canvas.width / this.canvas.clientWidth;
            this._my = e.offsetY * this.canvas.height / this.canvas.clientHeight;
            this._delta = [(this._mx - this._oldx) / 2, (this._my - this._oldy) / 2];
            this._oldx = this._mx;
            this._oldy = this._my;
        });
        window.addEventListener("mousedown", e => {
            this._mousedown = true;
        });
        window.addEventListener("mouseup", e => {
            this._mousedown = false;
        });
    }
    get mousedown() {
        return this._mousedown;
    }
    get delta() {
        return this._delta;
    }
    get mx() {
        return this._mx;
    }
    get my() {
        return this._my;
    }
    get keys() {
        return this._keys;
    }
    static getInstance() {
        if (!InputSingleton.instance) {
            var canvas = document.getElementById('canvas');
            InputSingleton.instance = new InputSingleton(canvas);
        }
        return InputSingleton.instance;
    }
}
/**
 * Manages, draws, and updates all entities for each room
 * @hidden
 * */
class EntityHandler {
    constructor() {
        // generate unique IDs for all subtypes of Entity
        this.entities = [];
    }
    addEntity(entity) {
        this.entities.push(entity);
    }
    entityExists(eClass) {
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i] instanceof eClass)
                return true;
        }
        return false;
    }
    entityCount(eClass) {
        var count = 0;
        this.entities.forEach((entity) => {
            if (entity instanceof eClass)
                count++;
        });
        return count;
    }
    update(delta) {
        this.entities.forEach(entity => entity.update(delta));
        // remove deleted entities and update map
        this.entities = this.entities.filter((entity) => !entity.markedForDeletion);
    }
    draw(context) {
        this.entities.forEach((entity) => entity.draw(context));
    }
}
// Container around an image source useful for drawing to canvas
class Sprite {
    constructor(img = null) {
        this._center = [0, 0];
        this.angle = 0;
        this._scale = 1;
        this._width = 0;
        this._height = 0;
        if (img)
            this.sprite(img);
    }
    tint(color) {
        // take imgNoTint, apply tint to it and set to img
        var canvas = new OffscreenCanvas(this._width, this._height);
        var context = canvas.getContext('2d');
        context.drawImage(this.imgNoTint, 0, 0, this._width, this._height);
        context.globalAlpha = 0.4;
        context.fillStyle = color;
        context.globalCompositeOperation = "multiply";
        context.fillRect(0, 0, this._width, this._height);
        context.globalCompositeOperation = "destination-in";
        context.globalAlpha = 1;
        context.drawImage(this.imgNoTint, 0, 0, this._width, this._height);
        this.img = canvas.transferToImageBitmap();
        return this;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    draw(context, x, y) {
        // translate to sprite center
        context.translate(x, y);
        // rotate
        context.rotate(this.angle);
        // draw offscreen canvas to this canvas
        context.drawImage(this.img, -this._center[0] * this._scale, -this._center[1] * this._scale, this.width, this.height);
        // rotate back
        context.rotate(-this.angle);
        // translate back
        context.translate(-(x), -(y));
    }
    scale(scale) {
        this._scale = scale;
        this._width = this.img.width * this._scale;
        this._height = this.img.height * this._scale;
        return this;
    }
    center(center) {
        this._center = center;
        return this;
    }
    sprite(img) {
        this.imgNoTint = img;
        this._width = this.imgNoTint.width;
        this._height = this.imgNoTint.height;
        this.img = img;
        return this;
    }
}
// Abstract entity class with builtin properties and methods
class Entity {
    constructor(room, layer = 0) {
        // public
        this.markedForDeletion = false;
        this.layer = layer;
        this.room = room;
        this.x = 0;
        this.y = 0;
        this.sprite = null;
        // private
        this.id = Math.round(Math.random() * 8888888888 + 1111111111);
        room.addEntity(this);
    }
    drag() {
        var deltas = InputSingleton.getInstance().delta;
        // console.log(deltas)
        this.x += deltas[0];
        this.y += deltas[1];
    }
    setSprite(sprite) {
        this.sprite = sprite;
        return this;
    }
    destroy() {
        this.markedForDeletion = true;
    }
}
// Root object of all other objects, responsible for keeping track of rooms
class Controller {
    constructor(canvas, backgroundCanvas) {
        this.canvas = canvas;
        this.backgroundCanvas = backgroundCanvas;
        this.context = canvas.getContext('2d');
        this.backgroundContext = backgroundCanvas.getContext('2d');
        this.room = null;
    }
    goToRoom(room) {
        var _a, _b, _c;
        var pass;
        (_a = this.room) === null || _a === void 0 ? void 0 : _a.onExit((info) => pass = info);
        pass = { from: (_b = this.room) === null || _b === void 0 ? void 0 : _b.name, info: pass };
        (_c = this.room) === null || _c === void 0 ? void 0 : _c._unmount();
        this.room = new room(this);
        this.room.onEnter(pass, this.backgroundContext);
    }
    update(delta) {
        var _a;
        (_a = this.room) === null || _a === void 0 ? void 0 : _a.update(delta);
    }
    draw() {
        var _a;
        // this.backgroundContext.
        (_a = this.room) === null || _a === void 0 ? void 0 : _a.draw(this.context, this.backgroundContext);
    }
}
// A container holding entities and GUI elements
class Room {
    constructor(controller, name) {
        this.controller = controller;
        this.width = this.controller.canvas.width;
        this.height = this.controller.canvas.height;
        this.name = name;
        this.id = Math.round(Math.random() * 8888888888 + 1111111111);
        this.entityHandler = new EntityHandler();
        this.guiHandler = new GUIHandler();
    }
    addEntity(entity) {
        this.entityHandler.addEntity(entity);
    }
    update(delta) {
        this.entityHandler.update(delta);
    }
    draw(context, backgroundContext = null) {
        // clear the room
        context.clearRect(0, 0, this.width, this.height);
        // draw all entities to room to main context
        this.entityHandler.draw(context);
    }
    /**@internal */
    _unmount() {
        this.guiHandler.unmount();
    }
}
