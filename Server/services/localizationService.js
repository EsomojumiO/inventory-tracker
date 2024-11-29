const axios = require('axios');
const config = require('../config');
const { redis } = require('../utils/cache');

class LocalizationService {
    constructor() {
        this.exchangeRates = new Map();
        this.translations = new Map();
        this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD'];
        this.supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'ja', 'zh'];
        this.defaultCurrency = 'USD';
        this.defaultLanguage = 'en';
    }

    async initialize() {
        await this.loadExchangeRates();
        await this.loadTranslations();
        this.startRateUpdateInterval();
    }

    startRateUpdateInterval() {
        // Update exchange rates every hour
        setInterval(async () => {
            await this.loadExchangeRates();
        }, 3600000);
    }

    async loadExchangeRates() {
        try {
            // Check cache first
            const cachedRates = await redis.get('exchange_rates');
            if (cachedRates) {
                this.exchangeRates = new Map(Object.entries(JSON.parse(cachedRates)));
                return;
            }

            const response = await axios.get(
                `${config.exchangeRate.apiUrl}?base=${this.defaultCurrency}&symbols=${this.supportedCurrencies.join(',')}`
            );

            const rates = response.data.rates;
            this.exchangeRates = new Map(Object.entries(rates));

            // Cache the rates
            await redis.setex('exchange_rates', 3600, JSON.stringify(Object.fromEntries(this.exchangeRates)));
        } catch (error) {
            console.error('Error loading exchange rates:', error);
            throw error;
        }
    }

    async loadTranslations() {
        try {
            for (const lang of this.supportedLanguages) {
                const translations = require(`../locales/${lang}.json`);
                this.translations.set(lang, translations);
            }
        } catch (error) {
            console.error('Error loading translations:', error);
            throw error;
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        try {
            fromCurrency = fromCurrency.toUpperCase();
            toCurrency = toCurrency.toUpperCase();

            if (fromCurrency === toCurrency) {
                return amount;
            }

            if (!this.exchangeRates.has(toCurrency)) {
                throw new Error(`Unsupported currency: ${toCurrency}`);
            }

            const rate = this.exchangeRates.get(toCurrency);
            const convertedAmount = amount * rate;

            return {
                amount: Number(convertedAmount.toFixed(2)),
                currency: toCurrency,
                rate,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error converting currency:', error);
            throw error;
        }
    }

    async convertPrices(products, targetCurrency) {
        try {
            return await Promise.all(products.map(async product => ({
                ...product,
                price: await this.convertCurrency(product.price, product.currency, targetCurrency)
            })));
        } catch (error) {
            console.error('Error converting prices:', error);
            throw error;
        }
    }

    translate(key, language = this.defaultLanguage, replacements = {}) {
        try {
            if (!this.translations.has(language)) {
                language = this.defaultLanguage;
            }

            const translations = this.translations.get(language);
            let translation = this.getNestedTranslation(translations, key);

            if (!translation) {
                console.warn(`Translation missing for key: ${key} in language: ${language}`);
                return key;
            }

            // Replace placeholders
            Object.entries(replacements).forEach(([key, value]) => {
                translation = translation.replace(`{{${key}}}`, value);
            });

            return translation;
        } catch (error) {
            console.error('Error translating text:', error);
            return key;
        }
    }

    getNestedTranslation(translations, key) {
        return key.split('.').reduce((obj, k) => obj?.[k], translations);
    }

    formatNumber(number, language, options = {}) {
        try {
            return new Intl.NumberFormat(language, options).format(number);
        } catch (error) {
            console.error('Error formatting number:', error);
            return number.toString();
        }
    }

    formatCurrency(amount, currency, language) {
        try {
            return new Intl.NumberFormat(language, {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return `${currency} ${amount}`;
        }
    }

    formatDate(date, language, options = {}) {
        try {
            return new Intl.DateTimeFormat(language, options).format(date);
        } catch (error) {
            console.error('Error formatting date:', error);
            return date.toISOString();
        }
    }

    getSupportedCurrencies() {
        return this.supportedCurrencies;
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    async getExchangeRate(fromCurrency, toCurrency) {
        try {
            fromCurrency = fromCurrency.toUpperCase();
            toCurrency = toCurrency.toUpperCase();

            if (fromCurrency === toCurrency) {
                return 1;
            }

            if (!this.exchangeRates.has(toCurrency)) {
                throw new Error(`Unsupported currency: ${toCurrency}`);
            }

            return this.exchangeRates.get(toCurrency);
        } catch (error) {
            console.error('Error getting exchange rate:', error);
            throw error;
        }
    }

    validateCurrency(currency) {
        return this.supportedCurrencies.includes(currency.toUpperCase());
    }

    validateLanguage(language) {
        return this.supportedLanguages.includes(language.toLowerCase());
    }
}

module.exports = new LocalizationService();
