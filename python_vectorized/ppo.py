import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.distributions import Categorical
from collections import deque
import time

num_inputs = 17
num_actions = 4

gamma = 0.99
lamda = 0.95 # lambda is reserved
lr = 0.0003
stackedCount = 4

batchescounter = 0

class Model(nn.Module):
    def __init__(self):
        super(Model, self).__init__()
        self.policy_net = nn.Sequential(
            nn.Linear(num_inputs*stackedCount, 32),
            nn.Tanh(),
            nn.Linear(32, num_actions),
            nn.Softmax(dim=1)
        )
        self.value_net = nn.Sequential(
            nn.Linear(num_inputs*stackedCount, 32),
            nn.Tanh(),
            nn.Linear(32, 1)
        )
    def forward():
        raise NotImplementedError

class Brain:
    def __init__(self, device_str='cpu'):
        self.device = torch.device(device_str)
        self.model = Model().to(self.device)
        self.model_old = Model().to(self.device)
        self.model_old.load_state_dict(self.model.state_dict())
        # self.optimizer = torch.optim.SGD(self.model.parameters(), lr=lr)
        self.optimizer = torch.optim.Adam([
                        {'params': self.model.policy_net.parameters(), 'lr': lr},
                        {'params': self.model.value_net.parameters(), 'lr': lr}
                    ])
        self.mse_loss = nn.MSELoss()
        self.horizon = 128
        self.minibatch = 32
        self.epochs = 10
        self.eps_clip = 0.2

        self.cachedRun = []
        self.currentRun = []
        self.iteration = 0

    # uses old policy
    def _get_action(self, state):
        with torch.no_grad():
            stateTensor = state.unsqueeze(0).to(self.device)
            actions = self.model_old.policy_net(stateTensor).detach().clone().cpu()[0]
            dist = Categorical(actions)
            action = dist.sample()
        return action.item(), dist.log_prob(action).item()

    
    def train(self, car):
        T = self.horizon
        rewards = torch.empty(T)
        old_states = torch.empty((T, num_inputs*stackedCount))
        new_states = torch.empty((T, num_inputs*stackedCount))
        old_actions = torch.empty(T)
        old_log_probs = torch.empty(T)
        advantages = torch.zeros(T)
        dones = torch.zeros(T)
        for i in range(T):
            old_states[i] = torch.from_numpy(car.getState())
            action, log_prob = self._get_action(old_states[i])
            r, done = car.step(action)
            new_state = car.getState()
            new_states[i] = torch.from_numpy(new_state)
            rewards[i] = r
            dones[i] = done
            old_actions[i] = action
            old_log_probs[i] = log_prob

            info = car.getInfo()
            info['vision'] = new_state[:car.rayCount].tolist()
            self.currentRun.append(info)
            if done:
                car.reset()
                self.cachedRun = self.currentRun
                self.currentRun = []

        old_states = old_states.to(self.device)
        new_states = new_states.to(self.device)

        value_old_states = self.model_old.value_net(old_states).detach().flatten().cpu()
        value_new_states = self.model_old.value_net(new_states).detach().flatten().cpu()
        delta = rewards + gamma * value_new_states * dones - value_old_states
        for t in reversed(range(T-1)):
            advantages[t] = delta[t] + gamma * lamda * advantages[t + 1] * dones[t]
        advantages[T-1] = delta[T-1]
        advantages = advantages.detach()
        # advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        value_target = advantages + value_old_states.detach()

        old_actions = old_actions.detach().to(self.device)
        old_log_probs = old_log_probs.detach().to(self.device)

        for k in range(self.epochs):
            action_probs = self.model.policy_net(old_states)
            state_values = self.model.value_net(old_states).flatten()

            dist = Categorical(action_probs)
            log_probs = dist.log_prob(old_actions)
            dist_entropy = dist.entropy()

            ratios = torch.exp(log_probs - old_log_probs)
            surr1 = ratios * advantages
            surr2 = torch.clamp(ratios, 1 - self.eps_clip, 1 + self.eps_clip) * advantages

            loss = -torch.min(surr1, surr2) + self.mse_loss(value_target, state_values) - 0.01*dist_entropy
            self.optimizer.zero_grad()
            loss.mean().backward()
            self.optimizer.step()
        
        self.model_old.load_state_dict(self.model.state_dict())

        if self.iteration % 10 == 0:
            print(f'Iteration: {self.iteration}')
            # print(self.model.policy_net[0].weight.data.numpy())
        self.iteration += 1
