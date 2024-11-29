const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const color = type === 'error' ? colors.red : 
                 type === 'success' ? colors.green :
                 type === 'warning' ? colors.yellow : colors.blue;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function checkDependencies(directory) {
    log(`Checking dependencies in ${directory}...`);
    
    if (!fs.existsSync(path.join(directory, 'package.json'))) {
        throw new Error(`No package.json found in ${directory}`);
    }

    try {
        // Check if node_modules exists
        if (!fs.existsSync(path.join(directory, 'node_modules'))) {
            log(`Installing dependencies in ${directory}...`);
            execSync('npm install', { cwd: directory, stdio: 'inherit' });
        }

        // Verify all dependencies are installed correctly
        execSync('npm ls', { cwd: directory, stdio: 'inherit' });
        log(`Dependencies check passed for ${directory}`, 'success');
    } catch (error) {
        log(`Error checking dependencies in ${directory}: ${error.message}`, 'error');
        throw error;
    }
}

function startServer() {
    log('Starting server...');
    const serverProcess = spawn('npm', ['start'], {
        cwd: path.join(__dirname, 'Server'),
        stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
        process.stdout.write(`${colors.blue}[Server] ${colors.reset}${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        process.stderr.write(`${colors.red}[Server Error] ${colors.reset}${data}`);
    });

    return serverProcess;
}

function startClient() {
    log('Starting client...');
    const clientProcess = spawn('npm', ['start'], {
        cwd: path.join(__dirname, 'client'),
        stdio: 'pipe'
    });

    clientProcess.stdout.on('data', (data) => {
        process.stdout.write(`${colors.green}[Client] ${colors.reset}${data}`);
    });

    clientProcess.stderr.on('data', (data) => {
        process.stderr.write(`${colors.red}[Client Error] ${colors.reset}${data}`);
    });

    return clientProcess;
}

async function main() {
    try {
        // Check dependencies for both client and server
        checkDependencies(path.join(__dirname, 'Server'));
        checkDependencies(path.join(__dirname, 'client'));

        // Start server first
        const serverProcess = startServer();
        
        // Wait a bit for server to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Start client
        const clientProcess = startClient();

        // Handle process termination
        process.on('SIGINT', () => {
            log('Shutting down applications...', 'warning');
            serverProcess.kill();
            clientProcess.kill();
            process.exit(0);
        });

        log('\nApplication started successfully!', 'success');
        log('Server is typically available at http://localhost:5000', 'info');
        log('Client is typically available at http://localhost:3000', 'info');
        log('\nPress Ctrl+C to stop all processes', 'info');

    } catch (error) {
        log(`Error starting application: ${error.message}`, 'error');
        process.exit(1);
    }
}

main();
