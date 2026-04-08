import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, Sum } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from '../database/entities/transaction.entity';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private readonly logger: AppLogger,
  ) {}

  async getTransactionSummary(
    merchantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    this.logger.debug(`Getting transaction summary for merchant ${merchantId} from ${startDate?.toISOString() || 'beginning'} to ${endDate?.toISOString() || 'now'}`, ReportingService.name);

    const queryBuilder = this.transactionsRepository
      .createQueryBuilder('transaction')
      .where('transaction.merchantId = :merchantId', { merchantId });

    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate });
    }

    const successfulCharges = await queryBuilder
      .clone()
      .andWhere('transaction.type = :type', { type: TransactionType.CHARGE })
      .andWhere('transaction.status = :status', { status: TransactionStatus.CAPTURED })
      .select('SUM(transaction.amount)', 'totalAmount')
      .addSelect('COUNT(transaction.id)', 'count')
      .getRawOne();

    const totalRefunds = await queryBuilder
      .clone()
      .andWhere('transaction.type = :type', { type: TransactionType.REFUND })
      .andWhere('transaction.status = :status', { status: TransactionStatus.REFUNDED })
      .select('SUM(transaction.amount)', 'totalAmount')
      .addSelect('COUNT(transaction.id)', 'count')
      .getRawOne();

    const failedTransactions = await queryBuilder
      .clone()
      .andWhere('transaction.status = :status', { status: TransactionStatus.FAILED })
      .select('COUNT(transaction.id)', 'count')
      .getRawOne();

    const pendingTransactions = await queryBuilder
      .clone()
      .andWhere('transaction.status = :status', { status: TransactionStatus.PENDING })
      .select('COUNT(transaction.id)', 'count')
      .getRawOne();

    return {
      totalSuccessfulCharges: parseFloat(successfulCharges.totalAmount || '0'),
      successfulChargeCount: parseInt(successfulCharges.count || '0', 10),
      totalRefundedAmount: parseFloat(totalRefunds.totalAmount || '0'),
      refundCount: parseInt(totalRefunds.count || '0', 10),
      totalFailedTransactions: parseInt(failedTransactions.count || '0', 10),
      totalPendingTransactions: parseInt(pendingTransactions.count || '0', 10),
      netVolume: parseFloat(successfulCharges.totalAmount || '0') - parseFloat(totalRefunds.totalAmount || '0'),
    };
  }

  async getDailyTransactions(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    this.logger.debug(`Getting daily transactions for merchant ${merchantId} from ${startDate.toISOString()} to ${endDate.toISOString()}`, ReportingService.name);

    const results = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select("DATE(transaction.createdAt)", "date")
      .addSelect("SUM(CASE WHEN transaction.type = 'charge' AND transaction.status = 'captured' THEN transaction.amount ELSE 0 END)", "capturedAmount")
      .addSelect("COUNT(CASE WHEN transaction.type = 'charge' AND transaction.status = 'captured' THEN transaction.id ELSE NULL END)", "capturedCount")
      .addSelect("SUM(CASE WHEN transaction.type = 'refund' AND transaction.status = 'refunded' THEN transaction.amount ELSE 0 END)", "refundedAmount")
      .addSelect("COUNT(CASE WHEN transaction.type = 'refund' AND transaction.status = 'refunded' THEN transaction.id ELSE NULL END)", "refundCount")
      .addSelect("COUNT(CASE WHEN transaction.status = 'failed' THEN transaction.id ELSE NULL END)", "failedCount")
      .where('transaction.merchantId = :merchantId', { merchantId })
      .andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy("DATE(transaction.createdAt)")
      .orderBy("date", "ASC")
      .getRawMany();

    return results.map(row => ({
      date: row.date,
      capturedAmount: parseFloat(row.capturedAmount || '0'),
      capturedCount: parseInt(row.capturedCount || '0', 10),
      refundedAmount: parseFloat(row.refundedAmount || '0'),
      refundCount: parseInt(row.refundCount || '0', 10),
      failedCount: parseInt(row.failedCount || '0', 10),
      netVolume: parseFloat(row.capturedAmount || '0') - parseFloat(row.refundedAmount || '0'),
    }));
  }
}