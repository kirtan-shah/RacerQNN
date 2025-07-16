
const maxSpeed = 2
let carImg

class Car {    

    constructor(x, y, width, height) {
        this.x = x
        this.y = y
        this.xI = x
        this.yI = y
        this.vx = 0
        this.vy = 0
        this.speed = 0
        this.width = width
        this.height = height
        this.direction = 0
        this.gatesPassed = []
        this.gates = []
        this.lock = -1
    }

    reset() {
        this.x = this.xI
        this.y = this.yI
        this.direction = 0
        this.gatesPassed = Array(gates.length).fill(false)
        this.lock = -1
    }

    getState(lines, drawEnabled) {
        const rayLength = 200
        let vision = []
        for(let theta = 0; theta < Math.PI*2; theta += Math.PI/6) {
            let x2 = this.x + rayLength * Math.cos(theta + this.direction)
            let y2 = this.y + rayLength * Math.sin(theta + this.direction)
            x2 = Math.round(x2 * 10) / 10
            y2 = Math.round(y2 * 10) / 10
            let closest = [x2, y2]
            let minDistSq = rayLength*rayLength
            for(let l of lines) {
                let cross = intersectsWhere(this.x, this.y, x2, y2, l.x1, l.y1, l.x2, l.y2)
                let distSq = (cross[0] - this.x)*(cross[0] - this.x) + (cross[1] - this.y)*(cross[1] - this.y)
                if(cross && distSq < minDistSq) {
                    closest = cross 
                    minDistSq = distSq
                }
            }
            if(drawEnabled) {
                stroke(255)
                strokeWeight(1)
                line(this.x, this.y, closest[0], closest[1])
                strokeWeight(4)
                point(closest[0], closest[1])
            }
            vision.push(Math.sqrt(minDistSq) / rayLength)
        }
        vision.push(this.speed / maxSpeed) // add speed to feature list
        return vision
    }

    setGates(gates) {
        this.gates = gates
        this.gatesPassed = Array(gates.length).fill(false)
    }

    forward() {
        //this.vx = Math.min(this.vx + .1 * Math.cos(this.direction), Math.sqrt(2))
        //this.vy = Math.min(this.vy + .1 * Math.sin(this.direction), Math.sqrt(2))
        //this.x += Math.cos(this.direction) * 4
        //this.y += Math.sin(this.direction) * 4
        this.speed = Math.min(this.speed + .2, maxSpeed)
    }
    backward() {
        //this.vx = Math.max(this.vx - .1 * Math.cos(this.direction), -Math.sqrt(2))
        //this.vy = Math.max(this.vy - .1 * Math.sin(this.direction), -Math.sqrt(2))
        //this.x -= Math.cos(this.direction) * 4
        //this.y -= Math.sin(this.direction) * 4
        this.speed = Math.max(this.speed - .2, -maxSpeed)
    }
    left() {
        this.direction -= .04
    }
    right() {
        this.direction += .04
    }

    update(lines, drawEnabled) {
        this.vx = this.speed * Math.cos(this.direction)
        this.vy = this.speed * Math.sin(this.direction)
        this.x += this.vx
        this.y += this.vy
        this.speed *= 0.99

        // "top left" => "cw"
        let c = Math.cos(this.direction)
        let s = Math.sin(this.direction)
        const carPoints = [ 
            [-this.width/2, this.height/2],
            [this.width/2, this.height/2],
            [this.width/2, -this.height/2],
            [-this.width/2, -this.height/2]
        ]
        for(let point of carPoints) {
            let x1 = point[0]
            let y1 = point[1]
            point[0] = c*x1 - s*y1
            point[1] = s*x1 + c*y1
        }
        let newGatePassed = false
        for(let i = 0; i < carPoints.length; i++) {
            let p1 = carPoints[i]
            let p2 = carPoints[(i + 1) % carPoints.length]
            //stroke(255, 0, 0)
            //strokeWeight(2)
            //line(p1[0] + this.x, p1[1] + this.y, p2[0] + this.x, p2[1] + this.y)
            for(let l of lines) {
                if(intersects(p1[0] + this.x, p1[1] + this.y, p2[0] + this.x, p2[1] + this.y, l.x1, l.y1, l.x2, l.y2)) {
                    if(drawEnabled) {
                        stroke(255, 0, 0)
                        strokeWeight(4)
                        line(l.x1, l.y1, l.x2, l.y2)
                    }
                    return 'collided'
                }
            }
            for(let j = 0; j < this.gates.length; j++) {
                if(this.lock == j) continue
                let g = this.gates[j]
                if(!this.gatesPassed[j] && intersects(p1[0] + this.x, p1[1] + this.y, p2[0] + this.x, p2[1] + this.y, g.x1, g.y1, g.x2, g.y2)) {
                    this.gatesPassed[j] = true
                    newGatePassed = true
                    this.lock = j
                    if(this.gatesPassed.every(x => x))
                        this.gatesPassed = Array(gates.length).fill(false)
                }
            }
        }
        if(newGatePassed) return 'gate'
        return 'none'
    }

    draw() {
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
        carImg = loadImage('car_small.png')
    }

}