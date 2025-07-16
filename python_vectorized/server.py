from flask import Flask, render_template, request
from training_loop import TrainingThread
import json

from ppo import Brain
from car import Car

app = Flask(__name__)
brain = Brain(device_str='cpu')
# cars = brain.init_processes(8, lambda: Car(300, 100, 40, 20))

train_thread = TrainingThread(brain, [Car(300, 100, 40, 20)])
train_thread.start()
train_thread.pause()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/start-training', methods=['POST'])
def start_training():
    map = request.get_json(force=True)
    global train_thread
    train_thread.setMap(map)
    train_thread.resume()
    return 'Training started'

@app.route('/stop-training', methods=['POST'])
def stop_training():
    global train_thread
    train_thread.pause()
    return 'Training paused'

@app.route('/training-replay', methods=['GET'])
def get_training_replay():
    global train_thread
    if not brain.cachedRun:
        return ""
    else:
        return json.dumps(brain.cachedRun)