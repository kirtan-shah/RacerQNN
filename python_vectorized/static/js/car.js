
let carImg

class Car {    

    constructor(x, y, width, height) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.direction = 0
        this.gates = []
        this.gatesPassed = []
        this.vision = []
    }

    setInfo(info) {
        this.x = info.x
        this.y = info.y
        this.direction = info.direction
        this.gatesPassed = info.gatesPassed
        this.vision = info.vision
    }

    setGates(gates) {
        this.gates = gates
    }

    drawGates() {
        strokeWeight(3)
        stroke(255, 255, 0)
        for(let i = 0; i < gates.length; i++) {
            let { x1, y1, x2, y2 } = gates[i]
            if(car.gatesPassed[i]) stroke(0, 255, 0)
            else stroke(255, 255, 0)
            line(x1, y1, x2, y2)
        }
    }

    drawVision() {
        stroke(255)
        let dtheta = 2*Math.PI/this.vision.length;
        for(let i = 0; i < this.vision.length; i++) {
            let theta = dtheta*i
            let r = this.vision[i]*200
            let rx = this.x + r*Math.cos(theta + this.direction)
            let ry = this.y + r*Math.sin(theta + this.direction)
            strokeWeight(1)
            line(this.x, this.y, rx, ry)
            strokeWeight(4)
            point(rx, ry)
        }
    }

    draw(visionOn, gatesOn) {
        if(gatesOn) this.drawGates()
        if(visionOn) this.drawVision()
        fill(255, 127, 0)
        stroke(0)
        strokeWeight(1)
        push()
        translate(this.x, this.y)
        rotate(this.direction)
        image(carImg, -this.width/2, -this.height/2, this.width, this.height)
        pop()

    }

    static load() {
        carImg = loadImage('/static/img/car_small.png')
    }

}