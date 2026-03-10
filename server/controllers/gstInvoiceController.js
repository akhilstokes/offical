const GSTInvoice = require('../models/gstInvoiceModel');
const CompanySettings = require('../models/companySettingsModel');

// Helper function to convert number to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };
  
  if (num === 0) return 'Zero Rupees Only';
  
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;
  
  let result = '';
  if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
  if (remainder > 0) result += convertLessThanThousand(remainder);
  
  return result.trim() + ' Rupees Only';
};

// Create new invoice
exports.createInvoice = async (req, res) => {
  try {
    const {
      supplyDate,
      reverseCharge,
      vendorName,
      placeOfSupply,
      customerName,
      customerAddress,
      customerGSTIN,
      customerState,
      customerStateCode,
      transportationMode,
      vehicleNumber,
      driverName,
      driverPhone,
      distance,
      transporterName,
      transporterGSTIN,
      items
    } = req.body;

    // Calculate totals
    let taxableValue = 0;
    const processedItems = items.map((item, index) => {
      const amount = item.quantity * item.rate;
      taxableValue += amount;
      return {
        slNo: index + 1,
        description: item.description,
        hsnSac: item.hsnSac,
        gstRate: item.gstRate,
        quantity: item.quantity,
        unit: item.unit || 'KG',
        rate: item.rate,
        amount: amount
      };
    });

    // Calculate GST (assuming same state = CGST+SGST, different state = IGST)
    const companySettings = await CompanySettings.findOne();
    const companyState = companySettings?.state || 'Kerala';
    const companyStateCode = companySettings?.stateCode || '32';
    
    let cgst = 0, sgst = 0, igst = 0;
    
    if (customerState === companyState) {
      // Same state - CGST + SGST
      processedItems.forEach(item => {
        const gstAmount = (item.amount * item.gstRate) / 100;
        cgst += gstAmount / 2;
        sgst += gstAmount / 2;
      });
    } else {
      // Different state - IGST
      processedItems.forEach(item => {
        igst += (item.amount * item.gstRate) / 100;
      });
    }

    const totalTax = cgst + sgst + igst;
    const grandTotal = taxableValue + totalTax;
    const amountInWords = numberToWords(Math.round(grandTotal));

    // Generate invoice number
    const lastInvoice = await GSTInvoice.findOne().sort({ createdAt: -1 });
    const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0;
    const invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, '0')}`;

    const invoice = new GSTInvoice({
      invoiceNumber,
      invoiceDate: new Date(),
      supplyDate,
      reverseCharge: reverseCharge || 'No',
      vendorName,
      placeOfSupply,
      customerName,
      customerAddress,
      customerGSTIN,
      customerState,
      customerStateCode,
      transportationMode,
      vehicleNumber,
      driverName,
      driverPhone,
      distance,
      transporterName,
      transporterGSTIN,
      items: processedItems,
      taxableValue: Math.round(taxableValue * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      amountInWords,
      status: 'Generated',
      createdBy: req.user._id
    });

    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const { status, startDate, endDate, search } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (startDate && endDate) {
      query.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await GSTInvoice.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: invoices.length,
      invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message
    });
  }
};

// Get single invoice
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await GSTInvoice.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
};

// Update invoice status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const invoice = await GSTInvoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice status updated',
      invoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message
    });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await GSTInvoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message
    });
  }
};

// Get company settings
exports.getCompanySettings = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      try {
        settings = new CompanySettings({
          companyName: 'Holy Family Polymers',
          address: 'Eruthupuzha, Kooroppada P.O',
          city: 'Kottayam',
          state: 'Kerala',
          pincode: '686502',
          phone: '+91 9876543210',
          email: 'info@holyfamilypolymers.com',
          gstNumber: '32AAHFH5388M1ZX',
          panNumber: 'AAHFH5388M',
          stateCode: '32',
          bankName: 'State Bank of India',
          bankBranch: 'Kooroppada Branch',
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          accountHolderName: 'Holy Family Polymers',
          isSingleton: true
        });
        await settings.save();
      } catch (saveError) {
        // If save fails (maybe due to unique constraint), try to find again
        settings = await CompanySettings.findOne();
        if (!settings) {
          throw saveError;
        }
      }
    }

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company settings',
      error: error.message
    });
  }
};
// Send invoice to user
exports.sendInvoiceToUser = async (req, res) => {
  try {
    const invoice = await GSTInvoice.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Update invoice status to 'Sent'
    invoice.status = 'Sent';
    await invoice.save();

    // Here you could add email sending logic
    // For now, we'll just update the status and return success
    
    res.json({
      success: true,
      message: 'Invoice sent to user successfully',
      invoice
    });
  } catch (error) {
    console.error('Error sending invoice to user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice to user',
      error: error.message
    });
  }
};

// Get user's GST invoices (only sent invoices)
exports.getUserInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const query = { status: 'Sent' }; // Only show invoices that have been sent to users
    
    const invoices = await GSTInvoice.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await GSTInvoice.countDocuments(query);

    res.json({
      success: true,
      count,
      invoices
    });
  } catch (error) {
    console.error('Error fetching user invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user invoices',
      error: error.message
    });
  }
};