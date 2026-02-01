const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const configService = require('./configService');
const logger = require('../utils/logger');

// Configurable Servers Root (Default to C:/mcp-servers or local fallback)
const SERVERS_ROOT = process.env.MCP_SERVERS_ROOT || path.resolve(process.cwd(), 'mcp-servers');

/**
 * The MCP Core Engine.
 * Manages the full lifecycle of server installation and registration.
 */
const mcpService = {

    /**
   * Orchestrates the installation of an MCP server.
   * @param {string} userConfigPath - Path to the mcp_config.json
   * @param {string} serverId - Unique identifier for the server (used for folder name)
   * @param {string} packageName - The npm package name
   * @param {function} onStatusUpdate - Callback(status) to report progress
   */
    runFullFlow: async (userConfigPath, serverId, packageName, onStatusUpdate = async () => { }) => {
        logger.info(`[Engine - STUB] Starting flow for: ${packageName} (ID: ${serverId})`);

        // STAGE 1: Validation & Handshake
        if (onStatusUpdate) await onStatusUpdate('validating');
        logger.info('[Stub] Simulating validation (2s delay)...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // STAGE 2: Workspace Preparation
        if (onStatusUpdate) await onStatusUpdate('preparing_workspace');
        logger.info('[Stub] Transitioned to preparing_workspace. Halted for next Sprint.');

        // Logic stops here for this sprint as per requirements.
    },

    /**
     * Validation Stage: Checks config existence and creates backup.
     */
    stage1_validation: async (configPath) => {
        logger.info('[Stage 1] Validating environment...');
        await configService.backupConfig(configPath);
        await configService.loadConfig(configPath);
    },

    /**
     * Workspace Stage: Prepares directory structure.
     */
    stage2_prepareWorkspace: async (serverId) => {
        logger.info(`[Stage 2] Preparing workspace for ${serverId}...`);

        // Sanitize serverId just in case
        const safeName = serverId.replace(/[^a-zA-Z0-9-_]/g, '_');
        const targetDir = path.join(SERVERS_ROOT, safeName);

        if (!fs.existsSync(targetDir)) {
            logger.info(`Creating directory: ${targetDir}`);
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Initialize package.json
        const pkgJsonPath = path.join(targetDir, 'package.json');
        if (!fs.existsSync(pkgJsonPath)) {
            fs.writeFileSync(pkgJsonPath, JSON.stringify({ name: `mcp-${safeName}`, version: "1.0.0" }));
        }

        return targetDir;
    },

    /**
     * Installation Stage: Runs npm install and finds entry point.
     */
    stage3_install: async (packageName, serverDir) => {
        logger.info(`[Stage 3] Installing ${packageName} via NPM...`);

        try {
            execSync(`npm install ${packageName}`, { cwd: serverDir, stdio: 'inherit' });

            const installedPkgJsonPath = path.join(serverDir, 'node_modules', packageName, 'package.json');
            if (!fs.existsSync(installedPkgJsonPath)) {
                // Retry logic or search logic could go here if package name differs from folder
                throw new Error(`Package.json not found for installed module at ${installedPkgJsonPath}`);
            }

            const pkgData = JSON.parse(fs.readFileSync(installedPkgJsonPath, 'utf8'));
            let mainFile = pkgData.main || 'index.js';
            const absEntry = path.resolve(serverDir, 'node_modules', packageName, mainFile);

            logger.info(`Identified entry point: ${absEntry}`);
            return absEntry;

        } catch (error) {
            throw new Error(`Installation failed: ${error.message}`);
        }
    },

    /**
     * Injection Stage: Updates mcp_config.json.
     */
    stage4_injectConfig: async (serverId, entryPoint, configPath) => {
        logger.info('[Stage 4] Injecting configuration...');

        const config = await configService.loadConfig(configPath);

        config.mcpServers = config.mcpServers || {};
        config.mcpServers[serverId] = {
            command: "node",
            args: [entryPoint],
            env: {}
        };

        await configService.saveConfig(configPath, config);
        logger.info(`Configuration injected for key: "${serverId}"`);
    }
};

module.exports = mcpService;
