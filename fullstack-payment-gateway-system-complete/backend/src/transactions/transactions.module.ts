import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { UsersModule } from '../users/users.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    PaymentMethodsModule,
    UsersModule,
    WebhooksModule,
    ConfigModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, PaymentGatewayService],
  exports: [TransactionsService],
})
export class TransactionsModule {}