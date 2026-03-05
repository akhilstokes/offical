import React from 'react';
import ExpenseManagement from '../admin/ExpenseManagement';

// Accountant uses the same component with role-based permissions
const AccountantExpenses = () => {
    return <ExpenseManagement />;
};

export default AccountantExpenses;
