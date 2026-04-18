import { RoleService } from '../../src/modules/roles/role.service';
import { AppDataSource } from '../../src/data-source';
import { Role } from '../../src/entities/Role';
import { ConflictException, NotFoundException } from '../../src/middlewares/error.middleware';

describe('RoleService (Unit)', () => {
  let roleService: RoleService;
  let roleRepository;

  beforeAll(async () => {
    // We're using the actual AppDataSource, but will mock repository methods for unit tests
    // For true unit tests, you'd mock AppDataSource.getRepository completely.
    // This setup leans towards integration-lite to reuse the DB setup but focuses on service logic.
    await AppDataSource.initialize();
  });

  beforeEach(() => {
    roleService = new RoleService();
    roleRepository = AppDataSource.getRepository(Role);
    // Mock repository methods to control test data
    jest.spyOn(roleRepository, 'findOneBy').mockResolvedValue(null);
    jest.spyOn(roleRepository, 'find').mockResolvedValue([]);
    jest.spyOn(roleRepository, 'create').mockImplementation(data => data);
    jest.spyOn(roleRepository, 'save').mockImplementation(data => Promise.resolve({ id: 'mock-uuid', ...data }));
    jest.spyOn(roleRepository, 'remove').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const mockRoles = [{ id: '1', name: 'admin' }, { id: '2', name: 'editor' }] as Role[];
      (roleRepository.find as jest.Mock).mockResolvedValue(mockRoles);
      const roles = await roleService.getAllRoles();
      expect(roles).toEqual(mockRoles);
      expect(roleRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRoleById', () => {
    it('should return a role by ID', async () => {
      const mockRole = { id: 'mock-id', name: 'admin' } as Role;
      (roleRepository.findOneBy as jest.Mock).mockResolvedValue(mockRole);
      const role = await roleService.getRoleById('mock-id');
      expect(role).toEqual(mockRole);
      expect(roleRepository.findOneBy).toHaveBeenCalledWith({ id: 'mock-id' });
    });

    it('should throw NotFoundException if role not found', async () => {
      await expect(roleService.getRoleById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const createDto = { name: 'newRole', description: 'a new role' };
      const savedRole = await roleService.createRole(createDto);
      expect(savedRole).toEqual(expect.objectContaining({ name: 'newRole', description: 'a new role' }));
      expect(roleRepository.create).toHaveBeenCalledWith(createDto);
      expect(roleRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if role name already exists', async () => {
      (roleRepository.findOneBy as jest.Mock).mockResolvedValueOnce({ id: 'existing-id', name: 'existingRole' });
      const createDto = { name: 'existingRole', description: 'a new role' };
      await expect(roleService.createRole(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRole', () => {
    it('should update an existing role', async () => {
      const existingRole = { id: 'mock-id', name: 'oldName', description: 'old desc' } as Role;
      (roleRepository.findOneBy as jest.Mock).mockResolvedValue(existingRole);
      (roleRepository.save as jest.Mock).mockImplementation(data => Promise.resolve(data));

      const updateDto = { name: 'updatedName', description: 'updated desc' };
      const updatedRole = await roleService.updateRole('mock-id', updateDto);

      expect(updatedRole).toEqual(expect.objectContaining({ id: 'mock-id', name: 'updatedName', description: 'updated desc' }));
      expect(roleRepository.findOneBy).toHaveBeenCalledWith({ id: 'mock-id' });
      expect(roleRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if role to update not found', async () => {
      (roleRepository.findOneBy as jest.Mock).mockResolvedValue(null); // Ensure getRoleById throws
      const updateDto = { name: 'updatedName' };
      await expect(roleService.updateRole('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updated name already exists for another role', async () => {
      const existingRole = { id: 'mock-id-1', name: 'oldName' } as Role;
      const otherExistingRole = { id: 'mock-id-2', name: 'anotherName' } as Role;

      (roleRepository.findOneBy as jest.Mock)
        .mockResolvedValueOnce(existingRole) // For getRoleById('mock-id-1')
        .mockResolvedValueOnce(otherExistingRole); // For getRoleByName('anotherName')

      const updateDto = { name: 'anotherName' };
      await expect(roleService.updateRole('mock-id-1', updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      const existingRole = { id: 'mock-id', name: 'admin' } as Role;
      (roleRepository.findOneBy as jest.Mock).mockResolvedValue(existingRole);

      await roleService.deleteRole('mock-id');
      expect(roleRepository.remove).toHaveBeenCalledWith(existingRole);
    });

    it('should throw NotFoundException if role to delete not found', async () => {
      (roleRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(roleService.deleteRole('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});