// @ts-nocheck
let mx, my;
window.addEventListener("load", function () {
    // const evPlayerChange = new Event("player-change")
    const canvas = this.document.getElementById("canvas");
    const context = canvas.getContext('2d');
    const resolution = 1280;
    canvas.width = resolution;
    canvas.height = resolution / 1.5;
    const controller = new Controller(canvas, context, resolution);
    // go to first room
    controller.goToRoom(GameRoom);
    var lastTime = 0;
    function animate(timeStamp) {
        var delta = timeStamp - lastTime;
        lastTime = timeStamp;
        context.clearRect(0, 0, canvas.width, canvas.height);
        controller.update(delta);
        controller.draw();
        requestAnimationFrame(animate);
    }
    animate(0);
});
