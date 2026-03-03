import React, { useState, useEffect } from 'react';
import api from '../api/api';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import './Pages.css';

function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState('USD');
  const [createAccountLoading, setCreateAccountLoading] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (err) {
      setError('Failed to fetch accounts.');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateAccountLoading(true);
    setError('');
    try {
      await api.post('/accounts', { currency: newAccountCurrency });
      setNewAccountCurrency('USD'); // Reset form
      await fetchAccounts(); // Refresh accounts list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account.');
      console.error('Error creating account:', err);
    } finally {
      setCreateAccountLoading(false);
    }
  };

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-header">
          <h1>Your Accounts</h1>
        </div>
        <p>Loading accounts...</p>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-header">
          <h1>Your Accounts</h1>
          <button className="add-button" onClick={() => document.getElementById('createAccountModal').style.display = 'block'}>
            Create New Account
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="account-list">
          {accounts.length === 0 ? (
            <p>You don't have any accounts yet. Create one!</p>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="account-item card">
                <h3>{account.currency} Account</h3>
                <p><strong>Account Number:</strong> {account.account_number}</p>
                <p><strong>Balance:</strong> {account.balance.toFixed(2)} {account.currency}</p>
                <p><strong>Created:</strong> {new Date(account.createdAt).toLocaleDateString()}</p>
                <a href={`/accounts/${account.id}/transactions`} className="button secondary-button">View Transactions</a>
              </div>
            ))
          )}
        </div>

        {/* Create Account Modal */}
        <div id="createAccountModal" className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => document.getElementById('createAccountModal').style.display = 'none'}>&times;</span>
            <h2>Create New Account</h2>
            <form onSubmit={handleCreateAccount}>
              <div className="form-group">
                <label htmlFor="currency">Currency:</label>
                <select
                  id="currency"
                  value={newAccountCurrency}
                  onChange={(e) => setNewAccountCurrency(e.target.value)}
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  {/* Add more currencies as needed */}
                </select>
              </div>
              <button type="submit" disabled={createAccountLoading}>
                {createAccountLoading ? 'Creating...' : 'Create Account'}
              </button>
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountsPage;