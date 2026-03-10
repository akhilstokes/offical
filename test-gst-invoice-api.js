const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid token from your login
const TOKEN = 'YOUR_TOKEN_HERE';

async function testGSTInvoiceAPI() {
  console.log('🧪 Testing GST Invoice API...\n');

  try {
    // Test 1: Get company settings
    console.log('1️⃣ Testing GET /api/gst-invoices/company-settings');
    const settingsResponse = await axios.get(`${API_URL}/gst-invoices/company-settings`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('✅ Company settings retrieved:', settingsResponse.data.settings.companyName);
    console.log('');

    // Test 2: Get all invoices
    console.log('2️⃣ Testing GET /api/gst-invoices');
    const invoicesResponse = await axios.get(`${API_URL}/gst-invoices`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('✅ Invoices retrieved:', invoicesResponse.data.count, 'invoices');
    console.log('');

    // Test 3: Create a new invoice
    console.log('3️⃣ Testing POST /api/gst-invoices');
    const newInvoice = {
      supplyDate: new Date().toISOString(),
      reverseCharge: 'No',
      vendorName: 'Test Supplier',
      placeOfSupply: 'Kooroppada',
      customerName: 'Test Customer',
      customerAddress: 'Test Address, Kerala',
      customerGSTIN: '32AAHFH5388M1ZX',
      customerState: 'Kerala',
      customerStateCode: '32',
      transportationMode: 'Road',
      vehicleNumber: 'KL-01-AB-1234',
      items: [
        {
          description: 'Vulcanised Rubber Bands',
          hsnSac: '40169920',
          gstRate: 12,
          quantity: 100,
          unit: 'KG',
          rate: 110
        }
      ]
    };

    const createResponse = await axios.post(`${API_URL}/gst-invoices`, newInvoice, {
      headers: { 
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Invoice created:', createResponse.data.invoice.invoiceNumber);
    console.log('   Grand Total:', createResponse.data.invoice.grandTotal);
    console.log('');

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testGSTInvoiceAPI();
