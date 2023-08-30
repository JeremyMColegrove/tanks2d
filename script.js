let mouseX, mouseY

window.addEventListener("load", function () {
    // const evPlayerChange = new Event("player-change")
    const canvas = this.document.getElementById("canvas")
    const context = canvas.getContext('2d')
    const resolution = 1280
    canvas.width = resolution
    canvas.height = resolution/1.5

    

    // init game
    const game = new Game(canvas.width, canvas.height, canvas, context, resolution)
                        .addPlayer({name:"Jeremy", color:"red"})
                        .addPlayer({name:"Samantha", color:"blue"})
                        .play()

    var lastTime = 0
    function animate (timeStamp) {
        var delta = timeStamp - lastTime
        lastTime = timeStamp

        context.clearRect(0, 0, canvas.width, canvas.height)

        game.update(delta)
        
        game.draw(context)


        requestAnimationFrame(animate)
    }
    animate(0)
})