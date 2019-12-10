import numpy as np
import tensorflow as tf
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
import random
import pygame

frameTime = 500
pygame.init()
width = 960
height = 540
win = pygame.display.set_mode((width, height))

pos = (0, 0) # center of car

epsilon = .9
gamma = .9
lr = .1

#inputs: 
#outputs:
"""
nn = tf.keras.Sequential()
nn.add(Dense(16, input_dim=2, activation='relu'))
nn.add(Dense(16, activation='relu'))
nn.add(Dense(4, activation='linear'))
nn.compile(loss='mse', optimizer=Adam(lr=lr))
"""

def preprocess(pos):
    x = pos[0] / width
    y = pos[1] / height
    return np.array([[x, y]])

def drawCar():
    

while True:
    pygame.time.delay(int(frameTime))
    win.fill((0, 0, 0))
    for event in pygame.event.get():
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                pygame.quit()
            elif event.key == pygame.K_LEFT:
                frameTime /= 2
                print(frameTime)
            elif event.key == pygame.K_RIGHT:
                frameTime *= 2
                print(frameTime)
            elif event.key == pygame.K_1:
                epsilon = 0
            elif event.key == pygame.K_2:
                epsilon = .8
            elif event.key == pygame.K_e:
                print(f'Epsilon: {epsilon}')
            elif event.key == pygame.K_q:
                print(Q)

    action = 0
    X = preprocess(pos)
    Q = nn.predict(X)[0]
    actions = []
    if int(pos / gridSize) > 0:
        actions.append(0)
    if int(pos / gridSize) < gridSize - 1:
        actions.append(1)
    if pos % gridSize > 0:
        actions.append(2)
    if pos % gridSize < gridSize - 1:
        actions.append(3)
    if random.random() < epsilon:
        action = random.choice(actions) # up, down, left, right
    else:
        aMax = actions[0]
        for a in actions:
            if Q[a] > Q[aMax]:
                aMax = a
        action = aMax

    newPos = pos
    reward = -.1 # cost of moving
    if action == 0 and int(pos / gridSize) > 0:
        newPos -= gridSize
    elif action == 1 and int(pos / gridSize) < gridSize - 1:
        newPos += gridSize
    elif action == 2 and (pos % gridSize) > 0:
        newPos -= 1
    elif action == 3 and (pos % gridSize) < gridSize - 1:
        newPos += 1
    if newPos == end:
        reward = 10
    
    #Q[pos, action] = Q[pos, action] + lr * (reward + gamma * np.max(Q[newPos, :]) - Q[pos, action])
    new_X = preprocess(newPos)
    new_Q = nn.predict(new_X)
    Q_max = np.max(new_Q)
    Q_p = Q
    Q_p[action] = reward + gamma * Q_max
    nn.fit(X, np.array([Q_p]), verbose=0)
    epsilon *= .99995

    pygame.draw.rect(win, (255, 255, 0), (blockSize * (pos % gridSize), blockSize * int(pos / gridSize), blockSize, blockSize))
    pygame.display.update()

    if newPos == end:
        pygame.time.delay(int(frameTime))
        win.fill((0, 0, 0))
        pygame.draw.rect(win, (0, 255, 0), (blockSize * (newPos % gridSize), blockSize * int(newPos / gridSize), blockSize, blockSize))
        pygame.display.update()
        pos = random.randint(0, gridSize**2 - 2)
    else:
        pos = newPos

