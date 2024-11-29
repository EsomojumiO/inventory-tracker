const Customer = require('../models/Customer');
const Loyalty = require('../models/Loyalty');
const Campaign = require('../models/Campaign');
const Order = require('../models/Order');
const { sendEmail, sendSMS } = require('../utils/notifications');

class CRMService {
  // Customer Management
  async createCustomer(customerData) {
    try {
      const customer = new Customer(customerData);
      await customer.save();

      // Create loyalty account
      const loyalty = new Loyalty({ customer: customer._id });
      await loyalty.save();

      return customer;
    } catch (error) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  async updateCustomer(customerId, updateData) {
    try {
      const customer = await Customer.findByIdAndUpdate(
        customerId,
        updateData,
        { new: true }
      );
      return customer;
    } catch (error) {
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  async getCustomerProfile(customerId) {
    try {
      const customer = await Customer.findById(customerId);
      const loyalty = await Loyalty.findOne({ customer: customerId });
      const orders = await Order.find({ 'customer._id': customerId })
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        customer,
        loyalty,
        recentOrders: orders
      };
    } catch (error) {
      throw new Error(`Failed to get customer profile: ${error.message}`);
    }
  }

  async getCustomerAnalytics(customerId) {
    try {
      const orders = await Order.aggregate([
        { $match: { 'customer._id': customerId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' }
          }
        }
      ]);

      const productPreferences = await Order.aggregate([
        { $match: { 'customer._id': customerId } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            count: { $sum: 1 },
            totalSpent: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      return {
        metrics: orders[0] || {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0
        },
        productPreferences
      };
    } catch (error) {
      throw new Error(`Failed to get customer analytics: ${error.message}`);
    }
  }

  // Loyalty Program Management
  async processOrderPoints(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) throw new Error('Order not found');

      const loyalty = await Loyalty.findOne({ customer: order.customer._id });
      if (!loyalty) throw new Error('Loyalty account not found');

      const points = Loyalty.calculatePointsForOrder(order.total);
      await loyalty.addPoints(points, orderId);

      // Check for tier upgrade
      const oldTier = loyalty.tier;
      loyalty.updateTier();
      
      if (loyalty.tier !== oldTier) {
        await this.notifyTierUpgrade(loyalty);
      }

      return loyalty;
    } catch (error) {
      throw new Error(`Failed to process order points: ${error.message}`);
    }
  }

  async redeemPoints(customerId, points, reason) {
    try {
      const loyalty = await Loyalty.findOne({ customer: customerId });
      if (!loyalty) throw new Error('Loyalty account not found');

      await loyalty.redeemPoints(points, reason);
      return loyalty;
    } catch (error) {
      throw new Error(`Failed to redeem points: ${error.message}`);
    }
  }

  async checkExpiringPoints() {
    try {
      const loyalties = await Loyalty.find({
        'points.current': { $gt: 0 }
      });

      for (const loyalty of loyalties) {
        const expiringPoints = loyalty.getExpiringPoints(30);
        if (expiringPoints > 0) {
          await this.notifyExpiringPoints(loyalty, expiringPoints);
        }
        await loyalty.processExpiredPoints();
      }
    } catch (error) {
      throw new Error(`Failed to check expiring points: ${error.message}`);
    }
  }

  // Campaign Management
  async createCampaign(campaignData) {
    try {
      const campaign = new Campaign(campaignData);
      await campaign.save();
      return campaign;
    } catch (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  }

  async updateCampaign(campaignId, updateData) {
    try {
      const campaign = await Campaign.findByIdAndUpdate(
        campaignId,
        updateData,
        { new: true }
      );
      return campaign;
    } catch (error) {
      throw new Error(`Failed to update campaign: ${error.message}`);
    }
  }

  async getActiveCampaigns() {
    try {
      const now = new Date();
      return await Campaign.find({
        status: 'ACTIVE',
        startDate: { $lte: now },
        endDate: { $gte: now }
      });
    } catch (error) {
      throw new Error(`Failed to get active campaigns: ${error.message}`);
    }
  }

  async getEligibleCampaigns(customerId) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) throw new Error('Customer not found');

      const activeCampaigns = await this.getActiveCampaigns();
      const eligibleCampaigns = [];

      for (const campaign of activeCampaigns) {
        if (await campaign.isCustomerEligible(customer)) {
          eligibleCampaigns.push(campaign);
        }
      }

      return eligibleCampaigns;
    } catch (error) {
      throw new Error(`Failed to get eligible campaigns: ${error.message}`);
    }
  }

  async applyCampaignToOrder(orderId, campaignId) {
    try {
      const order = await Order.findById(orderId);
      const campaign = await Campaign.findById(campaignId);
      
      if (!order || !campaign) {
        throw new Error('Order or campaign not found');
      }

      if (!await campaign.isCustomerEligible(order.customer)) {
        throw new Error('Customer not eligible for this campaign');
      }

      const discount = campaign.calculateDiscount(order.total, order.items);
      await campaign.recordUsage(order.customer);

      return discount;
    } catch (error) {
      throw new Error(`Failed to apply campaign: ${error.message}`);
    }
  }

  // Notification Methods
  async notifyTierUpgrade(loyalty) {
    try {
      const customer = await Customer.findById(loyalty.customer);
      
      const emailData = {
        to: customer.email,
        subject: `Congratulations! You've been upgraded to ${loyalty.tier} tier`,
        template: 'tier-upgrade',
        context: {
          customerName: customer.name,
          tier: loyalty.tier,
          benefits: this.getTierBenefits(loyalty.tier)
        }
      };

      await sendEmail(emailData);

      if (customer.phone) {
        const smsData = {
          to: customer.phone,
          message: `Congratulations! You've been upgraded to ${loyalty.tier} tier. Check your email for details about your new benefits!`
        };

        await sendSMS(smsData);
      }
    } catch (error) {
      console.error('Failed to send tier upgrade notification:', error);
    }
  }

  async notifyExpiringPoints(loyalty, points) {
    try {
      const customer = await Customer.findById(loyalty.customer);
      
      const emailData = {
        to: customer.email,
        subject: 'Your reward points are expiring soon',
        template: 'expiring-points',
        context: {
          customerName: customer.name,
          points,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      };

      await sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send expiring points notification:', error);
    }
  }

  getTierBenefits(tier) {
    const benefits = {
      BRONZE: [
        'Earn 1 point per ₦100 spent',
        'Points valid for 12 months',
        'Special birthday offer'
      ],
      SILVER: [
        'Earn 1.2 points per ₦100 spent',
        'Points valid for 15 months',
        'Special birthday offer',
        'Exclusive silver member promotions'
      ],
      GOLD: [
        'Earn 1.5 points per ₦100 spent',
        'Points valid for 18 months',
        'Special birthday offer',
        'Exclusive gold member promotions',
        'Priority customer service'
      ],
      PLATINUM: [
        'Earn 2 points per ₦100 spent',
        'Points valid for 24 months',
        'Special birthday offer',
        'Exclusive platinum member promotions',
        'Priority customer service',
        'Personal shopping assistant'
      ]
    };

    return benefits[tier] || benefits.BRONZE;
  }
}

module.exports = new CRMService();
