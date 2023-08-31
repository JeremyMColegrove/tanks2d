class InputHandler {
    constructor(canvas, resolution) {
        this.canvas = canvas;
        this.resolution = resolution;
        this.mx = 0;
        this.my = 0;
        this.keys = new Set();
        window.addEventListener("keydown", e => {
            this.keys.add(e.key);
        });
        window.addEventListener("keyup", e => {
            this.keys.delete(e.key);
        });
        window.addEventListener("mousemove", e => {
            this.mx = e.offsetX * this.resolution / this.canvas.clientWidth;
            this.my = e.offsetY * this.resolution / this.canvas.clientWidth;
        });
    }
}
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
        this.entities = this.entities.filter((entity) => !entity._markedForDeletion);
    }
    draw(context) {
        this.entities.forEach((entity) => entity.draw(context));
    }
}
class Entity {
    constructor(room, layer = 0) {
        // public
        this._entityHandler = room.entityHandler;
        this._markedForDeletion = false;
        this.layer = layer;
        // private
        this._id = Math.round(Math.random() * 8888888888 + 1111111111);
        room._addEntity(this);
    }
    destroy() {
        this._markedForDeletion = true;
    }
}
class Controller {
    constructor(canvas, context, resolution) {
        this.canvas = canvas;
        this.context = context;
        this.resolution = resolution;
        this.room = null;
    }
    goToRoom(room) {
        var _a, _b;
        var pass;
        (_a = this.room) === null || _a === void 0 ? void 0 : _a.onExit((info) => pass = info);
        pass = { from: (_b = this.room) === null || _b === void 0 ? void 0 : _b._name, info: pass };
        this.room = new room(this);
        this.room.onEnter(pass);
    }
    update(delta) {
        var _a;
        (_a = this.room) === null || _a === void 0 ? void 0 : _a.update(delta);
    }
    draw() {
        var _a;
        (_a = this.room) === null || _a === void 0 ? void 0 : _a.draw(this.context);
    }
}
class Room {
    constructor(controller, name) {
        this.controller = controller;
        this.width = this.controller.canvas.width;
        this.height = this.controller.canvas.height;
        this._name = name;
        this._id = Math.round(Math.random() * 8888888888 + 1111111111);
        this.entityHandler = new EntityHandler();
        this.inputHandler = new InputHandler(controller.canvas, controller.resolution);
    }
    _addEntity(entity) {
        this.entityHandler.addEntity(entity);
    }
    update(delta) {
        this.entityHandler.update(delta);
    }
    draw(context) {
        this.entityHandler.draw(context);
    }
    onEnter(passed) {
    }
    onExit(pass) {
    }
}
class Draggable {
    constructor(room, x, y, w, h) {
        this.inputHandler = room.inputHandler;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.dragging = false;
        this._sx = this.inputHandler.mx;
        this._sy = this.inputHandler.my;
        window.addEventListener("mousedown", e => {
            if (this.inputHandler.mx > this.x && this.inputHandler.mx < this.x + this.w && this.inputHandler.my > this.y && this.inputHandler.my < this.y + this.h) { // 
                // trigger draggable
                this.dragging = true;
                this._sx = this.inputHandler.mx;
                this._sy = this.inputHandler.my;
            }
        });
        window.addEventListener("mouseup", e => {
            this.dragging = false;
        });
    }
    update(delta) {
        if (this.dragging) {
            this.x += this.inputHandler.mx - this._sx;
            this.y += this.inputHandler.my - this._sy;
            this._sx = this.inputHandler.mx;
            this._sy = this.inputHandler.my;
        }
    }
}
