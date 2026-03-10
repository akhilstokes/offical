@echo off
echo 🔄 Restarting server to load user GST invoice fixes...
echo.
echo ✅ CHANGES MADE:
echo - Added user-specific GST invoice endpoint: /api/gst-invoices/user/my-invoices
echo - Updated UserBills.jsx to use user-specific endpoint  
echo - User print route already exists: /user/invoice/print/:id
echo - Send-to-user endpoint working: /api/gst-invoices/:id/send-to-user
echo.
echo 🎯 THIS SHOULD FIX:
echo - Users getting redirected to dashboard when downloading PDFs
echo - Users only see GST invoices that have been sent to them
echo - PDF download works directly without access issues
echo.
echo 🚀 Starting server...
cd server
npm start