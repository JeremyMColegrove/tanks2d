// @ts-ignore 
noise.seed(Math.random());
class Ground extends Entity {
    constructor(room, context, color) {
        super(room, 0);
        this.room = room;
        this.color = color;
        this.context = context;
        this.harry = this.getHarry(1000, 185, 130, 1);
        this.img = this.generateGround(this.color, this.context.createImageData(this.room.width, this.room.height));
        this.hasCollapse = false;
    }
    getHarry(scale, magnitude, offset, levels) {
        var harry = new Array(this.room.width).fill(offset);
        for (var x = 0; x < harry.length; x++) {
            for (var level = 1; level <= levels; level++) {
                // @ts-ignore 
                harry[x] += Math.round(noise.perlin2((x + level) / (scale / level), (x + level) / (scale / level)) * (magnitude / level));
            }
        }
        return harry;
    }
    generateGround(rgb, img) {
        var array = img.data;
        // harry determines our ground surface
        for (var w = 0; w < this.room.width; w++) {
            for (var h = 0; h < this.room.height; h++) {
                if (h > this.room.height - this.harry[w]) {
                    const red = h * (this.room.width * 4) + w * 4;
                    array[red] = rgb[0]; // red
                    array[red + 1] = rgb[1]; // green
                    array[red + 2] = rgb[2]; // blue
                    array[red + 3] = 255; // alpha
                }
            }
        }
        return img;
    }
    fillHoles(x, radius) {
        x = Math.round(x);
        // this gets called to collapse the holes
        for (var w = x - radius; w < x + radius; w++) {
            var hitGround = false;
            var count = 0;
            for (var h = 0; h < this.room.height; h++) {
                // if it is inside of the circle
                const red = h * (this.room.width * 4) + w * 4;
                if (!hitGround && this.img.data[red + 3] > 0) {
                    hitGround = true;
                    this.harry[w] = this.room.height - h + 1;
                }
                else if (hitGround && this.img.data[red + 3] == 0) {
                    count++;
                }
            }
            if (!hitGround) {
                this.harry[w] = 0;
            }
            else {
                this.harry[w] -= count;
            }
        }
        // smooth out the effected pixels around the point of impact
        this.smoothHarry(x, radius, 12);
        // generate new ground
        this.img = this.generateGround(this.color, this.context.createImageData(this.room.width, this.room.height));
    }
    smoothHarry(x, radius, distance) {
        var smoothing = radius * 2;
        for (var point = x - smoothing; point < x + smoothing && point > 0 && point < this.room.width; point++) {
            var average = 0;
            var weight = 1 - (Math.abs(x - point) / (smoothing));
            var count = 0;
            for (var sample = point - distance; sample < point + distance && sample > 0 && sample < this.room.width; sample++) {
                average += this.harry[sample];
                count++;
            }
            if (count > 0) {
                average /= count;
                this.harry[point] = this.harry[point] * (1 - weight) + average * weight;
            }
        }
    }
    // to blow a hole in the ground somewhere
    blow(x, y, radius) {
        // erase the ground where the hit is
        // loop through all of the ground
        for (var w = 0; w < this.room.width; w++) {
            for (var h = 0; h < this.room.height; h++) {
                // if it is inside of the circle
                if (Math.sqrt(Math.pow(Math.abs(x - w), 2) + Math.pow(Math.abs(y - h), 2)) < radius) {
                    const red = h * (this.room.width * 4) + w * 4;
                    this.img.data[red + 3] = 0; // set alpha to 0
                }
            }
        }
        // collapse the holes
        this.fillHoles(x, radius);
    }
    update(delta) { }
    draw(context) {
        context.putImageData(this.img, 0, 0);
    }
}
