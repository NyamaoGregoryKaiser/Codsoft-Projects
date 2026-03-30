```typescript
import { hashPassword, comparePassword } from "../../../src/services/hashing.service";

describe("Hashing Service", () => {
  const plainPassword = "mySecretPassword123";

  it("should hash a password correctly", async () => {
    const hashedPassword = await hashPassword(plainPassword);
    expect(hashedPassword).toBeDefined();
    expect(typeof hashedPassword).toBe("string");
    expect(hashedPassword).not.toEqual(plainPassword); // Hashed password should not be plain text
    expect(hashedPassword.length).toBeGreaterThan(60); // Typical bcrypt hash length
  });

  it("should return true for a correct password", async () => {
    const hashedPassword = await hashPassword(plainPassword);
    const isMatch = await comparePassword(plainPassword, hashedPassword);
    expect(isMatch).toBe(true);
  });

  it("should return false for an incorrect password", async () => {
    const hashedPassword = await hashPassword(plainPassword);
    const isMatch = await comparePassword("wrongPassword", hashedPassword);
    expect(isMatch).toBe(false);
  });

  it("should throw an error for empty password during hashing", async () => {
    await expect(hashPassword("")).rejects.toThrow("Password cannot be empty");
  });
});
```