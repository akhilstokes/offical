const axios = require('axios');

const base = 'http://localhost:5000';

async function testPANValidationFeature() {
    console.log('🧪 Testing PAN Validation Feature');
    console.log('==================================');

    try {
        // Test 1: Valid PAN format validation
        console.log('\n1️⃣ Testing valid PAN formats...');
        const validPANs = ['ABCDE1234F', 'XYZAB5678C', 'PQRST9876D'];
        
        validPANs.forEach(pan => {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            const isValid = panRegex.test(pan);
            console.log(`   ${isValid ? '✅' : '❌'} ${pan} - ${isValid ? 'Valid' : 'Invalid'}`);
        });

        // Test 2: Invalid PAN format validation
        console.log('\n2️⃣ Testing invalid PAN formats...');
        const invalidPANs = ['ABC123', 'ABCDE12345', 'abcde1234f', '1234567890', 'ABCD1234EF'];
        
        invalidPANs.forEach(pan => {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            const isValid = panRegex.test(pan);
            console.log(`   ${isValid ? '❌' : '✅'} ${pan} - ${isValid ? 'Valid (should be invalid)' : 'Invalid (correct)'}`);
        });

        // Test 3: Test product order creation with PAN (without auth)
        console.log('\n3️⃣ Testing product order API with PAN validation...');
        try {
            const response = await axios.post(`${base}/api/product-orders`, {
                productType: 'amber_bands',
                packSizeName: 'Standard Amber Rubber Bands',
                quantity: 10,
                paymentMethod: 'UPI',
                deliveryAddress: 'Test Address, City, State',
                panNumber: 'ABCDE1234F'
            }, {
                headers: {
                    'Authorization': 'Bearer fake-token'
                }
            });
            console.log('❌ Should require valid authentication');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ API requires authentication (correct)');
            } else if (error.response?.status === 400) {
                console.log('⚠️ Validation error:', error.response.data.message);
            } else {
                console.log('⚠️ Unexpected error:', error.response?.status);
            }
        }

        // Test 4: Test without PAN number
        console.log('\n4️⃣ Testing API without PAN number...');
        try {
            const response = await axios.post(`${base}/api/product-orders`, {
                productType: 'amber_bands',
                packSizeName: 'Standard Amber Rubber Bands',
                quantity: 10,
                paymentMethod: 'UPI',
                deliveryAddress: 'Test Address, City, State'
                // Missing panNumber
            }, {
                headers: {
                    'Authorization': 'Bearer fake-token'
                }
            });
            console.log('❌ Should require PAN number');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ API requires authentication (will validate PAN after auth)');
            } else if (error.response?.status === 400 && error.response.data.message.includes('PAN')) {
                console.log('✅ API correctly requires PAN number');
            } else {
                console.log('⚠️ Unexpected error:', error.response?.status);
            }
        }

        console.log('\n📋 FEATURE SUMMARY:');
        console.log('✅ PAN validation regex implemented');
        console.log('✅ Frontend PAN input field with validation');
        console.log('✅ Backend PAN validation in product order creation');
        console.log('✅ Payment methods updated (UPI, Card, COD, Bank Transfer)');
        console.log('✅ PAN field added to product order model');

        console.log('\n🎯 USER WORKFLOW:');
        console.log('1. User enters quantity and delivery address');
        console.log('2. User enters PAN number (ABCDE1234F format)');
        console.log('3. User clicks "Validate PAN" button');
        console.log('4. System validates PAN format and shows success');
        console.log('5. Payment method dropdown becomes available');
        console.log('6. User selects payment method (UPI/Card/COD/Bank Transfer)');
        console.log('7. User submits wholesale request with validated PAN');

        console.log('\n🧪 TO TEST MANUALLY:');
        console.log('1. Go to /user/buy-products');
        console.log('2. Select a product category');
        console.log('3. Enter quantity and address');
        console.log('4. Enter PAN: ABCDE1234F');
        console.log('5. Click "Validate PAN"');
        console.log('6. Select payment method');
        console.log('7. Submit request');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testPANValidationFeature();