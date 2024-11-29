const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');

class PluginManager extends EventEmitter {
    constructor() {
        super();
        this.plugins = new Map();
        this.hooks = new Map();
        this.pluginDir = path.join(__dirname, 'installed');
    }

    /**
     * Initialize the plugin manager and load all installed plugins
     */
    async initialize() {
        try {
            await this.ensurePluginDirectory();
            await this.loadPlugins();
        } catch (error) {
            console.error('Failed to initialize plugin manager:', error);
            throw error;
        }
    }

    /**
     * Ensure the plugin directory exists
     */
    async ensurePluginDirectory() {
        try {
            await fs.access(this.pluginDir);
        } catch {
            await fs.mkdir(this.pluginDir, { recursive: true });
        }
    }

    /**
     * Load all plugins from the plugin directory
     */
    async loadPlugins() {
        try {
            const files = await fs.readdir(this.pluginDir);
            for (const file of files) {
                if (file.endsWith('.js')) {
                    await this.loadPlugin(file);
                }
            }
        } catch (error) {
            console.error('Error loading plugins:', error);
            throw error;
        }
    }

    /**
     * Load a specific plugin
     */
    async loadPlugin(filename) {
        try {
            const pluginPath = path.join(this.pluginDir, filename);
            const plugin = require(pluginPath);

            if (typeof plugin.initialize !== 'function') {
                throw new Error(`Plugin ${filename} does not have an initialize function`);
            }

            const pluginInstance = await plugin.initialize(this);
            this.plugins.set(plugin.name, pluginInstance);
            console.log(`Plugin ${plugin.name} loaded successfully`);
        } catch (error) {
            console.error(`Error loading plugin ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Register a hook for plugins to extend functionality
     */
    registerHook(name, callback) {
        if (!this.hooks.has(name)) {
            this.hooks.set(name, new Set());
        }
        this.hooks.get(name).add(callback);
    }

    /**
     * Unregister a hook
     */
    unregisterHook(name, callback) {
        if (this.hooks.has(name)) {
            this.hooks.get(name).delete(callback);
        }
    }

    /**
     * Execute all registered callbacks for a hook
     */
    async executeHook(name, ...args) {
        if (!this.hooks.has(name)) {
            return [];
        }

        const results = [];
        for (const callback of this.hooks.get(name)) {
            try {
                const result = await callback(...args);
                results.push(result);
            } catch (error) {
                console.error(`Error executing hook ${name}:`, error);
            }
        }
        return results;
    }

    /**
     * Install a new plugin
     */
    async installPlugin(pluginPath) {
        try {
            const pluginName = path.basename(pluginPath);
            const targetPath = path.join(this.pluginDir, pluginName);
            
            // Copy plugin file to plugins directory
            await fs.copyFile(pluginPath, targetPath);
            
            // Load the newly installed plugin
            await this.loadPlugin(pluginName);
            
            this.emit('pluginInstalled', pluginName);
            return true;
        } catch (error) {
            console.error('Error installing plugin:', error);
            throw error;
        }
    }

    /**
     * Uninstall a plugin
     */
    async uninstallPlugin(pluginName) {
        try {
            const plugin = this.plugins.get(pluginName);
            if (!plugin) {
                throw new Error(`Plugin ${pluginName} not found`);
            }

            // Call cleanup if plugin has it
            if (typeof plugin.cleanup === 'function') {
                await plugin.cleanup();
            }

            // Remove plugin from memory
            this.plugins.delete(pluginName);

            // Remove plugin file
            const pluginPath = path.join(this.pluginDir, `${pluginName}.js`);
            await fs.unlink(pluginPath);

            this.emit('pluginUninstalled', pluginName);
            return true;
        } catch (error) {
            console.error('Error uninstalling plugin:', error);
            throw error;
        }
    }

    /**
     * Get all installed plugins
     */
    getInstalledPlugins() {
        return Array.from(this.plugins.keys());
    }

    /**
     * Check if a plugin is installed
     */
    isPluginInstalled(pluginName) {
        return this.plugins.has(pluginName);
    }

    /**
     * Get a specific plugin instance
     */
    getPlugin(pluginName) {
        return this.plugins.get(pluginName);
    }
}

module.exports = new PluginManager();
