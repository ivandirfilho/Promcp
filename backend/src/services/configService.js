const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 200;

/**
 * Helper to ensure a file operation succeeds even if locked temporarily.
 * @param {Function} operation - The fs operation to perform
 * @returns {Promise<any>}
 */
async function withRetry(operation) {
  let lastError;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return operation();
    } catch (error) {
      lastError = error;
      // Check for common locking errors
      if (error.code === 'EBUSY' || error.code === 'EPERM') {
        logger.warn(`File locked, retrying (${i + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Operation failed after ${MAX_RETRIES} retries. Last error: ${lastError.message}`);
}

/**
 * Service to manage MCP configuration.
 * Includes backup and retry logic for robustness.
 */
const configService = {
  /**
   * Reads the configuration file.
   * @param {string} configPath - Path to mcp_config.json
   * @returns {Promise<object>} Parsed JSON configuration
   */
  loadConfig: async (configPath) => {
    return withRetry(() => {
      if (!fs.existsSync(configPath)) {
        throw new Error(`Config file not found at: ${configPath}`);
      }
      const data = fs.readFileSync(configPath, 'utf8');
      logger.info(`Config loaded from ${configPath}`);
      return JSON.parse(data);
    });
  },

  /**
   * Creates a backup of the configuration file.
   * @param {string} configPath - Path to mcp_config.json
   */
  backupConfig: async (configPath) => {
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.bak`;
      await withRetry(() => {
        fs.copyFileSync(configPath, backupPath);
      });
      logger.info(`Backup created at: ${backupPath}`);
    }
  },

  /**
   * Saves the configuration file.
   * @param {string} configPath - Path to mcp_config.json
   * @param {object} data - Configuration object to save
   */
  saveConfig: async (configPath, data) => {
    await withRetry(() => {
      // Atomic write via temp file (safer than direct write)
      const tempPath = `${configPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      try {
        fs.renameSync(tempPath, configPath);
      } catch (err) {
        // Clean up temp if rename fails
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        throw err;
      }
    });
    logger.info(`Config saved to: ${configPath}`);
  }
};

module.exports = configService;
