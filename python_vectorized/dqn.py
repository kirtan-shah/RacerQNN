import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim

num_inputs = 17
num_actions = 5

gamma = 0.99
lr = 0.001

batchescounter = 0

class Brain:
    def __init__(self, device_str='cpu'):
        self.epsilon = 0.9
        self.device = torch.device(device_str)
        self.model = nn.Sequential(
            nn.Linear(num_inputs, 16),
            nn.Tanh(),
            nn.Linear(16, num_actions)
        ).to(self.device)
        self.optimizer = optim.SGD(self.model.parameters(), lr=lr)
        self.criterion = nn.MSELoss()
        self.bufferLimit = 32
        self.trainBufferX = torch.empty((self.bufferLimit, num_inputs))
        self.trainBufferY = torch.empty((self.bufferLimit, num_actions))
        self.bufferIndex = 0
        self.cachedRun = []
        self.currentRun = []
    
    def getQ(self, state):
        stateTensor = torch.from_numpy(state).unsqueeze(0).float().to(self.device)
        Q = self.model(stateTensor).detach().clone().cpu().numpy()[0]
        return Q
    
    def train(self, car):
        state = car.getState() # np array
        Q = self.getQ(state)
        action = np.random.choice(num_actions) if np.random.random() < self.epsilon else np.argmax(Q)
        
        info = car.getInfo()
        info['vision'] = state[:car.rayCount].tolist()
        self.currentRun.append(info)

        reward, terminated = car.step(action)
        Qp = self.getQ(car.getState())
        Qmax = np.max(Qp)
        newQ = Q.copy()

        newQ[action] = reward if terminated else reward + gamma * Qmax
        self.trainBufferX[self.bufferIndex] = torch.from_numpy(state)
        self.trainBufferY[self.bufferIndex] = torch.from_numpy(newQ)
        self.bufferIndex += 1
        if self.bufferIndex >= self.bufferLimit:
            self.optimizer.zero_grad()
            Qguess = self.model(self.trainBufferX.to(self.device))
            loss = self.criterion(Qguess, self.trainBufferY.to(self.device))
            loss.backward()
            self.optimizer.step()
            self.bufferIndex = 0
            global batchescounter
            batchescounter += 1
            if batchescounter % 100 == 0:
                print(f'Batches trained: {batchescounter}, epsilon: {self.epsilon}')
        
        self.epsilon = max(.9999995 * self.epsilon, .1)
        if terminated:
            car.reset()
            self.cachedRun = self.currentRun
            self.currentRun = []

        