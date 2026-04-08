import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../database/entities/payment-method.entity';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodsRepository: Repository<PaymentMethod>,
    private readonly logger: AppLogger,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto, merchantId?: string): Promise<PaymentMethod> {
    this.logger.debug(
      `Creating payment method for merchant ${merchantId || 'system-wide'}: ${createPaymentMethodDto.type}`,
      PaymentMethodsService.name,
    );

    if (createPaymentMethodDto.isDefault && merchantId) {
        await this.clearDefaultPaymentMethod(merchantId);
    }

    const paymentMethod = this.paymentMethodsRepository.create({
      ...createPaymentMethodDto,
      merchantId, // Associate with merchant if provided
    });
    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async findAll(merchantId: string): Promise<PaymentMethod[]> {
    this.logger.debug(`Finding all payment methods for merchant ${merchantId}`, PaymentMethodsService.name);
    return this.paymentMethodsRepository.find({
      where: { merchantId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, merchantId: string): Promise<PaymentMethod> {
    this.logger.debug(`Finding payment method ${id} for merchant ${merchantId}`, PaymentMethodsService.name);
    const paymentMethod = await this.paymentMethodsRepository.findOne({
      where: { id, merchantId, isActive: true },
    });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found for this merchant or is inactive`);
    }
    return paymentMethod;
  }

  async update(id: string, merchantId: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    this.logger.debug(`Updating payment method ${id} for merchant ${merchantId}`, PaymentMethodsService.name);
    const paymentMethod = await this.findOne(id, merchantId);

    if (updatePaymentMethodDto.isDefault && !paymentMethod.isDefault) {
        await this.clearDefaultPaymentMethod(merchantId);
    }

    Object.assign(paymentMethod, updatePaymentMethodDto);
    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async remove(id: string, merchantId: string): Promise<void> {
    this.logger.debug(`Removing payment method ${id} for merchant ${merchantId}`, PaymentMethodsService.name);
    const result = await this.paymentMethodsRepository.update(
      { id, merchantId },
      { isActive: false, isDefault: false }, // Soft delete and unset default
    );
    if (result.affected === 0) {
      throw new NotFoundException(`Payment method with ID ${id} not found for this merchant`);
    }
  }

  private async clearDefaultPaymentMethod(merchantId: string): Promise<void> {
    await this.paymentMethodsRepository.update(
        { merchantId, isDefault: true },
        { isDefault: false },
    );
  }
}