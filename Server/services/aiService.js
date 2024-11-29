const tf = require('@tensorflow/tfjs-node');
const moment = require('moment');

class AIService {
    constructor() {
        this.salesModel = null;
        this.recommendationModel = null;
        this.demandModel = null;
        this.scaler = null;
    }

    async initialize() {
        await this.loadModels();
    }

    async loadModels() {
        try {
            // Load pre-trained models if they exist
            this.salesModel = await tf.loadLayersModel('file://./models/sales_forecast_model/model.json');
            this.recommendationModel = await tf.loadLayersModel('file://./models/recommendation_model/model.json');
            this.demandModel = await tf.loadLayersModel('file://./models/demand_prediction_model/model.json');
        } catch (error) {
            console.log('Models not found, will be trained on first use');
        }
    }

    preprocessData(data) {
        // Convert data to tensor
        const tensor = tf.tensor2d(data);
        
        // Standardize the data
        const mean = tensor.mean(0);
        const std = tensor.std(0);
        const standardized = tensor.sub(mean).div(std);
        
        // Save scaling parameters
        this.scaler = { mean, std };
        
        return standardized;
    }

    // Inverse transform the standardized data
    inverseTransform(standardized) {
        if (!this.scaler) {
            throw new Error('Scaler not initialized. Call preprocessData first.');
        }
        return standardized.mul(this.scaler.std).add(this.scaler.mean);
    }

    async trainSalesForecastModel(historicalData) {
        const sequenceLength = 30; // 30 days of historical data
        const features = ['dayOfWeek', 'month', 'holiday', 'promotion', 'previousSales'];
        
        // Prepare training data
        const X = [];
        const y = [];
        
        for (let i = sequenceLength; i < historicalData.length; i++) {
            const sequence = historicalData.slice(i - sequenceLength, i);
            const target = historicalData[i].sales;
            
            const featureVector = sequence.map(day => [
                moment(day.date).day(),
                moment(day.date).month(),
                day.isHoliday ? 1 : 0,
                day.hasPromotion ? 1 : 0,
                day.sales
            ]);
            
            X.push(featureVector);
            y.push(target);
        }

        // Normalize data
        const scaledX = this.preprocessData(X);
        
        // Create and train model
        this.salesModel = tf.sequential({
            layers: [
                tf.layers.lstm({
                    units: 64,
                    returnSequences: true,
                    inputShape: [sequenceLength, features.length]
                }),
                tf.layers.dropout(0.2),
                tf.layers.lstm({
                    units: 32,
                    returnSequences: false
                }),
                tf.layers.dense({
                    units: 1,
                    activation: 'linear'
                })
            ]
        });

        this.salesModel.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError'
        });

        await this.salesModel.fit(
            scaledX,
            tf.tensor2d(y, [y.length, 1]),
            {
                epochs: 50,
                batchSize: 32,
                validationSplit: 0.2,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}`);
                    }
                }
            }
        );

        // Save the trained model
        await this.salesModel.save('file://./models/sales_forecast_model');
    }

    async predictSales(historicalData, daysToForecast = 30) {
        if (!this.salesModel) {
            await this.trainSalesForecastModel(historicalData);
        }

        const predictions = [];
        let currentInput = historicalData.slice(-30); // Last 30 days

        for (let i = 0; i < daysToForecast; i++) {
            const featureVector = currentInput.map(day => [
                moment(day.date).day(),
                moment(day.date).month(),
                day.isHoliday ? 1 : 0,
                day.hasPromotion ? 1 : 0,
                day.sales
            ]);

            const scaledInput = this.preprocessData([featureVector]);
            const prediction = this.salesModel.predict(scaledInput);
            const predictedSales = prediction.dataSync()[0];

            const nextDate = moment(currentInput[currentInput.length - 1].date).add(1, 'day');
            predictions.push({
                date: nextDate.format('YYYY-MM-DD'),
                predictedSales: Math.round(predictedSales),
                confidence: this.calculateConfidence(predictedSales, currentInput)
            });

            // Update input for next prediction
            currentInput.shift();
            currentInput.push({
                date: nextDate.format('YYYY-MM-DD'),
                sales: predictedSales,
                isHoliday: this.isHoliday(nextDate),
                hasPromotion: false
            });
        }

        return predictions;
    }

    async generateProductRecommendations(customer, products, transactions) {
        // Collaborative Filtering with Matrix Factorization
        const userProductMatrix = this.buildUserProductMatrix(transactions);
        const recommendations = await this.collaborativeFilter(customer, userProductMatrix);
        
        // Content-based filtering
        const contentBasedRecs = this.contentBasedFilter(customer, products, transactions);
        
        // Hybrid recommendations (combine both approaches)
        return this.hybridRecommendations(recommendations, contentBasedRecs);
    }

    async predictDemand(product, historicalData, externalFactors) {
        const features = this.extractDemandFeatures(product, historicalData, externalFactors);
        
        if (!this.demandModel) {
            await this.trainDemandModel(features);
        }
        
        const prediction = await this.demandModel.predict(tf.tensor2d([features]));
        return {
            predictedDemand: Math.round(prediction.dataSync()[0]),
            confidence: this.calculateDemandConfidence(prediction, historicalData),
            factors: this.analyzeDemandFactors(features)
        };
    }

    buildUserProductMatrix(transactions) {
        // Create a sparse matrix of user-product interactions
        const matrix = {};
        transactions.forEach(transaction => {
            if (!matrix[transaction.userId]) {
                matrix[transaction.userId] = {};
            }
            matrix[transaction.userId][transaction.productId] = transaction.quantity;
        });
        return matrix;
    }

    async collaborativeFilter(customer, matrix) {
        // Implement matrix factorization for collaborative filtering
        const userFactors = await this.factorizeMatrix(matrix);
        return this.findSimilarProducts(customer, userFactors);
    }

    contentBasedFilter(customer, products, transactions) {
        // Analyze product features and customer preferences
        const customerPreferences = this.analyzeCustomerPreferences(customer, transactions);
        return products
            .map(product => ({
                product,
                score: this.calculateSimilarityScore(product, customerPreferences)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }

    hybridRecommendations(collaborativeRecs, contentBasedRecs) {
        // Combine and weight both recommendation types
        const combined = new Map();
        
        collaborativeRecs.forEach(rec => {
            combined.set(rec.productId, {
                product: rec.product,
                score: rec.score * 0.6 // 60% weight to collaborative filtering
            });
        });

        contentBasedRecs.forEach(rec => {
            if (combined.has(rec.product.id)) {
                const existing = combined.get(rec.product.id);
                existing.score += rec.score * 0.4; // 40% weight to content-based
            } else {
                combined.set(rec.product.id, {
                    product: rec.product,
                    score: rec.score * 0.4
                });
            }
        });

        return Array.from(combined.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }

    calculateConfidence(prediction, historicalData) {
        // Calculate confidence based on prediction variance and historical accuracy
        const variance = this.calculateVariance(historicalData.map(d => d.sales));
        const historicalAccuracy = this.calculateHistoricalAccuracy();
        return Math.min(100, Math.round((1 - variance) * historicalAccuracy));
    }

    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance) / mean; // Coefficient of variation
    }

    calculateHistoricalAccuracy() {
        // Placeholder for historical prediction accuracy calculation
        return 85; // Default 85% accuracy
    }

    isHoliday(date) {
        // Implement holiday detection logic
        const holidays = [
            '2024-01-01', // New Year's Day
            '2024-12-25', // Christmas
            // Add more holidays
        ];
        return holidays.includes(date.format('YYYY-MM-DD'));
    }

    async saveModel(model, path) {
        try {
            await model.save(`file://${path}`);
        } catch (error) {
            console.error('Error saving model:', error);
        }
    }
}

module.exports = new AIService();
