```javascript
// This file can be used for any global JavaScript logic for the Flask frontend.
// For this simple example, most interactive logic is handled by Flask rendering
// and form submissions. More complex interactions would use AJAX directly.

document.addEventListener('DOMContentLoaded', () => {
    // Example: Dynamically update max quantity in cart or product detail
    const quantityInputs = document.querySelectorAll('input[type="number"][name="quantity"]');
    quantityInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (input.value < 0) {
                input.value = 0; // Prevent negative quantities
            }
            // Add more client-side validation if needed
        });
    });

    // Handle "remove" confirmation if desired
    document.querySelectorAll('.btn-danger').forEach(button => {
        button.addEventListener('click', (event) => {
            // Check if it's a remove from cart button
            if (event.target.closest('form') && event.target.closest('form').action.includes('/cart/remove/')) {
                if (!confirm('Are you sure you want to remove this item from your cart?')) {
                    event.preventDefault(); // Stop the form submission
                }
            }
        });
    });

    // Hide flash messages after a few seconds
    const flashMessages = document.querySelector('.flash-messages');
    if (flashMessages) {
        setTimeout(() => {
            flashMessages.style.opacity = 0;
            flashMessages.style.transition = 'opacity 1s ease-out';
            setTimeout(() => flashMessages.remove(), 1000); // Remove from DOM after fade
        }, 5000); // 5 seconds
    }
});

```

---

**3. Configuration & Setup**

#### Backend Dependencies