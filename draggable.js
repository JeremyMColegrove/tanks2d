
class Draggable {
    constructor (x, y, w, h) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.dragging = false
        this.sx = mouseX
        this.sy = mouseY
        window.addEventListener("mousedown", e=>{
            if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {// 
                // trigger draggable
                this.dragging = true
                this.sx = mouseX
                this.sy = mouseY
            }

        })

        window.addEventListener("mouseup", e=>{
            this.dragging = false
        })
    }

    update () {
        if (this.dragging) {
            this.x += mouseX-this.sx
            this.y += mouseY-this.sy
            this.sx = mouseX
            this.sy = mouseY
        }
    }
}