import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from '../database/entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AppLogger } from '../common/logger/logger.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WebhookEventType } from '../database/entities/webhook-subscription.entity';
import { UserRole } from '../database/entities/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly webhooksService: WebhooksService,
    private readonly dataSource: DataSource, // Inject DataSource for transactions
    private readonly logger: AppLogger,
  ) {}

  async createCharge(
    createTransactionDto: CreateTransactionDto,
    merchantId: string,
    processedById: string,
  ): Promise<Transaction> {
    this.logger.debug(`Initiating charge for merchant ${merchantId}`, TransactionsService.name);

    let paymentMethod;
    if (createTransactionDto.paymentMethodId) {
      paymentMethod = await this.paymentMethodsService.findOne(
        createTransactionDto.paymentMethodId,
        merchantId,
      );
    } else {
        // In a real system, you might allow a direct card entry for one-time payments
        // For simplicity, we require an existing paymentMethodId for charges
        throw new BadRequestException('Payment method ID is required for charges.');
    }

    let transaction = this.transactionsRepository.create({
      ...createTransactionDto,
      merchantId,
      processedById,
      paymentMethodId: paymentMethod.id,
      type: TransactionType.CHARGE,
      status: TransactionStatus.PENDING,
    });

    transaction = await this.transactionsRepository.save(transaction);
    this.logger.log(`Transaction ${transaction.id} created with PENDING status`, TransactionsService.name);

    try {
      // Simulate interaction with payment gateway
      const gatewayResponse = await this.paymentGatewayService.processCharge(
        transaction.id,
        transaction.amount,
        transaction.currency,
        paymentMethod.gatewayToken, // Use the token from the stored payment method
        transaction.customerEmail,
        transaction.description,
      );

      transaction.gatewayTransactionId = gatewayResponse.gatewayTransactionId;
      transaction.status = gatewayResponse.status;
      await this.transactionsRepository.save(transaction);
      this.logger.log(`Transaction ${transaction.id} status updated to ${transaction.status}`, TransactionsService.name);

      // Trigger webhook for status change
      if (transaction.status === TransactionStatus.CAPTURED) {
        await this.webhooksService.dispatchWebhook(
          merchantId,
          WebhookEventType.TRANSACTION_CAPTURED,
          transaction,
        );
      } else if (transaction.status === TransactionStatus.FAILED) {
        await this.webhooksService.dispatchWebhook(
          merchantId,
          WebhookEventType.TRANSACTION_FAILED,
          transaction,
        );
      }

    } catch (error) {
      this.logger.error(`Error processing charge for transaction ${transaction.id}: ${error.message}`, error.stack, TransactionsService.name);
      transaction.status = TransactionStatus.FAILED;
      await this.transactionsRepository.save(transaction);
      await this.webhooksService.dispatchWebhook(
        merchantId,
        WebhookEventType.TRANSACTION_FAILED,
        transaction,
      );
      throw new BadRequestException(`Payment processing failed: ${error.message}`);
    }

    return transaction;
  }

  async refundTransaction(
    id: string,
    merchantId: string,
    processedById: string,
    refundAmount?: number,
  ): Promise<Transaction> {
    this.logger.debug(`Initiating refund for transaction ${id} by merchant ${merchantId}`, TransactionsService.name);
    const originalTransaction = await this.transactionsRepository.findOne({
      where: { id, merchantId },
      relations: ['merchant', 'paymentMethod'],
    });

    if (!originalTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found for this merchant`);
    }
    if (originalTransaction.status === TransactionStatus.REFUNDED || originalTransaction.status === TransactionStatus.VOIDED) {
      throw new BadRequestException('Cannot refund an already refunded or voided transaction');
    }
    if (originalTransaction.status !== TransactionStatus.CAPTURED && originalTransaction.status !== TransactionStatus.PARTIALLY_REFUNDED) {
      throw new BadRequestException('Only CAPTURED or PARTIALLY_REFUNDED transactions can be refunded');
    }

    const availableToRefund = originalTransaction.amount - originalTransaction.refundedAmount;
    const actualRefundAmount = refundAmount ? Math.min(refundAmount, availableToRefund) : availableToRefund;

    if (actualRefundAmount <= 0) {
      throw new BadRequestException('Invalid or zero refund amount specified');
    }

    if (!originalTransaction.gatewayTransactionId) {
        throw new BadRequestException('Original transaction has no gateway transaction ID, cannot refund.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const refundRecord = queryRunner.manager.create(Transaction, {
        merchant: originalTransaction.merchant,
        merchantId: originalTransaction.merchantId,
        paymentMethod: originalTransaction.paymentMethod,
        paymentMethodId: originalTransaction.paymentMethodId,
        processedById,
        amount: actualRefundAmount, // Refund amount
        currency: originalTransaction.currency,
        type: TransactionType.REFUND,
        status: TransactionStatus.PENDING,
        customerEmail: originalTransaction.customerEmail,
        customerName: originalTransaction.customerName,
        description: `Refund for original transaction ${originalTransaction.id}`,
        metadata: { originalTransactionId: originalTransaction.id, ...(refundAmount && { partialRefund: true }) },
      });
      await queryRunner.manager.save(refundRecord);
      this.logger.log(`Refund transaction ${refundRecord.id} created with PENDING status`, TransactionsService.name);

      const gatewayResponse = await this.paymentGatewayService.processRefund(
        originalTransaction.gatewayTransactionId,
        refundRecord.id,
        actualRefundAmount,
        originalTransaction.currency,
      );

      refundRecord.gatewayTransactionId = gatewayResponse.gatewayTransactionId;
      refundRecord.status = gatewayResponse.status;
      await queryRunner.manager.save(refundRecord);

      // Update original transaction's refunded amount and status
      originalTransaction.refundedAmount += actualRefundAmount;
      if (originalTransaction.refundedAmount >= originalTransaction.amount) {
        originalTransaction.status = TransactionStatus.REFUNDED;
      } else {
        originalTransaction.status = TransactionStatus.PARTIALLY_REFUNDED;
      }
      await queryRunner.manager.save(originalTransaction);

      await queryRunner.commitTransaction();
      this.logger.log(`Refund transaction ${refundRecord.id} status updated to ${refundRecord.status} and original transaction ${originalTransaction.id} updated`, TransactionsService.name);

      await this.webhooksService.dispatchWebhook(
        merchantId,
        WebhookEventType.TRANSACTION_REFUNDED,
        originalTransaction, // Send original transaction with updated status
        refundRecord, // Send refund record as additional data
      );
      return refundRecord;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error processing refund for transaction ${id}: ${error.message}`, error.stack, TransactionsService.name);
      throw new BadRequestException(`Refund processing failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async voidTransaction(id: string, merchantId: string, processedById: string): Promise<Transaction> {
    this.logger.debug(`Initiating void for transaction ${id} by merchant ${merchantId}`, TransactionsService.name);
    const originalTransaction = await this.transactionsRepository.findOne({
      where: { id, merchantId },
      relations: ['merchant', 'paymentMethod'],
    });

    if (!originalTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found for this merchant`);
    }
    if (originalTransaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Only PENDING transactions can be voided');
    }
    if (!originalTransaction.gatewayTransactionId) {
        throw new BadRequestException('Original transaction has no gateway transaction ID, cannot void.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const voidRecord = queryRunner.manager.create(Transaction, {
        merchant: originalTransaction.merchant,
        merchantId: originalTransaction.merchantId,
        paymentMethod: originalTransaction.paymentMethod,
        paymentMethodId: originalTransaction.paymentMethodId,
        processedById,
        amount: originalTransaction.amount, // Voided amount is the full amount
        currency: originalTransaction.currency,
        type: TransactionType.VOID,
        status: TransactionStatus.PENDING,
        customerEmail: originalTransaction.customerEmail,
        customerName: originalTransaction.customerName,
        description: `Void for original transaction ${originalTransaction.id}`,
        metadata: { originalTransactionId: originalTransaction.id },
      });
      await queryRunner.manager.save(voidRecord);
      this.logger.log(`Void transaction ${voidRecord.id} created with PENDING status`, TransactionsService.name);


      const gatewayResponse = await this.paymentGatewayService.processVoid(
        originalTransaction.gatewayTransactionId,
        voidRecord.id,
      );

      voidRecord.gatewayTransactionId = gatewayResponse.gatewayTransactionId;
      voidRecord.status = gatewayResponse.status;
      await queryRunner.manager.save(voidRecord);

      // Update original transaction status
      originalTransaction.status = TransactionStatus.VOIDED;
      await queryRunner.manager.save(originalTransaction);

      await queryRunner.commitTransaction();
      this.logger.log(`Void transaction ${voidRecord.id} status updated to ${voidRecord.status} and original transaction ${originalTransaction.id} updated`, TransactionsService.name);

      await this.webhooksService.dispatchWebhook(
        merchantId,
        WebhookEventType.TRANSACTION_VOIDED,
        originalTransaction,
        voidRecord,
      );
      return voidRecord;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error processing void for transaction ${id}: ${error.message}`, error.stack, TransactionsService.name);
      throw new BadRequestException(`Void processing failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(merchantId: string, page: number, limit: number): Promise<[Transaction[], number]> {
    this.logger.debug(`Finding all transactions for merchant ${merchantId}, page ${page}, limit ${limit}`, TransactionsService.name);
    const [transactions, total] = await this.transactionsRepository.findAndCount({
      where: { merchantId },
      relations: ['paymentMethod', 'processedBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return [transactions, total];
  }

  async findOne(id: string, merchantId: string): Promise<Transaction> {
    this.logger.debug(`Finding transaction ${id} for merchant ${merchantId}`, TransactionsService.name);
    const transaction = await this.transactionsRepository.findOne({
      where: { id, merchantId },
      relations: ['paymentMethod', 'processedBy'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found for this merchant`);
    }
    return transaction;
  }
}