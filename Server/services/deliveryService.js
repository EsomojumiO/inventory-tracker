const axios = require('axios');
const config = require('../config');

class DeliveryService {
    constructor() {
        this.providers = new Map();
        this.initializeProviders();
    }

    initializeProviders() {
        // Initialize supported delivery providers
        this.providers.set('fedex', {
            baseUrl: config.delivery.fedex.baseUrl,
            apiKey: config.delivery.fedex.apiKey,
            async createShipment(orderData) {
                // Implement FedEx shipment creation
                return this.makeRequest('POST', '/shipments', orderData);
            },
            async trackShipment(trackingNumber) {
                return this.makeRequest('GET', `/tracking/${trackingNumber}`);
            }
        });

        this.providers.set('ups', {
            baseUrl: config.delivery.ups.baseUrl,
            apiKey: config.delivery.ups.apiKey,
            async createShipment(orderData) {
                // Implement UPS shipment creation
                return this.makeRequest('POST', '/shipments', orderData);
            },
            async trackShipment(trackingNumber) {
                return this.makeRequest('GET', `/track/${trackingNumber}`);
            }
        });

        this.providers.set('dhl', {
            baseUrl: config.delivery.dhl.baseUrl,
            apiKey: config.delivery.dhl.apiKey,
            async createShipment(orderData) {
                // Implement DHL shipment creation
                return this.makeRequest('POST', '/shipments', orderData);
            },
            async trackShipment(trackingNumber) {
                return this.makeRequest('GET', `/tracking/${trackingNumber}`);
            }
        });
    }

    async createShipment(provider, orderData) {
        try {
            const deliveryProvider = this.providers.get(provider.toLowerCase());
            if (!deliveryProvider) {
                throw new Error(`Unsupported delivery provider: ${provider}`);
            }

            const shipmentData = this.formatShipmentData(orderData, provider);
            const response = await deliveryProvider.createShipment(shipmentData);

            return {
                success: true,
                trackingNumber: response.trackingNumber,
                estimatedDelivery: response.estimatedDelivery,
                cost: response.shippingCost,
                label: response.shippingLabel
            };
        } catch (error) {
            console.error('Error creating shipment:', error);
            throw error;
        }
    }

    async trackShipment(provider, trackingNumber) {
        try {
            const deliveryProvider = this.providers.get(provider.toLowerCase());
            if (!deliveryProvider) {
                throw new Error(`Unsupported delivery provider: ${provider}`);
            }

            const trackingInfo = await deliveryProvider.trackShipment(trackingNumber);
            return this.standardizeTrackingResponse(trackingInfo);
        } catch (error) {
            console.error('Error tracking shipment:', error);
            throw error;
        }
    }

    async getShippingRates(provider, packageDetails) {
        try {
            const deliveryProvider = this.providers.get(provider.toLowerCase());
            if (!deliveryProvider) {
                throw new Error(`Unsupported delivery provider: ${provider}`);
            }

            const rates = await deliveryProvider.getRates(packageDetails);
            return this.standardizeRatesResponse(rates);
        } catch (error) {
            console.error('Error getting shipping rates:', error);
            throw error;
        }
    }

    formatShipmentData(orderData, provider) {
        // Format order data according to provider's requirements
        const baseShipmentData = {
            sender: {
                name: orderData.sender.name,
                address: orderData.sender.address,
                phone: orderData.sender.phone,
                email: orderData.sender.email
            },
            recipient: {
                name: orderData.recipient.name,
                address: orderData.recipient.address,
                phone: orderData.recipient.phone,
                email: orderData.recipient.email
            },
            package: {
                weight: orderData.package.weight,
                dimensions: orderData.package.dimensions,
                items: orderData.package.items
            },
            service: orderData.service
        };

        // Provider-specific formatting
        switch (provider.toLowerCase()) {
            case 'fedex':
                return this.formatFedExShipment(baseShipmentData);
            case 'ups':
                return this.formatUPSShipment(baseShipmentData);
            case 'dhl':
                return this.formatDHLShipment(baseShipmentData);
            default:
                return baseShipmentData;
        }
    }

    standardizeTrackingResponse(trackingInfo) {
        return {
            trackingNumber: trackingInfo.trackingNumber,
            status: this.standardizeStatus(trackingInfo.status),
            estimatedDelivery: trackingInfo.estimatedDelivery,
            currentLocation: {
                city: trackingInfo.location?.city,
                state: trackingInfo.location?.state,
                country: trackingInfo.location?.country
            },
            events: trackingInfo.events.map(event => ({
                timestamp: event.timestamp,
                location: event.location,
                status: this.standardizeStatus(event.status),
                description: event.description
            }))
        };
    }

    standardizeStatus(providerStatus) {
        // Map provider-specific status to standard status
        const statusMap = {
            // FedEx statuses
            'in_transit': 'IN_TRANSIT',
            'delivered': 'DELIVERED',
            'exception': 'EXCEPTION',
            // UPS statuses
            'IN_TRANSIT': 'IN_TRANSIT',
            'DELIVERED': 'DELIVERED',
            'EXCEPTION': 'EXCEPTION',
            // DHL statuses
            'transit': 'IN_TRANSIT',
            'delivered': 'DELIVERED',
            'failed': 'EXCEPTION'
        };

        return statusMap[providerStatus] || 'UNKNOWN';
    }

    standardizeRatesResponse(rates) {
        return rates.map(rate => ({
            service: rate.service,
            cost: rate.cost,
            currency: rate.currency,
            estimatedDays: rate.estimatedDays,
            provider: rate.provider
        }));
    }

    async makeRequest(method, endpoint, data = null) {
        try {
            const response = await axios({
                method,
                url: `${this.baseUrl}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                data
            });
            return response.data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Provider-specific formatting methods
    formatFedExShipment(baseData) {
        return {
            shipper: {
                contact: {
                    personName: baseData.sender.name,
                    phoneNumber: baseData.sender.phone,
                    emailAddress: baseData.sender.email
                },
                address: this.formatFedExAddress(baseData.sender.address)
            },
            recipients: [{
                contact: {
                    personName: baseData.recipient.name,
                    phoneNumber: baseData.recipient.phone,
                    emailAddress: baseData.recipient.email
                },
                address: this.formatFedExAddress(baseData.recipient.address)
            }],
            packageCount: 1,
            requestedShipment: {
                shipTimestamp: new Date().toISOString(),
                dropoffType: 'REGULAR_PICKUP',
                serviceType: baseData.service,
                packagingType: 'YOUR_PACKAGING',
                weight: {
                    units: 'LB',
                    value: baseData.package.weight
                },
                dimensions: {
                    length: baseData.package.dimensions.length,
                    width: baseData.package.dimensions.width,
                    height: baseData.package.dimensions.height,
                    units: 'IN'
                }
            }
        };
    }

    formatUPSShipment(baseData) {
        // Implement UPS-specific formatting
        return baseData;
    }

    formatDHLShipment(baseData) {
        // Implement DHL-specific formatting
        return baseData;
    }

    formatFedExAddress(address) {
        return {
            streetLines: [address.street1, address.street2].filter(Boolean),
            city: address.city,
            stateOrProvinceCode: address.state,
            postalCode: address.postalCode,
            countryCode: address.countryCode
        };
    }
}

module.exports = new DeliveryService();
