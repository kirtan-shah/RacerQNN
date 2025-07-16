import numpy as np
from utils import *
from collections import deque
import time
import math

COLLIDE_REWARD = -2
GATE_REWARD = 1
PASS_REWARD = -.001

class Car:
    def __init__(self, x, y, width, height, rayCount=16, rayLength=200, maxSpeed=2):
        self.x = x
        self.y = y
        self.xI = x
        self.yI = y
        self.vx = 0
        self.vy = 0
        self.speed = 0
        self.maxSpeed = maxSpeed
        self.width = width
        self.height = height
        self.direction = 0
        self.rayCount = rayCount
        self.rayLength = rayLength
        self.lines = []
        self.gates = []
        self.gatesPassed = []
        self.numGatesPassed = 0
        self.lock = -1
        self.collide_threshold_sq = max(self.width, self.height)**2
        self.stackedStates = deque()
        self.stackedCount = 4
    
    def getInfo(self):
        return { 
            'x': self.x,
            'y': self.y,
            'direction': self.direction,
            'gatesPassed': self.gatesPassed.copy()
        }

    def reset(self):
        self.x = self.xI + np.random.uniform(-10, 10)
        self.y = self.yI + np.random.uniform(-10, 10)
        self.direction = 0
        self.gatesPassed = [False] * len(self.gates)
        self.lock = -1

    def setLines(self, lines):
        self.lines = np.array(lines)
    
    def setGates(self, gates):
        self.gates = np.array(gates)
        self.gatesPassed = [False] * len(gates)
    
    # lines is numpy array
    def getState(self):
        numLines = len(self.lines)
        rayCount = self.rayCount
        rayLength = self.rayLength
        maxSpeed = self.maxSpeed
        # each ray repeated numLines times
        origin = np.full((rayCount*numLines, 2), [self.x, self.y])
        theta = np.linspace(0, 2*np.pi, rayCount, endpoint=False)
        ray_dirs = np.array([np.cos(theta + self.direction), np.sin(theta + self.direction)]).T # rayCount x 2
        ray_dirs = np.repeat(ray_dirs, numLines, axis=0) # rayCount*numLines x 2
        p1 = np.tile(np.take(self.lines, 0, 1), (rayCount, 1))
        p2 = np.tile(np.take(self.lines, 1, 1), (rayCount, 1))
        # calculate dist to each line
        dists = ray_lineseg_intersection(origin, ray_dirs, p1, p2)
        dists = dists.reshape((rayCount, numLines))
        minI = np.argmin(dists, axis=1)
        minD = np.take_along_axis(dists, minI[None].T, 1).flatten()
        minD = np.where(minD > rayLength, rayLength, minD)
        vision = minD / rayLength
        feat = [self.speed/maxSpeed]
        combined = np.append(vision, feat)
        if len(self.stackedStates) == 0:
            for _ in range(self.stackedCount):
                self.stackedStates.append(combined)
        else:
            self.stackedStates.popleft()
            self.stackedStates.append(combined)
        return np.concatenate(self.stackedStates)
    
    def step(self, action):
        if action == 0:
            self.speed = min(self.speed + 0.2, self.maxSpeed)
        elif action == 1:
            self.speed = max(self.speed - 0.2, -self.maxSpeed/2)
        if action == 2:
            self.direction -= 0.04
        elif action == 3:
            self.direction += 0.04
        evt = self.update()
        reward = 0
        terminated = False
        if evt == 'collided':
            reward = COLLIDE_REWARD
            terminated = True
        elif evt == 'allgates':
            reward = GATE_REWARD
            terminated = True
        elif evt == 'gate':
            reward = GATE_REWARD
        else:
            reward = 0 # np.mean(self.getState()[:-1]) * .1
        return reward, terminated

    
    def update(self):
        c = np.cos(self.direction)
        s = np.sin(self.direction)
        self.vx = self.speed * c
        self.vy = self.speed * s
        self.x += self.vx
        self.y += self.vy
        self.speed *= 0.99

        numCarPoints = 4
        carPoints = np.array([[-self.width/2, self.height/2], 
                        [self.width/2, self.height/2],
                        [self.width/2, -self.height/2],
                        [-self.width/2, -self.height/2]])        
        rot = np.array([[c, s], [-s, c]])
        carPoints = np.matmul(carPoints, rot)
        carPoints += np.array([self.x, self.y])

        numLines = len(self.lines)
        centers = np.full((numLines, 2), [self.x, self.y])
        p1 = np.take(self.lines, 0, 1)
        p2 = np.take(self.lines, 1, 1)
        dists = min_distance_sq(centers, p1, p2)
        lines = self.lines[dists < self.collide_threshold_sq]
        numLines = len(lines)

        if numLines > 0:
            carPointsRep = np.repeat(carPoints, numLines, axis=0)
            carPointsRepShifted = np.roll(carPointsRep, numLines, axis=0)
            p1 = np.tile(np.take(lines, 0, 1), (numCarPoints, 1))
            p2 = np.tile(np.take(lines, 1, 1), (numCarPoints, 1))

            lineIntersections = linesegs_intersect(carPointsRep, carPointsRepShifted, p1, p2)
            if np.any(lineIntersections):
                return 'collided'

        numGates = len(self.gates)
        carPointsRep = np.repeat(carPoints, numGates, axis=0)
        carPointsRepShifted = np.roll(carPointsRep, numGates, axis=0)
        newGatePassed = False
        for j in range(len(self.gates)):
            if self.lock == j:
                continue
            g = self.gates[j]
            p1 = g[0][np.newaxis]
            p2 = g[1][np.newaxis]
            if not self.gatesPassed[j] and np.any(linesegs_intersect(carPointsRep, carPointsRepShifted, p1, p2)):
                self.gatesPassed[j] = True
                newGatePassed = True
                self.lock = j
                self.numGatesPassed += 1
                if all(self.gatesPassed):
                    self.gatesPassed = [False] * len(self.gates)
                    return 'allgates'
        if newGatePassed:
            return 'gate'
        return 'none'

