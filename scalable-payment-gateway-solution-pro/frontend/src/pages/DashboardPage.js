import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/api';
import './Pages.css';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';

function DashboardPage() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
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

    if (user) {
      fetchAccounts();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-header">
          <h1>Welcome, {user?.firstName}!</h1>
        </div>
        <div className="dashboard-summary">
          {error && <p className="error-message">{error}</p>}
          <h3>Your Accounts</h3>
          {accounts.length === 0 ? (
            <p>No accounts found. Create one to get started!</p>
          ) : (
            <div className="account-cards">
              {accounts.map((account) => (
                <div key={account.id} className="account-card">
                  <h4>{account.currency} Account</h4>
                  <p>Account Number: {account.account_number}</p>
                  <p>Balance: {account.balance.toFixed(2)} {account.currency}</p>
                  <a href={`/accounts/${account.id}/transactions`}>View Transactions</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;