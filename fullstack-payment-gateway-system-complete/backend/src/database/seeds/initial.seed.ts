import { DataSource } from 'typeorm';
import { Seeder, runSeeder, SeederFactoryManager } from 'typeorm-extension';
import { Merchant } from '../entities/merchant.entity';
import { User, UserRole } from '../entities/user.entity';
import * as argon2 from 'argon2';
import { PaymentMethod, PaymentMethodType } from '../entities/payment-method.entity';
import { Transaction, TransactionStatus, TransactionType } from '../entities/transaction.entity';
import { WebhookSubscription, WebhookEventType } from '../entities/webhook-subscription.entity';

export default class InitialSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const merchantRepository = dataSource.getRepository(Merchant);
    const userRepository = dataSource.getRepository(User);
    const paymentMethodRepository = dataSource.getRepository(PaymentMethod);
    const transactionRepository = dataSource.getRepository(Transaction);
    const webhookSubscriptionRepository = dataSource.getRepository(WebhookSubscription);

    // 1. Create Merchants
    const merchant1 = await merchantRepository.save({
      name: 'Acme Corp',
      contactEmail: 'contact@acmecorp.com',
      apiKey: 'acme_api_key',
      apiSecret: 'acme_api_secret_hash', // In real-world, hash this or use secure key generation
    });

    const merchant2 = await merchantRepository.save({
      name: 'Globex Inc.',
      contactEmail: 'info@globex.com',
      apiKey: 'globex_api_key',
      apiSecret: 'globex_api_secret_hash',
    });

    // 2. Create Users
    const hashedPassword = await argon2.hash('password123'); // Strong password recommended

    const adminUser = await userRepository.save({
      email: 'admin@paymentsystem.com',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
    });

    const merchant1User = await userRepository.save({
      email: 'user1@acmecorp.com',
      passwordHash: hashedPassword,
      role: UserRole.MERCHANT_USER,
      merchant: merchant1,
    });

    const merchant2User = await userRepository.save({
      email: 'user1@globex.com',
      passwordHash: hashedPassword,
      role: UserRole.MERCHANT_USER,
      merchant: merchant2,
    });

    // 3. Create Payment Methods (abstracted)
    const pm1 = await paymentMethodRepository.save({
      merchant: merchant1,
      type: PaymentMethodType.CREDIT_CARD,
      gatewayToken: 'tok_visa_acmecorp_1',
      cardBrand: 'Visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      fingerprint: 'visa_fingerprint_acme_1',
      isDefault: true,
    });

    const pm2 = await paymentMethodRepository.save({
      merchant: merchant1,
      type: PaymentMethodType.CREDIT_CARD,
      gatewayToken: 'tok_mc_acmecorp_2',
      cardBrand: 'Mastercard',
      last4: '0005',
      expiryMonth: 10,
      expiryYear: 2026,
      fingerprint: 'mc_fingerprint_acme_2',
      isDefault: false,
    });

    // 4. Create Transactions
    await transactionRepository.save({
      merchant: merchant1,
      paymentMethod: pm1,
      processedBy: merchant1User,
      amount: 100.50,
      currency: 'USD',
      type: TransactionType.CHARGE,
      status: TransactionStatus.CAPTURED,
      gatewayTransactionId: 'gtw_charge_acme_1',
      customerEmail: 'customer1@example.com',
      description: 'First purchase',
    });

    await transactionRepository.save({
      merchant: merchant1,
      paymentMethod: pm2,
      processedBy: merchant1User,
      amount: 50.00,
      currency: 'USD',
      type: TransactionType.CHARGE,
      status: TransactionStatus.CAPTURED,
      gatewayTransactionId: 'gtw_charge_acme_2',
      customerEmail: 'customer2@example.com',
      description: 'Second purchase',
    });

    await transactionRepository.save({
        merchant: merchant1,
        paymentMethod: pm1,
        processedBy: merchant1User,
        amount: 25.00,
        currency: 'USD',
        type: TransactionType.CHARGE,
        status: TransactionStatus.REFUNDED,
        refundedAmount: 25.00,
        gatewayTransactionId: 'gtw_charge_acme_3',
        customerEmail: 'customer3@example.com',
        description: 'Refunded item',
      });

    await transactionRepository.save({
      merchant: merchant2,
      paymentMethod: null, // Could be direct debit or other method without explicit PM entity for simplicity
      processedBy: merchant2User,
      amount: 200.00,
      currency: 'EUR',
      type: TransactionType.CHARGE,
      status: TransactionStatus.PENDING,
      customerEmail: 'customer4@example.com',
      description: 'Pending order',
    });

    // 5. Create Webhook Subscriptions
    await webhookSubscriptionRepository.save({
      merchant: merchant1,
      callbackUrl: 'http://localhost:4000/webhook-listener/acmecorp', // Example listener endpoint
      eventTypes: [WebhookEventType.TRANSACTION_CAPTURED, WebhookEventType.TRANSACTION_REFUNDED],
      isActive: true,
    });
  }
}