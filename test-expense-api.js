const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testExpenseAPI() {
    try {
        console.log('🧪 Testing Expense API\n');

        // Step 1: Login as admin
        console.log('Step 1: Logging in as admin...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@holyfamilypolymers.com',
            password: 'SecurePass123!'
        });

        if (!loginResponse.data.token) {
            console.log('❌ Login failed - no token received');
            console.log('Response:', loginResponse.data);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log(`   Token: ${token.substring(0, 20)}...`);
        console.log(`   User: ${loginResponse.data.user.name}\n`);

        // Step 2: Create expense
        console.log('Step 2: Creating expense...');
        const expenseData = {
            title: 'Test Cake Purchase',
            description: 'Testing expense creation',
            category: 'other_expenses',
            paymentMethod: 'cash',
            expenseDate: new Date().toISOString().split('T')[0],
            items: [
                { name: 'Cake', rate: 99.99, quantity: 1 }
            ],
            gstEnabled: true,
            gstAmount: 18.00,
            totalAmount: 117.99,
            amount: 117.99,
            notes: 'Test expense'
        };

        console.log('Sending data:', JSON.stringify(expenseData, null, 2));

        const createResponse = await axios.post(
            `${API_URL}/expenses`,
            expenseData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('\n✅ Expense created successfully!');
        console.log('Response:', JSON.stringify(createResponse.data, null, 2));

        // Step 3: Get expenses
        console.log('\nStep 3: Fetching expenses...');
        const getResponse = await axios.get(`${API_URL}/expenses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`✅ Found ${getResponse.data.data.length} expenses`);
        
        // Step 4: Delete test expense
        if (createResponse.data.data && createResponse.data.data._id) {
            console.log('\nStep 4: Cleaning up test expense...');
            await axios.delete(
                `${API_URL}/expenses/${createResponse.data.data._id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log('✅ Test expense deleted');
        }

        console.log('\n✅ All tests passed!');
        console.log('\nThe API is working correctly.');
        console.log('The issue might be with the frontend authentication.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        if (error.response) {
            console.error('\nResponse status:', error.response.status);
            console.error('Response data:', error.response.data);
            console.error('\nFull response:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('\nNo response received from server');
            console.error('Is the backend running on port 5000?');
        } else {
            console.error('\nError details:', error);
        }
    }
}

// Check if axios is installed
try {
    require.resolve('axios');
    testExpenseAPI();
} catch (e) {
    console.log('❌ axios not found. Installing...');
    console.log('Run: npm install axios');
    console.log('Then run this script again: node test-expense-api.js');
}
