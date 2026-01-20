const express = require('express');
const HospitalInventoryItem = require('../models/HospitalInventoryItem');
const HospitalInventoryTxn = require('../models/HospitalInventoryTxn');

const router = express.Router();

// Get all inventory items for a hospital
router.get('/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const items = await HospitalInventoryItem.find({ hospitalId }).sort({ category: 1, name: 1 });

        // Get recent transactions for each item
        const itemsWithTxns = await Promise.all(
            items.map(async (item) => {
                const recentTxns = await HospitalInventoryTxn.find({ itemId: item._id })
                    .sort({ occurredAt: -1 })
                    .limit(5);

                return {
                    ...item.toObject(),
                    recentTransactions: recentTxns,
                    isLowStock: item.currentStock <= item.minStock
                };
            })
        );

        res.json(itemsWithTxns);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Failed to fetch inventory', error: error.message });
    }
});

// Add new inventory item
router.post('/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const { name, category, unit, currentStock, minStock, reorderQty } = req.body;

        const item = new HospitalInventoryItem({
            hospitalId,
            name,
            category,
            unit,
            currentStock: currentStock || 0,
            minStock: minStock || 0,
            reorderQty: reorderQty || 0
        });

        await item.save();
        res.status(201).json(item);
    } catch (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({ message: 'Failed to add inventory item', error: error.message });
    }
});

// Update inventory item
router.put('/:hospitalId/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const updates = req.body;

        const item = await HospitalInventoryItem.findByIdAndUpdate(
            itemId,
            updates,
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(item);
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ message: 'Failed to update inventory item', error: error.message });
    }
});

// Delete inventory item
router.delete('/:hospitalId/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;

        const item = await HospitalInventoryItem.findByIdAndDelete(itemId);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ message: 'Failed to delete inventory item', error: error.message });
    }
});

// Record inventory transaction (consume, restock, adjust)
router.post('/:hospitalId/transaction', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const { itemId, type, qty, reason, linkedAdmissionId } = req.body;

        // Create transaction
        const txn = new HospitalInventoryTxn({
            hospitalId,
            itemId,
            type,
            qty,
            reason,
            linkedAdmissionId
        });

        await txn.save();

        // Update item stock
        const item = await HospitalInventoryItem.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (type === 'consume') {
            item.currentStock = Math.max(0, item.currentStock - qty);
        } else if (type === 'restock') {
            item.currentStock += qty;
        } else if (type === 'adjust') {
            item.currentStock = qty; // Direct adjustment
        }

        await item.save();

        res.status(201).json({ transaction: txn, updatedItem: item });
    } catch (error) {
        console.error('Error recording transaction:', error);
        res.status(500).json({ message: 'Failed to record transaction', error: error.message });
    }
});

// Get low stock items
router.get('/:hospitalId/alerts/low-stock', async (req, res) => {
    try {
        const { hospitalId } = req.params;

        const lowStockItems = await HospitalInventoryItem.find({
            hospitalId,
            $expr: { $lte: ['$currentStock', '$minStock'] }
        }).sort({ currentStock: 1 });

        res.json(lowStockItems);
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ message: 'Failed to fetch low stock items', error: error.message });
    }
});

// Get consumption trends
router.get('/:hospitalId/trends', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const consumptionData = await HospitalInventoryTxn.aggregate([
            {
                $match: {
                    hospitalId: hospitalId, // hospitalId is stored as string, not ObjectId
                    type: 'consume',
                    occurredAt: { $gte: startDate }
                }
            },
            {
                $lookup: {
                    from: 'hospitalinventoryitems',
                    localField: 'itemId',
                    foreignField: '_id',
                    as: 'item'
                }
            },
            {
                $unwind: '$item'
            },
            {
                $group: {
                    _id: '$item.name',
                    totalConsumed: { $sum: '$qty' },
                    category: { $first: '$item.category' },
                    unit: { $first: '$item.unit' }
                }
            },
            {
                $sort: { totalConsumed: -1 }
            }
        ]);

        res.json(consumptionData);
    } catch (error) {
        console.error('Error fetching consumption trends:', error);
        res.status(500).json({ message: 'Failed to fetch consumption trends', error: error.message });
    }
});

module.exports = router;
