/**
 * Generate HTML Test Report for Accountant CRUD Tests
 */

const fs = require('fs');
const path = require('path');

function generateHTMLReport(results) {
  const { total, passed, failed, duration, results: testResults } = results;
  const passRate = ((passed / total) * 100).toFixed(2);
  const timestamp = new Date().toLocaleString();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accountant CRUD Test Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }

        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }

        .summary-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .summary-card .label {
            font-size: 0.9em;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }

        .summary-card .value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .summary-card.total .value {
            color: #667eea;
        }

        .summary-card.passed .value {
            color: #10b981;
        }

        .summary-card.failed .value {
            color: #ef4444;
        }

        .summary-card.duration .value {
            color: #f59e0b;
            font-size: 2em;
        }

        .progress-bar {
            margin: 0 40px 40px;
            background: #e5e7eb;
            border-radius: 50px;
            height: 30px;
            overflow: hidden;
            position: relative;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            transition: width 1s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.9em;
        }

        .test-results {
            padding: 0 40px 40px;
        }

        .test-results h2 {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #1f2937;
        }

        .test-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        }

        .test-item:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .test-item.pass {
            border-left: 4px solid #10b981;
        }

        .test-item.fail {
            border-left: 4px solid #ef4444;
        }

        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .test-name {
            font-size: 1.2em;
            font-weight: 600;
            color: #1f2937;
        }

        .test-status {
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            text-transform: uppercase;
        }

        .test-status.pass {
            background: #d1fae5;
            color: #065f46;
        }

        .test-status.fail {
            background: #fee2e2;
            color: #991b1b;
        }

        .test-details {
            display: flex;
            gap: 20px;
            color: #6c757d;
            font-size: 0.9em;
        }

        .test-message {
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            font-size: 0.9em;
            color: #495057;
        }

        .test-message.error {
            background: #fee2e2;
            color: #991b1b;
        }

        .footer {
            background: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            color: #6c757d;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
            margin-left: 10px;
        }

        .badge.crud {
            background: #dbeafe;
            color: #1e40af;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
            }

            .test-item {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Accountant CRUD Test Report</h1>
            <p>Comprehensive Testing for Accountant Role - All CRUD Operations</p>
            <p style="margin-top: 10px; font-size: 0.9em;">Generated: ${timestamp}</p>
        </div>

        <div class="summary">
            <div class="summary-card total">
                <div class="label">Total Tests</div>
                <div class="value">${total}</div>
            </div>
            <div class="summary-card passed">
                <div class="label">Passed</div>
                <div class="value">${passed}</div>
            </div>
            <div class="summary-card failed">
                <div class="label">Failed</div>
                <div class="value">${failed}</div>
            </div>
            <div class="summary-card duration">
                <div class="label">Duration</div>
                <div class="value">${(duration / 1000).toFixed(2)}s</div>
            </div>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width: ${passRate}%">
                ${passRate}% Pass Rate
            </div>
        </div>

        <div class="test-results">
            <h2>Test Results <span class="badge crud">CRUD Operations</span></h2>
            ${testResults.map((test, index) => `
                <div class="test-item ${test.status.toLowerCase()}">
                    <div class="test-header">
                        <div class="test-name">${index + 1}. ${test.testName}</div>
                        <div class="test-status ${test.status.toLowerCase()}">${test.status}</div>
                    </div>
                    <div class="test-details">
                        <span>⏱️ Duration: ${test.duration}ms</span>
                        <span>🕐 ${new Date(test.timestamp).toLocaleTimeString()}</span>
                    </div>
                    ${test.message ? `
                        <div class="test-message ${test.status === 'FAIL' ? 'error' : ''}">
                            ${test.message}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p><strong>Test Coverage:</strong> Login, Salary Management (Create, Read, Update), Attendance Management, Latex Billing, Rate Management, Logout</p>
            <p style="margin-top: 10px;">Holy Family Polymers - Accountant Module Testing</p>
        </div>
    </div>
</body>
</html>
  `;

  return html;
}

// Main function
function main() {
  const resultsPath = './test-results/accountant-crud-test-results.json';
  const reportPath = './test-results/accountant-crud-test-report.html';

  // Check if results file exists
  if (!fs.existsSync(resultsPath)) {
    console.error('Error: Test results file not found. Please run the tests first.');
    process.exit(1);
  }

  // Read test results
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

  // Generate HTML report
  const html = generateHTMLReport(results);

  // Write report to file
  fs.writeFileSync(reportPath, html);

  console.log('\n✅ HTML Test Report Generated Successfully!');
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log(`\n📊 Test Summary:`);
  console.log(`   Total: ${results.total}`);
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Pass Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  console.log(`   Duration: ${(results.duration / 1000).toFixed(2)}s\n`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateHTMLReport };
