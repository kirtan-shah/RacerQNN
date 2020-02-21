let car = new Car(300, 100, 40, 20)
let brain = new Brain()
let lines = []
let gates = []
let drawMode = false
let gatesShown = false
let currentLine = { x1: 0, y1: 0, x2: 0, y2: 0 }
let cursorX = 0
let cursorY = 0
let isMousePressed
let map
let graphicsOn = true
let visionOn = true
let trainingLoop = -1
let controlMode = true

function setup() {
    canvas = createCanvas(960, 540)
    pixelDensity(1)
    map = createGraphics(width, height)
    map.pixelDensity(1)
    canvas.parent('parent')
    Car.load()

    tf.setBackend('cpu')

    createButton('Export Map')
        .mousePressed(() => {
            document.getElementById('export-area').value = JSON.stringify({ lines, gates })
        })
    createButton('Import Map')
        .mousePressed(() => {
            data = JSON.parse(document.getElementById('export-area').value)
            lines = data.lines
            gates = data.gates
            car.setGates(gates)
            document.getElementById('export-area').value = ""
            updateMap()
        })
    let toggleGates = createButton('Show Gates')
    toggleGates.mousePressed(() => {
        gatesShown = !gatesShown
        toggleGates.html(gatesShown ? 'Hide Gates' : 'Show Gates')
    })
    let drawModeBtn = createButton('Draw Gates')
    drawModeBtn.mousePressed(() => {
        drawMode = !drawMode
        drawModeBtn.html(drawMode ? 'Draw Road' : 'Draw Gates')
    })
    let toggleGraphics = createButton('Hide Graphics')
    toggleGraphics.mousePressed(() => {
        graphicsOn = !graphicsOn
        if(!graphicsOn) visionOn = false
        toggleVision.html('Show Vision')
        toggleGraphics.html(graphicsOn ? 'Hide Graphics' : 'Show Graphics')
    })
    let toggleVision = createButton('Hide Vision')
    toggleVision.mousePressed(() => {
        visionOn = !visionOn
        toggleVision.html(visionOn ? 'Hide Vision' : 'Show Vision')
    })
    let toggleTraining = createButton('Start Training')
    toggleTraining.mousePressed(() => {
        if(trainingLoop == -1) {
            trainingLoop = setInterval(() => {
                brain.step(car, lines, graphicsOn, visionOn)
            }, 0)
        }
        else {
            clearInterval(trainingLoop)
            trainingLoop = -1
        }
        toggleTraining.html(trainingLoop == -1 ? 'Start Training' : 'Pause Training')
    })
    let toggleControl = createButton('Automatic Control')
    toggleControl.mousePressed(() => {
        controlMode = !controlMode
        toggleControl.html(controlMode ? 'Automatic Control' : 'Manual Control')
    })

    updateMap()
    frameRate(60)

    
}

function draw() {
    //console.time('Frame')

    if(graphicsOn) {
        background(0, 160, 0)
        image(map, 0, 0)
        car.draw()
        drawEditor()
        drawGates()
        drawCursor()
    }
    
    let state = car.getState(lines, visionOn)
    if(controlMode) {
        if(up) car.forward()
        if(down) car.backward()
        if(left) car.left()
        if(right) car.right()
    } 
    else {
        let action = argmax(brain.predict(state))
        if(action == 0) car.forward()
        if(action == 1) car.backward()
        if(action == 2) car.left()
        if(action == 3) car.right()
        if(action == 4) void(0)
    }
    if(trainingLoop == -1) car.update(lines, graphicsOn)

    //console.timeEnd('Frame')
}

function drawCursor() {
    updateCursor()
    strokeWeight(1)
    stroke(0)
    fill(255)
    triangle(cursorX, cursorY, cursorX - 6, cursorY + 16, cursorX + 6, cursorY + 16)
    noCursor()
}

function drawGates() {
    if(gatesShown) {
        strokeWeight(3)
        stroke(255, 255, 0)
        for(let i = 0; i < gates.length; i++) {
            let { x1, y1, x2, y2 } = gates[i]
            if(car.gatesPassed[i]) stroke(0, 255, 0)
            else stroke(255, 255, 0)
            line(x1, y1, x2, y2)
        }
    }
}

function drawEditor() {
    if(drawMode) stroke(255, 255, 0)
    else stroke(0)
    strokeWeight(4)
    if(isMousePressed) {
        line(currentLine.x1, currentLine.y1, cursorX, cursorY)
    }
}

const threshold = 15
function updateCursor() {
    cursorX = mouseX
    cursorY = mouseY
    for(let line of lines) {
        let { x1, y1, x2, y2 } = line
        if((x1 - mouseX)*(x1 - mouseX) + (y1 - mouseY)*(y1 - mouseY) < threshold*threshold) {
            cursorX = x1
            cursorY = y1
        }
        if((x2 - mouseX)*(x2 - mouseX) + (y2 - mouseY)*(y2 - mouseY) < threshold*threshold) {
            cursorX = x2
            cursorY = y2
        }
    }
}

function updateMap() {
    let begin = millis()
    d = pixelDensity()
    map.background(0, 160, 0)
    map.strokeWeight(4)
    map.stroke(0)
    for(let { x1, y1, x2, y2 } of lines) {
        map.line(x1, y1, x2, y2)
    }
    map.loadPixels()
    let visited = Array(width*height).fill(false)
    let queue = [ 99*width + 299 ]
    let i = 0
    while(i < queue.length) {
        //console.log(queue.length, i)
        let p = queue[i]
        i++
        let r = map.pixels[p*4*d*d]
        let g = map.pixels[p*4*d*d + 1]
        let b = map.pixels[p*4*d*d + 2]
        if(!(r == 0 && g == 0 && b == 0)) {
            map.pixels[p*4*d*d] = 100
            map.pixels[p*4*d*d + 1] = 100
            map.pixels[p*4*d*d + 2] = 100
            if(Math.trunc(p / width) > 0 && !visited[p - width])  {
                queue.push(p - width)
                visited[p - width] = true
            }
            if(Math.trunc(p / width) < height - 1 && !visited[p + width]) {
                queue.push(p + width)
                visited[p + width] = true
            }
            if(p % width > 0 && !visited[p - 1]) {
                queue.push(p - 1)
                visited[p - 1] = true
            }
            if(p % width < width - 1 && !visited[p + 1]) {
                queue.push(p + 1)
                visited[p + 1] = true
            }
        } 
    }
    map.updatePixels()
    let end = millis()
}

let up = false
let down = false
let left = false
let right = false
function keyPressed() {
    if(key == 'w') up = true
    if(key == 's') down = true
    if(key == 'a') left = true
    if(key == 'd') right = true
}
function keyReleased() {
    if(key == 'w') up = false
    if(key == 's') down = false
    if(key == 'a') left = false
    if(key == 'd') right = false
}

function mousePressed() {
    currentLine.x1 = cursorX
    currentLine.y1 = cursorY
    isMousePressed = true
}

function mouseReleased() {
    currentLine.x2 = cursorX
    currentLine.y2 = cursorY
    let copy = Object.assign({}, currentLine)
    if(drawMode) gates.push(copy)
    else if(
        !(cursorX > width || cursorX < 0 || cursorY > height || cursorY < 0) &&
        !(currentLine.x1 == currentLine.x2 && currentLine.y1 == currentLine.y2)
    ) {
        lines.push(copy)
    }
    isMousePressed = false
    updateMap()
}