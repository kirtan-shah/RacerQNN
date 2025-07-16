import numpy as np

class Brain:
    def __init__(self):
        self.currentRun = []
        self.cachedRun = []

    def train(self, car):
        state = car.getState()
        rv = state[1:6]
        lv = state[7:12]
        speed = state[12]
        diff = np.min(rv) - np.min(lv)
        if speed < 0.5 or np.abs(diff) < 0.05:
            action = 0
        elif diff > 0:
            action = 3 if np.random.random() < .4 else 4
        else:
            action = 2 if np.random.random() < .4 else 4
        reward, terminated = car.step(action)

        info = car.getInfo()
        info['vision'] = state[:car.rayCount].tolist()
        self.currentRun.append(info)
        if terminated:
            car.reset()
            self.cachedRun = self.currentRun
            self.currentRun = []

