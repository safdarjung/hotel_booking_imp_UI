/**
 * Development Script
 * 
 * This script runs both the backend Flask API and the frontend Vite development server
 * in parallel, making it easier to work on the full stack application.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const BACKEND_COMMAND = process.platform === 'win32' ? 'python' : 'python3';
const BACKEND_SCRIPT = 'api.py';
const FRONTEND_DIR = 'frontend';
const FRONTEND_COMMAND = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const FRONTEND_SCRIPT = 'run dev';

// Colors for terminal output
const colors = {
  backend: '\x1b[36m', // Cyan
  frontend: '\x1b[35m', // Magenta
  info: '\x1b[32m',     // Green
  error: '\x1b[31m',    // Red
  reset: '\x1b[0m'      // Reset
};

// Helper to log with timestamp and colors
function log(prefix, message, color) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${prefix}] ${message}${colors.reset}`);
}

// Start the backend server
function startBackend() {
  log('INFO', 'Starting the backend Flask API...', colors.info);
  
  const backend = spawn(BACKEND_COMMAND, [BACKEND_SCRIPT]);
  
  backend.stdout.on('data', (data) => {
    log('BACKEND', data.toString().trim(), colors.backend);
  });
  
  backend.stderr.on('data', (data) => {
    log('BACKEND', data.toString().trim(), colors.backend);
  });
  
  backend.on('error', (error) => {
    log('ERROR', `Failed to start backend: ${error.message}`, colors.error);
  });
  
  backend.on('close', (code) => {
    if (code !== 0) {
      log('ERROR', `Backend process exited with code ${code}`, colors.error);
    }
    log('INFO', 'Backend process terminated', colors.info);
  });
  
  return backend;
}

// Start the frontend server
function startFrontend() {
  log('INFO', 'Starting the frontend Vite development server...', colors.info);
  
  const frontend = spawn(FRONTEND_COMMAND, FRONTEND_SCRIPT.split(' '), {
    cwd: path.join(__dirname, FRONTEND_DIR),
    shell: true
  });
  
  frontend.stdout.on('data', (data) => {
    log('FRONTEND', data.toString().trim(), colors.frontend);
  });
  
  frontend.stderr.on('data', (data) => {
    log('FRONTEND', data.toString().trim(), colors.frontend);
  });
  
  frontend.on('error', (error) => {
    log('ERROR', `Failed to start frontend: ${error.message}`, colors.error);
  });
  
  frontend.on('close', (code) => {
    if (code !== 0) {
      log('ERROR', `Frontend process exited with code ${code}`, colors.error);
    }
    log('INFO', 'Frontend process terminated', colors.info);
  });
  
  return frontend;
}

// Handle process termination
function setupProcessHandlers(backendProcess, frontendProcess) {
  process.on('SIGINT', () => {
    log('INFO', 'Shutting down all processes...', colors.info);
    
    // Kill both processes
    if (backendProcess) backendProcess.kill();
    if (frontendProcess) frontendProcess.kill();
  });
}

// Main function
function main() {
  log('INFO', '=== Starting Development Environment ===', colors.info);
  log('INFO', 'Press Ctrl+C to stop all processes', colors.info);
  
  const backendProcess = startBackend();
  
  // Give the backend a moment to start before launching the frontend
  setTimeout(() => {
    const frontendProcess = startFrontend();
    setupProcessHandlers(backendProcess, frontendProcess);
  }, 2000);
}

// Run the main function
main(); 