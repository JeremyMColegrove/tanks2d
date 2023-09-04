window.addEventListener("load", function () {
    // const evPlayerChange = new Event("player-change")
    const canvas = <HTMLCanvasElement>this.document.getElementById("canvas")
    const bgcanvas = <HTMLCanvasElement>this.document.getElementById("background-canvas")

    const resolution = 1280
    canvas.width = resolution
    canvas.height = resolution/1.5
    bgcanvas.width = resolution
    bgcanvas.height = resolution/1.5

    const controller = new Controller(canvas, bgcanvas)

    // go to first room
    controller.goToRoom(TerrainRoom)


    var lastTime = 0
    function animate (timeStamp) {
        var delta = timeStamp - lastTime
        lastTime = timeStamp

        controller.update(delta)
        controller.draw()

        requestAnimationFrame(animate)
    }
    animate(0)
})