let car = new Car(300, 100, 40, 20)
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
let trainingLoop = false
let controlMode = true

let replay = []
let replayIndex = 0

function setup() {
    canvas = createCanvas(960, 540)
    pixelDensity(1)
    map = createGraphics(width, height)
    map.pixelDensity(1)
    canvas.parent('parent')
    Car.load()

    createButton('Export Map')
        .mousePressed(() => {
            document.getElementById('export-area').value = JSON.stringify({ lines, gates })
        })
        .parent('map')
    createButton('Import Map')
        .mousePressed(() => {
            data = JSON.parse(document.getElementById('export-area').value)
            lines = data.lines
            gates = data.gates
            car.setGates(gates)
            document.getElementById('export-area').value = ""
            updateMap()
        })
        .parent('map')
    let toggleGates = createCheckbox('Show Gates', false)
    toggleGates.changed(() => {
        gatesShown = toggleGates.checked()
    }).parent('controls')
    let toggleVision = createCheckbox('Show Vision', true)
    toggleVision.mousePressed(() => {
        visionOn = toggleVision.checked()
    }).parent('controls')
    let drawModeBtn = createButton('Draw Gates')
    drawModeBtn.mousePressed(() => {
        drawMode = !drawMode
        drawModeBtn.html(drawMode ? 'Draw Road' : 'Draw Gates')
        toggleGates.elt.children[0].checked = true
        gatesShown = true
    }).parent('controls')
    let toggleTraining = createButton('Start Training')
    toggleTraining.mousePressed(() => {
        if(trainingLoop) {
            trainingLoop = false
            toggleTraining.html('Start Training')
            httpPost('/stop-training')
        }
        else {
            trainingLoop = true
            toggleTraining.html('Stop Training')
            fetch('/start-training', {
                method: 'POST',
                body: JSON.stringify({ lines, gates }),
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(res => res.text())
            .then(res => {
                console.log(res)
                let id = setInterval(() => {
                    getTrainingReplay();
                    clearInterval(id);
                }, 500);
            })
        }
    }).parent('controls')
    let toggleControl = createButton('Automatic Control')
    toggleControl.mousePressed(() => {
        controlMode = !controlMode
        toggleControl.html(controlMode ? 'Automatic Control' : 'Manual Control')
    }).parent('controls')

    updateMap()
    frameRate(60)

    
}

function draw() {
    background(0, 160, 0)
    image(map, 0, 0)
    if(trainingLoop && replayIndex < replay.length) {
        let info = replay[replayIndex]
        car.setInfo(info)
        replayIndex++
        if(replayIndex == replay.length) {
            getTrainingReplay()
        }
    }
    car.draw(visionOn, gatesShown)
    drawEditor()
    drawCursor()
}

function getTrainingReplay() {
    httpGet('/training-replay', 'text', false, (data) => {
        if(data) {
            replay = JSON.parse(data)
            replayIndex = 0
        }
    })
}

function drawCursor() {
    updateCursor()
    strokeWeight(1)
    stroke(0)
    fill(255)
    triangle(cursorX, cursorY, cursorX - 6, cursorY + 16, cursorX + 6, cursorY + 16)
    noCursor()
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