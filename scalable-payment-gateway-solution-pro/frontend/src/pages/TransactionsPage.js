import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import moment from 'moment';
import './Pages.css';

function TransactionsPage() {
  const { accountId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const accountRes = await api.get(`/accounts/${accountId}`);
        setAccount(accountRes.data);

        const transactionRes = await api.get(`/transactions/account/${accountId}`);
        setTransactions(transactionRes.data.results);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch transactions.');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchTransactions();
    }
  }, [accountId]);

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <p>Loading transactions...</p>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-header">
          <h1>Transactions for Account: {account?.account_number}</h1>
          {account && <p>Current Balance: {account.balance.toFixed(2)} {account.currency}</p>}
        </div>

        {error && <p className="error-message">{error}</p>}

        {transactions.length === 0 ? (
          <p>No transactions found for this account.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className={tx.type === 'withdrawal' || tx.type === 'transfer' && tx.from_account_id === accountId ? 'transaction-debit' : 'transaction-credit'}>
                    <td>{moment(tx.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                    <td>{tx.type}</td>
                    <td>{tx.description}</td>
                    <td>
                      {tx.from_account_id === accountId ? '-' : '+'}
                      {tx.amount.toFixed(2)} {tx.currency}
                    </td>
                    <td>{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionsPage;