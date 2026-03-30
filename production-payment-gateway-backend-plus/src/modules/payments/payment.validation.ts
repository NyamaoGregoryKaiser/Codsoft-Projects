```typescript
import Joi from "joi";

export const initiatePaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().required(), // e.g., USD, EUR
  description: Joi.string().max(255).optional(),
  customerId: Joi.string().uuid().optional(), // Optional customer identifier
  callbackUrl: Joi.string().uri().optional(), // URL for the merchant to receive webhooks
});

export const processPaymentCallbackSchema = Joi.object({
  transactionId: Joi.string().uuid().required(),
  status: Joi.string().valid("SUCCESS", "FAILED").required(),
  gatewayReference: Joi.string().optional(),
  amount: Joi.number().positive().optional(),
  currency: Joi.string().length(3).uppercase().optional(),
});

export const initiateRefundSchema = Joi.object({
  amount: Joi.number().positive().required(),
});


export type InitiatePaymentDto = Joi. সুtils.extractType<typeof initiatePaymentSchema>;
export type ProcessPaymentCallbackDto = Joi. সুtils.extractType<typeof processPaymentCallbackSchema>;
export type InitiateRefundDto = Joi. সুtils.extractType<typeof initiateRefundSchema>;
```