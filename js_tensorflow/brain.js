const numInputs = 13
const numActions = 5

const gamma = 0.99
const lr = 0.001

const COLLIDE_REWARD = -1
const GATE_REWARD = 2
const PASS_REWARD = -.001


class Brain {
    constructor() {
        this.training = false
        this.epsilon = 0.9
        this.nn = tf.sequential()
        this.nn.add(tf.layers.dense({ units: 16, inputShape: [numInputs], activation: 'relu' }))
        //this.nn.add(tf.layers.dense({ units: 16, activation: 'relu' }))
        this.nn.add(tf.layers.dense({ units: numActions, activation: 'linear' }))
        this.nn.compile({ loss: 'meanSquaredError', optimizer: 'sgd' })//optimizer: tf.train.adam(lr) })
        this.terminated = false
        this.trainBufferX = []
        this.trainBufferY = []
        this.bufferLimit = 32
    }

    predict(inputs) {
        const X = tf.tensor2d([inputs], [1, numInputs])
        const y = this.nn.predict(X)
        const out = y.dataSync()
        return out
    }


    step(car, lines, drawEnabled, visionOn) {
        if(this.training) return

        /*let states = []
        for(let car of cars) {
            let state = car.getState(lines, visionOn)
            states.push
        }*/
        let state = car.getState(lines, visionOn)
        let Q = this.predict(state)
        let action = Math.random() < this.epsilon ? Math.floor(Math.random() * numActions) : argmax(Q)
        if(action == 0) car.forward()
        if(action == 1) car.backward()
        if(action == 2) car.left()
        if(action == 3) car.right()
        if(action == 4) void(0)

        let reward = 0
        let result = car.update(lines, drawEnabled)
        if(result == 'gate') {
            reward = GATE_REWARD
        }
        if(action == 4) reward = PASS_REWARD
        else if(result == 'collided') reward = COLLIDE_REWARD
        
        let Qp = this.predict(car.getState(lines, false))[0]
        let Q_max = max(Qp)
        let newQ = Q.slice(0)
        
        newQ[action] = this.terminated ? COLLIDE_REWARD : reward + gamma * Q_max

        //let X = tf.tensor2d([state], [1, numInputs])
        //let y = tf.tensor2d([newQ], [1, numActions])
        this.trainBufferX.push(state)
        this.trainBufferY.push(newQ)
        if(this.trainBufferX.length >= this.bufferLimit) {
            let X = tf.tensor2d(this.trainBufferX, [this.bufferLimit, numInputs])
            let y = tf.tensor2d(this.trainBufferY, [this.bufferLimit, numActions])
            this.training = true
            let self = this
            //console.time("training")
            this.nn.fit(X, y).then(() => { 
                // /console.timeEnd("training")
                self.training = false 
            })
            this.trainBufferX = []
            this.trainBufferY = []
        }
        
        this.epsilon = Math.max(.9999995 * this.epsilon, .1)

        if(this.terminated) {
            car.reset()
            this.terminated = false
        }
        else if(result == 'collided') {
            this.terminated = true
        }
    }

    
}