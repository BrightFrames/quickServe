#!/usr/bin/env node

/**
 * Quick Start Script for Security Testing Suite
 * Sets up test environment and runs comprehensive security tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function banner(text) {
  const width = 80;
  const padding = Math.floor((width - text.length) / 2);
  console.log('\n' + '='.repeat(width));
  console.log(' '.repeat(padding) + text);
  console.log('='.repeat(width) + '\n');
}

async function checkDependencies() {
  log('📦 Checking dependencies...', 'cyan');
  
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    
    const requiredDeps = ['jest', 'supertest'];
    const missing = [];
    
    for (const dep of requiredDeps) {
      if (!packageJson.devDependencies?.[dep]) {
        missing.push(dep);
      }
    }
    
    if (missing.length > 0) {
      log(`⚠️  Missing dependencies: ${missing.join(', ')}`, 'yellow');
      log('📥 Installing dependencies...', 'cyan');
      
      await execAsync('npm install --save-dev jest supertest', {
        cwd: __dirname
      });
      
      log('✅ Dependencies installed', 'green');
    } else {
      log('✅ All dependencies present', 'green');
    }
  } catch (error) {
    log(`❌ Error checking dependencies: ${error.message}`, 'red');
    throw error;
  }
}

async function checkEnvironment() {
  log('🔍 Checking environment configuration...', 'cyan');
  
  try {
    const envPath = path.join(__dirname, '.env');
    
    try {
      await fs.access(envPath);
      log('✅ .env file found', 'green');
    } catch {
      log('⚠️  .env file not found - using defaults', 'yellow');
    }
    
    // Check database connection
    log('🔗 Testing database connection...', 'cyan');
    
    const { default: sequelize } = await import('./config/database.js');
    
    await sequelize.authenticate();
    log('✅ Database connection successful', 'green');
    await sequelize.close();
  } catch (error) {
    log(`❌ Environment check failed: ${error.message}`, 'red');
    log('ℹ️  Make sure PostgreSQL is running and .env is configured', 'yellow');
    throw error;
  }
}

async function runTests(options = {}) {
  banner('🔒 QUICKSERVE SECURITY TEST SUITE');
  
  try {
    await checkDependencies();
    await checkEnvironment();
    
    log('🚀 Starting security tests...', 'cyan');
    console.log('');
    
    const testCommand = options.watch 
      ? 'npm run test:watch'
      : options.coverage
      ? 'npm run test:coverage'
      : options.specific
      ? `npx jest ${options.specific} --detectOpenHandles`
      : 'npm run test:security';
    
    log(`Running: ${testCommand}`, 'blue');
    console.log('');
    
    const { stdout, stderr } = await execAsync(testCommand, {
      cwd: __dirname,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for test output
    });
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('');
    banner('✅ TEST SUITE COMPLETED');
    
    // Check for generated report
    const reportPath = path.join(__dirname, 'security-test-report.json');
    try {
      await fs.access(reportPath);
      log(`📄 Security report saved: ${reportPath}`, 'green');
      
      const report = JSON.parse(await fs.readFile(reportPath, 'utf-8'));
      console.log('');
      log('📊 Summary:', 'bright');
      log(`   Passed: ${report.summary?.passed || 0}`, 'green');
      log(`   Failed: ${report.summary?.failed || 0}`, report.summary?.failed > 0 ? 'red' : 'green');
      log(`   Critical Issues: ${report.vulnerabilities?.critical || 0}`, 'red');
      log(`   High Severity: ${report.vulnerabilities?.high || 0}`, 'yellow');
    } catch {
      // Report not generated yet
    }
    
  } catch (error) {
    console.log('');
    banner('❌ TEST SUITE FAILED');
    log(error.message, 'red');
    process.exit(1);
  }
}

async function showUsage() {
  console.log(`
${colors.bright}QuickServe Security Testing Suite${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node quickstart-tests.js [options]

${colors.cyan}Options:${colors.reset}
  --help              Show this help message
  --watch             Run tests in watch mode (re-run on changes)
  --coverage          Run tests with coverage report
  --auth              Run only authentication tests
  --menu              Run only menu isolation tests
  --orders            Run only orders isolation tests
  --settings          Run only settings/analytics tests

${colors.cyan}Examples:${colors.reset}
  node quickstart-tests.js                    ${colors.reset}# Run all tests
  node quickstart-tests.js --watch            ${colors.reset}# Watch mode
  node quickstart-tests.js --coverage         ${colors.reset}# With coverage
  node quickstart-tests.js --auth             ${colors.reset}# Auth tests only

${colors.cyan}Test Files:${colors.reset}
  tests/auth.test.js                         ${colors.reset}# Authentication & tokens
  tests/menuIsolation.test.js                ${colors.reset}# Menu multi-tenant isolation
  tests/ordersIsolation.test.js              ${colors.reset}# Orders isolation & RBAC
  tests/settingsIsolation.test.js            ${colors.reset}# Analytics & settings RBAC

${colors.cyan}Manual Commands:${colors.reset}
  npm run test:security                      ${colors.reset}# Run all tests
  npm run test:watch                         ${colors.reset}# Watch mode
  npm run test:coverage                      ${colors.reset}# Coverage report
  npx jest tests/auth.test.js                ${colors.reset}# Specific test file

${colors.cyan}Documentation:${colors.reset}
  tests/TESTING_GUIDE.md                     ${colors.reset}# Complete testing guide
  SECURITY_AUDIT_REPORT.md                   ${colors.reset}# Security audit results
  RBAC_IMPLEMENTATION_GUIDE.md               ${colors.reset}# RBAC permissions matrix
  `);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

const options = {
  watch: args.includes('--watch'),
  coverage: args.includes('--coverage'),
  specific: args.includes('--auth') ? 'tests/auth.test.js'
          : args.includes('--menu') ? 'tests/menuIsolation.test.js'
          : args.includes('--orders') ? 'tests/ordersIsolation.test.js'
          : args.includes('--settings') ? 'tests/settingsIsolation.test.js'
          : null
};

// Run tests
runTests(options);
