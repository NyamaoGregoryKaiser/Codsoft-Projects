```typescript
import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/database/data-source";
import { User, UserRole } from "../../src/entities/User";
import { Merchant } from "../../src/entities/Merchant";
import { hashPassword } from "../../src/services/hashing.service";
import logger from "../../src/config/logger";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from 'uuid';

describe("Auth Integration Tests", () => {
  let userRepository: Repository<User>;
  let merchantRepository: Repository<Merchant>;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    userRepository = AppDataSource.getRepository(User);
    merchantRepository = AppDataSource.getRepository(Merchant);
  });

  beforeEach(async () => {
    // Clear relevant tables before each test
    await merchantRepository.delete({});
    await userRepository.delete({});
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new merchant user successfully", async () => {
      const userData = {
        email: "newmerchant@example.com",
        password: "securePassword123",
        role: UserRole.MERCHANT,
      };

      const res = await request(app).post("/api/v1/auth/register").send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual("User registered successfully");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toEqual(userData.email);
      expect(res.body.user.role).toEqual(userData.role);

      const userInDb = await userRepository.findOneBy({ email: userData.email });
      expect(userInDb).toBeDefined();
      expect(userInDb?.email).toEqual(userData.email);
      expect(await userInDb?.comparePassword(userData.password)).toBe(true);
    });

    it("should register a new admin user successfully", async () => {
      const userData = {
        email: "newadmin@example.com",
        password: "securePassword123",
        role: UserRole.ADMIN,
      };

      const res = await request(app).post("/api/v1/auth/register").send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.user.role).toEqual(UserRole.ADMIN);
    });

    it("should return 400 if email already exists", async () => {
      const hashedPassword = await hashPassword("existingPassword");
      await userRepository.save(userRepository.create({
        email: "existing@example.com",
        password: hashedPassword,
        role: UserRole.MERCHANT,
      }));

      const userData = {
        email: "existing@example.com",
        password: "newPassword",
        role: UserRole.MERCHANT,
      };

      const res = await request(app).post("/api/v1/auth/register").send(userData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual("User with this email already exists");
    });

    it("should return 400 for invalid email format", async () => {
      const userData = {
        email: "invalid-email",
        password: "securePassword123",
        role: UserRole.MERCHANT,
      };
      const res = await request(app).post("/api/v1/auth/register").send(userData);
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('"email" must be a valid email');
    });
  });

  describe("POST /api/v1/auth/login", () => {
    let testUser: User;
    let testMerchant: Merchant;
    const userPassword = "loginPassword123";

    beforeEach(async () => {
      const hashedPassword = await hashPassword(userPassword);
      testUser = await userRepository.save(userRepository.create({
        email: "loginuser@example.com",
        password: hashedPassword,
        role: UserRole.MERCHANT,
      }));
      testMerchant = await merchantRepository.save(merchantRepository.create({
        name: "Test Merchant",
        apiKey: uuidv4(),
        ownerUser: testUser,
      }));
      testUser.merchant = testMerchant;
      await userRepository.save(testUser);
    });

    it("should log in a user and return a token", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: userPassword,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual("Logged in successfully");
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.id).toEqual(testUser.id);
      expect(res.body.user.email).toEqual(testUser.email);
      expect(res.body.user.role).toEqual(testUser.role);
    });

    it("should return 401 for invalid credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: "wrongPassword",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual("Invalid credentials");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    let testUser: User;
    let testMerchant: Merchant;
    let token: string;
    const userPassword = "mePassword123";

    beforeEach(async () => {
      const hashedPassword = await hashPassword(userPassword);
      testUser = await userRepository.save(userRepository.create({
        email: "meuser@example.com",
        password: hashedPassword,
        role: UserRole.MERCHANT,
      }));
      testMerchant = await merchantRepository.save(merchantRepository.create({
        name: "Me Test Merchant",
        apiKey: uuidv4(),
        ownerUser: testUser,
      }));
      testUser.merchant = testMerchant;
      await userRepository.save(testUser);

      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: userPassword,
      });
      token = loginRes.body.token;
    });

    it("should return the authenticated user's profile", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.id).toEqual(testUser.id);
      expect(res.body.user.email).toEqual(testUser.email);
      expect(res.body.user.role).toEqual(testUser.role);
      expect(res.body.user.merchantId).toEqual(testMerchant.id);
    });

    it("should return 401 if no token is provided", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual("No token provided");
    });

    it("should return 401 if token is invalid", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer invalidtoken`);
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual("Invalid token");
    });
  });
});
```