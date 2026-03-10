const axios = require('axios');

const testApi = async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/product-orders');
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    } catch (err) {
        if (err.response) {
            console.log('Error Status:', err.response.status);
            console.log('Error Data:', err.response.data);
        } else {
            console.log('Error:', err.message);
        }
    }
};

testApi();
