import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { Socket } from 'socket.io';

import { User } from '../auth/entities';

interface ConnectedClients {
  [id: string]: { socket: Socket; user: User };
}

@Injectable()
export class MessagesWsService {
  private connectedClients: ConnectedClients = {};

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async registerClient(client: Socket, userId: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    let message: string;

    if (!user) {
      message = 'User not found';
      throw new Error(message);
    }

    if (!user.isActive) {
      message = 'User not active';
      throw new Error(message);
    }

    this.checkUserConnection(user);

    this.connectedClients[client.id] = { socket: client, user };
  }

  removeClient(clientId: string): void {
    delete this.connectedClients[clientId];
  }

  getConnectedClients(): string[] {
    return Object.keys(this.connectedClients);
  }

  getUserFullName(socketId: string): string {
    return this.connectedClients[socketId].user.fullName;
  }

  private checkUserConnection(user: User): void {
    for (const clientId of Object.keys(this.connectedClients)) {
      const connectedClient = this.connectedClients[clientId];

      if (connectedClient.user.id === user.id) {
        connectedClient.socket.disconnect();

        break;
      }
    }
  }
}
