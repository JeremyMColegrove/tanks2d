class UIHandle extends Draggable {
    constructor(x, y, w, h) {
        super(x, y, w+15, h+15)
        this.startx = x //override y movement by saving start y
        this.starting_x = x
        this.visible_height = h
        this.visible_width = w
    }

    update() {
        super.update()
    }

    draw(context) {
        context.fillRect(this.x, this.y, this.visible_width, this.visible_height)
    }
}









