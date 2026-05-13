import asyncio
import random
from typing import Dict, Any
from decimal import Decimal

from app.schemas.transaction import CardDetails
from app.core.logger import get_logger
from app.core.exceptions import PaymentGatewayException

logger = get_logger(__name__)

class PaymentGatewayService:
    """
    A mocked payment gateway service.
    In a real application, this would interact with external APIs like Stripe, Braintree, etc.
    It simulates asynchronous network requests and various outcomes.
    """

    async def tokenize_card(self, card_details: CardDetails) -> str | None:
        """
        Simulates tokenizing card details.
        In a real scenario, this would be done client-side via a PCI-compliant SDK.
        """
        logger.info(f"Simulating card tokenization for card ending in {card_details.card_number[-4:]}")
        await asyncio.sleep(random.uniform(0.1, 0.5)) # Simulate network delay
        if card_details.card_number.startswith("4"): # Visa-like prefix
            return f"tok_visa_{card_details.card_number[-4:]}_{random.randint(1000, 9999)}"
        elif card_details.card_number.startswith("5"): # Mastercard-like prefix
            return f"tok_mc_{card_details.card_number[-4:]}_{random.randint(1000, 9999)}"
        else:
            logger.warning("Simulated tokenization failed for unknown card type.")
            return None # Simulate tokenization failure

    async def process_payment(self, token: str, amount: Decimal, currency: str) -> Dict[str, Any]:
        """
        Simulates processing a payment (authorization + capture in one step usually).
        """
        logger.info(f"Simulating payment processing: Token={token}, Amount={amount}, Currency={currency}")
        await asyncio.sleep(random.uniform(0.5, 2.0)) # Simulate network delay

        # Simulate various outcomes
        if "fail" in token: # Specific token to force failure
            logger.error("Simulated payment failure due to 'fail' token.")
            return {"success": False, "status": "failed", "message": "Transaction declined by bank."}
        elif random.random() < 0.1: # 10% chance of failure
            logger.warning("Simulated random payment failure.")
            return {"success": False, "status": "failed", "message": "Generic processing error."}
        elif random.random() < 0.2: # 10% chance of authorization, requires separate capture
            gateway_transaction_id = f"gtw_auth_{random.randint(100000, 999999)}"
            logger.info(f"Simulated payment authorized (requires capture): Gateway ID={gateway_transaction_id}")
            return {
                "success": True,
                "status": "authorized",
                "gateway_transaction_id": gateway_transaction_id,
                "amount": float(amount),
                "currency": currency,
                "message": "Payment authorized, awaiting capture."
            }
        else:
            gateway_transaction_id = f"gtw_charge_{random.randint(100000, 999999)}"
            logger.info(f"Simulated payment captured: Gateway ID={gateway_transaction_id}")
            return {
                "success": True,
                "status": "captured",
                "gateway_transaction_id": gateway_transaction_id,
                "amount": float(amount),
                "currency": currency,
                "message": "Payment successful."
            }

    async def capture_payment(self, gateway_transaction_id: str, amount: Decimal, currency: str) -> Dict[str, Any]:
        """
        Simulates capturing a previously authorized payment.
        """
        logger.info(f"Simulating capture for Gateway ID={gateway_transaction_id}, Amount={amount}")
        await asyncio.sleep(random.uniform(0.3, 1.0))

        if "fail_capture" in gateway_transaction_id:
            logger.error("Simulated capture failure due to 'fail_capture' ID.")
            return {"success": False, "status": "failed", "message": "Capture declined."}
        elif random.random() < 0.05: # 5% chance of failure
            logger.warning("Simulated random capture failure.")
            return {"success": False, "status": "failed", "message": "Capture processing error."}
        else:
            logger.info(f"Simulated capture successful for Gateway ID={gateway_transaction_id}")
            return {
                "success": True,
                "status": "captured",
                "gateway_transaction_id": gateway_transaction_id,
                "amount": float(amount),
                "currency": currency,
                "message": "Payment successfully captured."
            }

    async def refund_payment(self, gateway_transaction_id: str, amount: Decimal, currency: str) -> Dict[str, Any]:
        """
        Simulates refunding a captured payment.
        """
        logger.info(f"Simulating refund for Gateway ID={gateway_transaction_id}, Amount={amount}")
        await asyncio.sleep(random.uniform(0.3, 1.5))

        if "fail_refund" in gateway_transaction_id:
            logger.error("Simulated refund failure due to 'fail_refund' ID.")
            return {"success": False, "status": "failed", "message": "Refund failed by gateway."}
        elif random.random() < 0.08: # 8% chance of failure
            logger.warning("Simulated random refund failure.")
            return {"success": False, "status": "failed", "message": "Refund processing error."}
        else:
            logger.info(f"Simulated refund successful for Gateway ID={gateway_transaction_id}")
            return {
                "success": True,
                "status": "refunded",
                "gateway_transaction_id": gateway_transaction_id,
                "refund_amount": float(amount),
                "currency": currency,
                "message": "Payment successfully refunded."
            }

    async def void_payment(self, gateway_transaction_id: str) -> Dict[str, Any]:
        """
        Simulates voiding an authorized (but not yet captured) payment.
        """
        logger.info(f"Simulating void for Gateway ID={gateway_transaction_id}")
        await asyncio.sleep(random.uniform(0.2, 0.8))

        if "fail_void" in gateway_transaction_id:
            logger.error("Simulated void failure due to 'fail_void' ID.")
            return {"success": False, "status": "failed", "message": "Void failed by gateway."}
        elif random.random() < 0.03: # 3% chance of failure
            logger.warning("Simulated random void failure.")
            return {"success": False, "status": "failed", "message": "Void processing error."}
        else:
            logger.info(f"Simulated void successful for Gateway ID={gateway_transaction_id}")
            return {
                "success": True,
                "status": "voided",
                "gateway_transaction_id": gateway_transaction_id,
                "message": "Payment successfully voided."
            }

```

#### `payment_processor/app/tasks/payment_tasks.py` (Celery Task)
```python