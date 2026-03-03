import React, { useState, useEffect } from 'react';
import api from '../api/api';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import './Pages.css';

function PaymentPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(''); // Will be set based on selected account
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' }); // type: 'success' or 'error'

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/accounts');
        setAccounts(response.data);
        if (response.data.length > 0) {
          setSelectedAccount(response.data[0].id);
          setCurrency(response.data[0].currency);
        }
      } catch (err) {
        setFeedback({ message: 'Failed to fetch accounts. Cannot make payments.', type: 'error' });
        console.error('Error fetching accounts for payment:', err);
      }
    };
    fetchAccounts();
  }, []);

  const handleAccountChange = (e) => {
    const accountId = e.target.value;
    setSelectedAccount(accountId);
    const acc = accounts.find(a => a.id === parseInt(accountId));
    if (acc) {
      setCurrency(acc.currency);
    }
  };

  const handleCardDetailsChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ message: '', type: '' });

    if (!selectedAccount || !amount || parseFloat(amount) <= 0 || !currency || !cardDetails.cardNumber) {
      setFeedback({ message: 'Please fill all required payment fields correctly.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/payments', {
        accountId: parseInt(selectedAccount),
        amount: parseFloat(amount),
        currency,
        cardDetails, // In a real app, this would be tokenized and sent to a gateway, not directly
      });
      setFeedback({ message: 'Payment initiated successfully!', type: 'success' });
      // Clear form
      setAmount('');
      setCardDetails({ cardNumber: '', expiryDate: '', cvv: '', cardHolderName: '' });
      console.log('Payment response:', response.data);
    } catch (err) {
      setFeedback({ message: err.response?.data?.message || 'Payment failed. Please try again.', type: 'error' });
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-header">
          <h1>Make a Payment</h1>
        </div>

        <div className="payment-form-container card">
          {feedback.message && (
            <p className={feedback.type === 'success' ? 'success-message' : 'error-message'}>
              {feedback.message}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="account">Deposit to Account:</label>
              <select
                id="account"
                value={selectedAccount}
                onChange={handleAccountChange}
                required
              >
                {accounts.length === 0 ? (
                  <option value="">No accounts available</option>
                ) : (
                  accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} ({acc.currency}) - Balance: {acc.balance.toFixed(2)}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount:</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                required
              />
              {currency && <span className="currency-display">{currency}</span>}
            </div>

            <h3>Card Details (Simulated)</h3>
            <div className="form-group">
              <label htmlFor="cardNumber">Card Number:</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={cardDetails.cardNumber}
                onChange={handleCardDetailsChange}
                placeholder="XXXX XXXX XXXX XXXX"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cardHolderName">Card Holder Name:</label>
              <input
                type="text"
                id="cardHolderName"
                name="cardHolderName"
                value={cardDetails.cardHolderName}
                onChange={handleCardDetailsChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date:</label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  value={cardDetails.expiryDate}
                  onChange={handleCardDetailsChange}
                  placeholder="MM/YY"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cvv">CVV:</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={cardDetails.cvv}
                  onChange={handleCardDetailsChange}
                  placeholder="XXX"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading || accounts.length === 0}>
              {loading ? 'Processing...' : 'Submit Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;