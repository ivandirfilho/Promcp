const { exec } = require('child_process');

/**
 * Service to manage MCP package installations.
 */
const installService = {
    /**
     * Installs an npm package.
     * @param {string} packageName - Name of the package to install
     * @returns {Promise<string>} Output of the installation command
     */
    installPackage: (packageName) => {
        return new Promise((resolve, reject) => {
            console.log(`Installing package: ${packageName}...`);
            exec(`npm install ${packageName}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error installing ${packageName}:`, stderr);
                    reject(error);
                    return;
                }
                console.log(`Successfully installed ${packageName}`);
                resolve(stdout);
            });
        });
    }
};

module.exports = installService;
