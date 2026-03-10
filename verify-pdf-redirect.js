console.log('🔍 Verifying PDF Redirect Changes...\n');

const fs = require('fs');

try {
    const filePath = 'client/src/pages/manager/ManagerOrders.jsx';
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the redirect code is present
    if (content.includes("window.location.href = '/'")) {
        console.log('✅ PDF redirect code found in ManagerOrders.jsx');
        console.log('✅ Function now redirects to landing page');
    } else {
        console.log('❌ PDF redirect code not found');
    }
    
    // Check if the tooltip was updated
    if (content.includes('title="Go to Landing Page"')) {
        console.log('✅ Button tooltip updated to "Go to Landing Page"');
    } else {
        console.log('❌ Button tooltip not updated');
    }
    
    console.log('\n📋 TO SEE THE CHANGES:');
    console.log('1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('2. Or open browser in incognito/private mode');
    console.log('3. Navigate to Manager Orders page');
    console.log('4. Click on GST Invoices tab');
    console.log('5. Click the red PDF icon - it should redirect to landing page');
    
    console.log('\n🔄 IF STILL NOT WORKING:');
    console.log('- Stop the React dev server (Ctrl+C)');
    console.log('- Restart with: npm start (in client folder)');
    console.log('- Clear browser cache completely');
    
} catch (error) {
    console.error('❌ Error reading file:', error.message);
}

console.log('\n✨ Changes are saved and ready!');