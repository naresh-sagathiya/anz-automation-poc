/** CSV and JSON transaction-report generation for web test evidence. */
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join, resolve } from 'path';
 
export interface PersonDetails {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}
 
export interface Transaction {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  amount?: number;
  [key: string]: any;
}
 
export class TransactionReportGenerator {
  private downloadsDir = resolve(__dirname, '..', 'web', 'downloads');

  /** Creates the format-specific report directory and returns its output path. */
  private async getExportPath(format: 'csv' | 'json', filename: string): Promise<string> {
    const directory = join(this.downloadsDir, format);
    await mkdir(directory, { recursive: true });
    return join(directory, filename);
  }
 
  /**
   * Export transactions to CSV file with complete person details
   */
  async exportToCSV(
    personDetails: PersonDetails,
    transactions: Transaction[],
    filename?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const csvFilename = filename || `transaction-report-${timestamp}.csv`;
    const filepath = await this.getExportPath('csv', csvFilename);
 
    return new Promise((resolve, reject) => {
      try {
        const stream = createWriteStream(filepath);
 
        // Write title and generated date
        stream.write('='.repeat(100) + '\n');
        stream.write('COMPREHENSIVE TRANSACTION REPORT WITH PERSON DETAILS\n');
        stream.write('='.repeat(100) + '\n\n');
        stream.write(`Report Generated: ${new Date().toLocaleString()}\n`);
        stream.write(`Report Generated ISO: ${new Date().toISOString()}\n\n`);
 
        // ===== PERSON DETAILS SECTION =====
        stream.write('='.repeat(100) + '\n');
        stream.write('PERSON DETAILS (ACCOUNT HOLDER)\n');
        stream.write('='.repeat(100) + '\n\n');
        
        stream.write('Full Name,' + (personDetails.fullName || 'N/A') + '\n');
        stream.write('First Name,' + (personDetails.firstName || 'N/A') + '\n');
        stream.write('Last Name,' + (personDetails.lastName || 'N/A') + '\n\n');
 
        // ===== CONTACT DETAILS SECTION =====
        stream.write('='.repeat(100) + '\n');
        stream.write('CONTACT DETAILS\n');
        stream.write('='.repeat(100) + '\n\n');
        
        stream.write('Email Address,' + (personDetails.email || 'N/A') + '\n');
        stream.write('Phone Number,' + (personDetails.phone || 'N/A') + '\n\n');
 
        // ===== ADDRESS DETAILS SECTION =====
        stream.write('='.repeat(100) + '\n');
        stream.write('ADDRESS DETAILS\n');
        stream.write('='.repeat(100) + '\n\n');
        
        stream.write('Street Address,' + (personDetails.address || 'N/A') + '\n');
        stream.write('City,' + (personDetails.city || 'N/A') + '\n');
        stream.write('State,' + (personDetails.state || 'N/A') + '\n');
        stream.write('Zip Code,' + (personDetails.zipCode || 'N/A') + '\n\n');
 
        // ===== TRANSACTION DETAILS SECTION =====
        stream.write('='.repeat(100) + '\n');
        stream.write(`TRANSACTION DETAILS (Total: ${transactions.length} transactions)\n`);
        stream.write('='.repeat(100) + '\n\n');
 
        // Write transaction header with clear columns
        stream.write('Transaction #,Date,Description,Debit Amount,Credit Amount,Net Amount,Transaction Type\n');
        stream.write('-'.repeat(100) + '\n');
 
        // Write transaction data with enhanced formatting
        transactions.forEach((transaction, index) => {
          const date = this.escapeCSV(transaction.date || 'N/A');
          const description = this.escapeCSV(transaction.description || 'N/A');
          const debit = transaction.debit || 0;
          const credit = transaction.credit || 0;
          const amount = transaction.amount || Math.max(debit, credit);
          const transactionType = debit > 0 ? 'DEBIT' : (credit > 0 ? 'CREDIT' : 'OTHER');
 
          stream.write(`${index + 1},${date},${description},$${debit},$${credit},$${amount},${transactionType}\n`);
        });
 
        // ===== SUMMARY SECTION =====
        stream.write('\n' + '='.repeat(100) + '\n');
        stream.write('TRANSACTION SUMMARY\n');
        stream.write('='.repeat(100) + '\n\n');
 
        // Calculate totals
        const totalDebits = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
        const totalCredits = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
        const netAmount = totalCredits - totalDebits;
 
        stream.write(`Total Number of Transactions,${transactions.length}\n`);
        stream.write(`Total Debit Amount,$${totalDebits.toFixed(2)}\n`);
        stream.write(`Total Credit Amount,$${totalCredits.toFixed(2)}\n`);
        stream.write(`Net Amount (Credits - Debits),$${netAmount.toFixed(2)}\n\n`);
 
        // ===== FILE METADATA =====
        stream.write('='.repeat(100) + '\n');
        stream.write('FILE METADATA\n');
        stream.write('='.repeat(100) + '\n\n');
        stream.write(`Report Type,Comprehensive Transaction Report\n`);
        stream.write(`Report Date,${new Date().toLocaleDateString()}\n`);
        stream.write(`Report Time,${new Date().toLocaleTimeString()}\n`);
        stream.write(`Report Timestamp,${new Date().toISOString()}\n`);
        stream.write(`Account Holder,${personDetails.fullName || 'N/A'}\n\n`);
        stream.write('='.repeat(100) + '\n');
 
        stream.end();
 
        stream.on('finish', () => {
          console.log(`✓ CSV Report exported to: ${filepath}`);
          resolve(filepath);
        });
 
        stream.on('error', (error) => {
          console.error(`✗ Failed to export CSV: ${error.message}`);
          reject(error);
        });
      } catch (error) {
        console.error(`✗ Error creating CSV file: ${error}`);
        reject(error);
      }
    });
  }
 
  /**
   * Export detailed JSON report
   */
  async exportToJSON(
    personDetails: PersonDetails,
    transactions: Transaction[],
    filename?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const jsonFilename = filename || `transaction-report-${timestamp}.json`;
    const filepath = await this.getExportPath('json', jsonFilename);
 
    const report = {
      metadata: {
        title: 'Transaction Report with Person Details',
        generated: new Date().toISOString(),
        transactionCount: transactions.length,
      },
      personDetails,
      transactions,
    };
 
    return new Promise((resolve, reject) => {
      try {
        const fs = require('fs').promises;
        fs.writeFile(filepath, JSON.stringify(report, null, 2))
          .then(() => {
            console.log(`✓ JSON Report exported to: ${filepath}`);
            resolve(filepath);
          })
          .catch((error: any) => {
            console.error(`✗ Failed to export JSON: ${error.message}`);
            reject(error);
          });
      } catch (error) {
        console.error(`✗ Error creating JSON file: ${error}`);
        reject(error);
      }
    });
  }
 
  /**
    * Quotes CSV values that contain separators, quotes, or line breaks.
   */
  private escapeCSV(value: string): string {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
 
export const transactionReportGenerator = new TransactionReportGenerator();
 
 