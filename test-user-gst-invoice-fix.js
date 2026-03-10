const axios = require('axios');

const base = 'http://localhost:5000';

async function testUserGSTInvoiceFix() {
    console.log('🧪 Testing User GST Invoice Fix');
    console.log('================================');

    try {
        // Test 1: Check if user-specific GST invoice endpoint exists
        console.log('\n1️⃣ Testing user-specific GST invoice endpoint...');
        try {
            const response = await axios.get(`${base}/api/gst-invoices/user/my-invoices?page=1&limit=10`, {
                headers: {
                    'Authorization': 'Bearer fake-token'
                }
            });
            console.log('❌ Endpoint exists but should require valid auth');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Endpoint exists and requires authentication');
            } else if (error.response?.status === 404) {
                console.log('❌ Endpoint not found - server needs restart');
            } else {
                console.log('⚠️ Unexpected error:', error.response?.status);
            }
        }

        // Test 2: Check if user print route is accessible
        console.log('\n2️⃣ Testing user print route...');
        try {
            const response = await axios.get(`${base}/user/invoice/print/test-id`);
            console.log('❌ Should not be accessible without frontend routing');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Backend correctly returns 404 for frontend routes');
            } else {
                console.log('⚠️ Unexpected error:', error.response?.status);
            }
        }

        // Test 3: Check if send-to-user endpoint still works
        console.log('\n3️⃣ Testing send-to-user endpoint...');
        try {
            const response = await axios.post(`${base}/api/gst-invoices/test-id/send-to-user`, {}, {
                headers: {
                    'Authorization': 'Bearer fake-token'
                }
            });
            console.log('❌ Should require valid auth');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Send-to-user endpoint exists and requires authentication');
            } else if (error.response?.status === 404) {
                console.log('❌ Send-to-user endpoint not found');
            } else {
                console.log('⚠️ Unexpected error:', error.response?.status);
            }
        }

        console.log('\n📋 SUMMARY:');
        console.log('- Added user-specific GST invoice endpoint: /api/gst-invoices/user/my-invoices');
        console.log('- Updated UserBills.jsx to use user-specific endpoint');
        console.log('- User print route exists: /user/invoice/print/:id');
        console.log('- Send-to-user endpoint exists: /api/gst-invoices/:id/send-to-user');
        
        console.log('\n🔧 NEXT STEPS:');
        console.log('1. Restart server to load new routes');
        console.log('2. Test with valid user authentication');
        console.log('3. Verify PDF download works without redirects');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testUserGSTInvoiceFix();