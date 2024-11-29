import { useState, useEffect } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'RetailMasterDB';
const STORE_NAME = 'offlinePayments';

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [pendingTransactions, setPendingTransactions] = useState([]);

  useEffect(() => {
    initDB();
    loadPendingTransactions();
    setupSyncListener();
  }, []);

  const initDB = async () => {
    try {
      await openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
        },
      });
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
    }
  };

  const loadPendingTransactions = async () => {
    try {
      const db = await openDB(DB_NAME, 1);
      const transactions = await db.getAll(STORE_NAME);
      setPendingTransactions(transactions);
    } catch (error) {
      console.error('Error loading pending transactions:', error);
    }
  };

  const setupSyncListener = () => {
    window.addEventListener('online', () => {
      syncTransactions();
    });
  };

  const queueOfflinePayment = async (paymentData) => {
    try {
      const db = await openDB(DB_NAME, 1);
      const id = await db.add(STORE_NAME, {
        ...paymentData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      await loadPendingTransactions();

      return {
        success: true,
        transactionId: `OFFLINE-${id}`,
        message: 'Payment queued for processing',
      };
    } catch (error) {
      console.error('Error queuing offline payment:', error);
      throw new Error('Failed to queue offline payment');
    }
  };

  const syncTransactions = async () => {
    if (syncStatus === 'syncing' || !navigator.onLine) return;

    try {
      setSyncStatus('syncing');
      const db = await openDB(DB_NAME, 1);
      const transactions = await db.getAll(STORE_NAME);

      for (const transaction of transactions) {
        try {
          // Attempt to process the transaction
          const response = await fetch('/api/payments/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction),
          });

          if (response.ok) {
            // Remove successfully synced transaction
            await db.delete(STORE_NAME, transaction.id);
          } else {
            // Mark as failed if server explicitly rejects
            await db.put(STORE_NAME, {
              ...transaction,
              status: 'failed',
              error: 'Server rejected transaction',
            });
          }
        } catch (error) {
          console.error('Error syncing transaction:', error);
          // Keep transaction in queue if network error
          await db.put(STORE_NAME, {
            ...transaction,
            status: 'failed',
            error: error.message,
          });
        }
      }

      await loadPendingTransactions();
      setSyncStatus('completed');
    } catch (error) {
      console.error('Error during sync:', error);
      setSyncStatus('failed');
    }
  };

  const retryTransaction = async (transactionId) => {
    try {
      const db = await openDB(DB_NAME, 1);
      const transaction = await db.get(STORE_NAME, transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Reset status and attempt to sync
      await db.put(STORE_NAME, {
        ...transaction,
        status: 'pending',
        error: null,
      });

      await syncTransactions();
    } catch (error) {
      console.error('Error retrying transaction:', error);
      throw new Error('Failed to retry transaction');
    }
  };

  return {
    queueOfflinePayment,
    syncTransactions,
    retryTransaction,
    pendingTransactions,
    syncStatus,
  };
};
