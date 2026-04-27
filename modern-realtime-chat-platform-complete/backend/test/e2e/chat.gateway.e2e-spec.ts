import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/users/user.entity';
import { Room } from '../../src/chat/room.entity';
import { Message } from '../../src/chat/message.entity';
import { RoomMember } from '../../src/chat/room-member.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import configuration from '../../src/config/configuration';
import * as Joi from 'joi';
import { typeOrmConfigAsync } from '../../src/database/typeorm-config';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { ChatModule } from '../../src/chat/chat.module';
import { RoomType } from '../../src/chat/room.entity';
import { WinstonLoggerModule } from '../../src/common/logger/winston-logger.module';
import { ThrottlerModule } from '@nestjs/throttler';

// --- Test Setup Helpers ---
async function setupTestEnvironmentForE2E() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [configuration],
        validationSchema: Joi.object({
          NODE_ENV: Joi.string().valid('development', 'production', 'test').default('test'),
          PORT: Joi.number().default(3000),
          DATABASE_URL: Joi.string().required(),
          JWT_SECRET: Joi.string().required(),
          JWT_EXPIRES_IN: Joi.string().default('1h'),
          REDIS_HOST: Joi.string().required(),
          REDIS_PORT: Joi.number().default(6379),
          SESSION_SECRET: Joi.string().required(),
          FRONTEND_URL: Joi.string().required(),
        }),
        envFilePath: '.env.test', // Use a dedicated test .env file
      }),
      TypeOrmModule.forRootAsync(typeOrmConfigAsync),
      ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), // Disable/increase throttling for tests
      WinstonLoggerModule,
      AuthModule,
      UsersModule,
      ChatModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.listen(0); // Use a random available port for E2E tests
  const server = app.getHttpServer();
  const port = server.address().port;

  return { moduleFixture, app, port };
}

describe('ChatGateway (e2e)', () => {
  let app: INestApplication;
  let port: number;
  let userRepository: Repository<User>;
  let roomRepository: Repository<Room>;
  let messageRepository: Repository<Message>;
  let roomMemberRepository: Repository<RoomMember>;
  let jwtService: JwtService;
  let configService: ConfigService;

  let testUser1: User;
  let testUser2: User;
  let user1Token: string;
  let user2Token: string;
  let publicRoom: Room;
  let privateRoom: Room;

  const userPassword = 'password123';

  beforeAll(async () => {
    const { app: testingApp, port: testingPort } = await setupTestEnvironmentForE2E();
    app = testingApp;
    port = testingPort;

    userRepository = app.get(getRepositoryToken(User));
    roomRepository = app.get(getRepositoryToken(Room));
    messageRepository = app.get(getRepositoryToken(Message));
    roomMemberRepository = app.get(getRepositoryToken(RoomMember));
    jwtService = app.get(JwtService);
    configService = app.get(ConfigService);

    await app.init(); // Initialize the NestJS application
  });

  beforeEach(async () => {
    // Clear and seed test database for each test
    await roomMemberRepository.clear();
    await messageRepository.clear();
    await roomRepository.clear();
    await userRepository.clear();

    const hashedPassword = await bcrypt.hash(userPassword, 10);
    testUser1 = await userRepository.save({
      username: 'wsuser1',
      email: 'wsuser1@example.com',
      password: hashedPassword,
      avatar: 'avatar1.png',
    });
    testUser2 = await userRepository.save({
      username: 'wsuser2',
      email: 'wsuser2@example.com',
      password: hashedPassword,
      avatar: 'avatar2.png',
    });

    user1Token = jwtService.sign({ username: testUser1.username, sub: testUser1.id }, { secret: configService.get('JWT_SECRET') });
    user2Token = jwtService.sign({ username: testUser2.username, sub: testUser2.id }, { secret: configService.get('JWT_SECRET') });

    publicRoom = await roomRepository.save({ name: 'E2E Public Chat', type: RoomType.PUBLIC, creator: testUser1 });
    privateRoom = await roomRepository.save({ name: 'E2E Private Chat', type: RoomType.PRIVATE, creator: testUser2 });

    await roomMemberRepository.save([
      { room: publicRoom, user: testUser1 },
      { room: publicRoom, user: testUser2 },
      { room: privateRoom, user: testUser2 },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  const connectSocket = (token: string): Socket => {
    return io(`http://localhost:${port}/chat`, {
      transports: ['websocket'],
      auth: { token },
    });
  };

  describe('Connection and Authentication', () => {
    it('should connect successfully with a valid token', (done) => {
      const client = connectSocket(user1Token);
      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        done();
      });
      client.on('connect_error', (err) => done(err));
    });

    it('should fail to connect with an invalid token', (done) => {
      const client = connectSocket('invalid.token.here');
      client.on('connect_error', (err) => {
        expect(err.message).toContain('Unauthorized');
        client.disconnect();
        done();
      });
      client.on('connect', () => done(new Error('Should not have connected')));
    });

    it('should emit userStatus on connect and disconnect', (done) => {
      const client = connectSocket(user1Token);
      let connectEmitted = false;

      client.on('connect', () => {
        client.emit('test_event'); // Send a dummy event to trigger 'userStatus' from gateway if it's async
        connectEmitted = true;
      });

      client.on('userStatus', (status) => {
        if (connectEmitted && status.userId === testUser1.id && status.status === 'online') {
          expect(status).toEqual({ userId: testUser1.id, status: 'online' });
          client.disconnect();
        } else if (status.userId === testUser1.id && status.status === 'offline') {
          expect(status).toEqual({ userId: testUser1.id, status: 'offline' });
          done(); // Done when offline status is received
        }
      });
    });
  });

  describe('sendMessage', () => {
    let client1: Socket;
    let client2: Socket;

    beforeEach((done) => {
      client1 = connectSocket(user1Token);
      client2 = connectSocket(user2Token);

      let connectedCount = 0;
      const onConnect = () => {
        connectedCount++;
        if (connectedCount === 2) done();
      };
      client1.on('connect', onConnect);
      client2.on('connect', onConnect);
      client1.on('connect_error', done);
      client2.on('connect_error', done);
    });

    afterEach(() => {
      client1.disconnect();
      client2.disconnect();
    });

    it('should send a message to all clients in a room', (done) => {
      const messageContent = 'Hello from user1!';
      let messageReceived = false;

      client2.on('newMessage', (message) => {
        expect(message).toEqual(
          expect.objectContaining({
            content: messageContent,
            roomId: publicRoom.id,
            sender: expect.objectContaining({
              id: testUser1.id,
              username: testUser1.username,
            }),
          }),
        );
        messageReceived = true;
      });

      // Give some time for client2 to register the listener
      setTimeout(() => {
        client1.emit('sendMessage', { roomId: publicRoom.id, content: messageContent }, (ack: any) => {
          expect(ack.event).toBe('messageSent');
          expect(ack.data.success).toBe(true);
          expect(ack.data.messageId).toBeDefined();

          // Verify message was saved to DB
          messageRepository.findOne({ where: { id: ack.data.messageId }, relations: ['sender'] })
            .then(savedMessage => {
              expect(savedMessage).toBeDefined();
              expect(savedMessage?.content).toBe(messageContent);
              expect(savedMessage?.sender.id).toBe(testUser1.id);
              expect(messageReceived).toBe(true);
              done();
            })
            .catch(done);
        });
      }, 100);
    });

    it('should not send a message if user is not a member of the room', (done) => {
      const messageContent = 'Attempting to send to a private room without being a member';

      // user1 is not a member of privateRoom
      client1.emit('sendMessage', { roomId: privateRoom.id, content: messageContent }, (ack: any) => {
        expect(ack.event).toBe('exception');
        expect(ack.data.message).toContain('You are not a member of this room.');
        done();
      });
    });
  });

  describe('createRoom', () => {
    let client: Socket;
    beforeEach((done) => {
      client = connectSocket(user1Token);
      client.on('connect', done);
      client.on('connect_error', done);
    });
    afterEach(() => client.disconnect());

    it('should create a new room and notify the creator', (done) => {
      const newRoomName = 'New Test Room';
      const newRoomType = RoomType.PUBLIC;

      client.on('roomCreated', (room: Room) => {
        expect(room.name).toBe(newRoomName);
        expect(room.type).toBe(newRoomType);
        expect(room.creator.id).toBe(testUser1.id);
        roomRepository.findOne({ where: { id: room.id } }).then(savedRoom => {
          expect(savedRoom).toBeDefined();
          done();
        }).catch(done);
      });

      client.emit('createRoom', { name: newRoomName, type: newRoomType }, (ack: any) => {
        expect(ack.event).toBe('roomCreated');
        expect(ack.data.success).toBe(true);
        expect(ack.data.roomId).toBeDefined();
      });
    });
  });

  describe('joinRoom', () => {
    let client1: Socket;
    let client2: Socket;

    beforeEach((done) => {
      client1 = connectSocket(user1Token);
      client2 = connectSocket(user2Token);

      let connectedCount = 0;
      const onConnect = () => {
        connectedCount++;
        if (connectedCount === 2) done();
      };
      client1.on('connect', onConnect);
      client2.on('connect', onConnect);
      client1.on('connect_error', done);
      client2.on('connect_error', done);
    });

    afterEach(() => {
      client1.disconnect();
      client2.disconnect();
    });

    it('should allow a user to join a room and notify existing members', (done) => {
      // user1 is already in publicRoom, user2 is not in privateRoom initially
      // user1 will join privateRoom
      const joinRoomId = privateRoom.id;

      client2.on('userJoinedRoom', (data) => {
        expect(data.roomId).toBe(joinRoomId);
        expect(data.userId).toBe(testUser1.id);
        expect(data.username).toBe(testUser1.username);
        roomMemberRepository.findOne({ where: { room: { id: joinRoomId }, user: { id: testUser1.id } } })
          .then(member => {
            expect(member).toBeDefined();
            done();
          })
          .catch(done);
      });

      setTimeout(() => { // Give client2 listener time
        client1.emit('joinRoom', { roomId: joinRoomId }, (ack: any) => {
          expect(ack.event).toBe('roomJoined');
          expect(ack.data.success).toBe(true);
        });
      }, 100);
    });

    it('should not allow a user to join a room they are already in', (done) => {
      client1.emit('joinRoom', { roomId: publicRoom.id }, (ack: any) => {
        expect(ack.event).toBe('exception');
        expect(ack.data.message).toContain('User is already a member of this room');
        done();
      });
    });
  });

  describe('getRoomMessages', () => {
    let client: Socket;
    beforeEach((done) => {
      client = connectSocket(user1Token);
      client.on('connect', done);
      client.on('connect_error', done);
    });
    afterEach(() => client.disconnect());

    it('should retrieve messages for a room', (done) => {
      // Add some messages to the public room
      messageRepository.save([
        { sender: testUser1, room: publicRoom, content: 'Test message 1' },
        { sender: testUser2, room: publicRoom, content: 'Test message 2' },
        { sender: testUser1, room: publicRoom, content: 'Test message 3' },
      ]).then(() => {
        client.emit('getRoomMessages', { roomId: publicRoom.id, limit: 10, offset: 0 }, (ack: any) => {
          expect(ack.event).toBe('roomMessages');
          expect(ack.data.roomId).toBe(publicRoom.id);
          expect(ack.data.messages).toHaveLength(3);
          expect(ack.data.messages[0].content).toBe('Test message 1'); // Should be oldest first after reverse() in frontend
          expect(ack.data.messages[2].content).toBe('Test message 3'); // Newest last
          done();
        });
      }).catch(done);
    });

    it('should not retrieve messages if user is not a member', (done) => {
      // user1 is not a member of privateRoom
      client.emit('getRoomMessages', { roomId: privateRoom.id }, (ack: any) => {
        expect(ack.event).toBe('exception');
        expect(ack.data.message).toContain('You are not authorized to view messages in this room.');
        done();
      });
    });
  });

  describe('typing indicator', () => {
    let client1: Socket;
    let client2: Socket;

    beforeEach((done) => {
      client1 = connectSocket(user1Token);
      client2 = connectSocket(user2Token);

      let connectedCount = 0;
      const onConnect = () => {
        connectedCount++;
        if (connectedCount === 2) done();
      };
      client1.on('connect', onConnect);
      client2.on('connect', onConnect);
      client1.on('connect_error', done);
      client2.on('connect_error', done);
    });

    afterEach(() => {
      client1.disconnect();
      client2.disconnect();
    });

    it('should emit typing event to other clients in the room', (done) => {
      client2.on('typing', (data) => {
        expect(data).toEqual({ roomId: publicRoom.id, userId: testUser1.id, username: testUser1.username });
        done();
      });

      setTimeout(() => { // Give listener time
        client1.emit('typing', { roomId: publicRoom.id });
      }, 100);
    });
  });
});