import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../database/entities/merchant.entity';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { AppLogger } from '../common/logger/logger.service';
import { generateApiKeys } from '../common/utils/api-key.generator';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    private readonly logger: AppLogger,
  ) {}

  async create(createMerchantDto: CreateMerchantDto): Promise<Merchant> {
    this.logger.debug(`Creating merchant: ${createMerchantDto.name}`, MerchantsService.name);
    const existingMerchant = await this.merchantsRepository.findOneBy({ name: createMerchantDto.name });
    if (existingMerchant) {
      throw new BadRequestException('Merchant with this name already exists');
    }

    const { apiKey, apiSecret } = generateApiKeys();

    const merchant = this.merchantsRepository.create({
      ...createMerchantDto,
      apiKey,
      apiSecret,
    });
    return this.merchantsRepository.save(merchant);
  }

  async findAll(): Promise<Merchant[]> {
    this.logger.debug('Finding all merchants', MerchantsService.name);
    return this.merchantsRepository.find();
  }

  async findOne(id: string): Promise<Merchant> {
    this.logger.debug(`Finding merchant by ID: ${id}`, MerchantsService.name);
    const merchant = await this.merchantsRepository.findOneBy({ id });
    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }
    return merchant;
  }

  async findByApiKey(apiKey: string): Promise<Merchant> {
    this.logger.debug(`Finding merchant by API key`, MerchantsService.name);
    const merchant = await this.merchantsRepository.findOneBy({ apiKey });
    if (!merchant) {
      throw new NotFoundException(`Merchant with API Key not found`);
    }
    return merchant;
  }

  async update(id: string, updateMerchantDto: UpdateMerchantDto): Promise<Merchant> {
    this.logger.debug(`Updating merchant ${id}`, MerchantsService.name);
    const merchant = await this.findOne(id);
    Object.assign(merchant, updateMerchantDto);
    return this.merchantsRepository.save(merchant);
  }

  async remove(id: string): Promise<void> {
    this.logger.debug(`Removing merchant ${id}`, MerchantsService.name);
    const result = await this.merchantsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }
  }

  async regenerateApiKeys(id: string): Promise<{ apiKey: string; apiSecret: string }> {
    this.logger.debug(`Regenerating API keys for merchant ${id}`, MerchantsService.name);
    const merchant = await this.findOne(id);
    const { apiKey, apiSecret } = generateApiKeys();
    merchant.apiKey = apiKey;
    merchant.apiSecret = apiSecret;
    await this.merchantsRepository.save(merchant);
    return { apiKey, apiSecret };
  }
}