import threading

class TrainingThread(threading.Thread):
    def __init__(self, brain, cars):
        super().__init__()
        self._run_event = threading.Event()
        self.brain = brain
        self.cars = cars

    def setMap(self, mapObj):
        lines = [[[l['x1'], l['y1']], [l['x2'], l['y2']]] for l in mapObj["lines"]]
        gates = [[[g['x1'], g['y1']], [g['x2'], g['y2']]] for g in mapObj["gates"]]
        for car in self.cars:
            car.setLines(lines)
            car.setGates(gates)
    
    def pause(self):
        self._run_event.clear()

    def resume(self):
        self._run_event.set()
    
    def run(self):
        while True:
            self._run_event.wait()
            while self._run_event.is_set():
                if len(self.cars) == 1:
                    self.brain.train(self.cars[0])
                else:
                    self.brain.train()
