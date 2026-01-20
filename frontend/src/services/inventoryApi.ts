const API_URL = 'http://localhost:5000/api';

export interface InventoryItem {
    _id: string;
    hospitalId: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    minStock: number;
    reorderQty: number;
    isLowStock?: boolean;
    recentTransactions?: InventoryTransaction[];
    createdAt: string;
    updatedAt: string;
}

export interface InventoryTransaction {
    _id: string;
    hospitalId: string;
    itemId: string;
    type: 'consume' | 'restock' | 'adjust';
    qty: number;
    reason: string;
    linkedAdmissionId?: string;
    occurredAt: string;
    createdAt: string;
}

export interface ConsumptionTrend {
    _id: string;
    totalConsumed: number;
    category: string;
    unit: string;
}

// Get all inventory items for a hospital
export async function getInventoryItems(hospitalId: string): Promise<InventoryItem[]> {
    const response = await fetch(`${API_URL}/inventory/${hospitalId}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch inventory');
    }
    return response.json();
}

// Add new inventory item
export async function addInventoryItem(
    hospitalId: string,
    item: Omit<InventoryItem, '_id' | 'hospitalId' | 'createdAt' | 'updatedAt' | 'isLowStock' | 'recentTransactions'>
): Promise<InventoryItem> {
    const response = await fetch(`${API_URL}/inventory/${hospitalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add inventory item');
    }
    return response.json();
}

// Update inventory item
export async function updateInventoryItem(
    hospitalId: string,
    itemId: string,
    updates: Partial<InventoryItem>
): Promise<InventoryItem> {
    const response = await fetch(`${API_URL}/inventory/${hospitalId}/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update inventory item');
    }
    return response.json();
}

// Delete inventory item
export async function deleteInventoryItem(hospitalId: string, itemId: string): Promise<void> {
    const response = await fetch(`${API_URL}/inventory/${hospitalId}/${itemId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete inventory item');
    }
}

// Record inventory transaction
export async function recordInventoryTransaction(
    hospitalId: string,
    transaction: {
        itemId: string;
        type: 'consume' | 'restock' | 'adjust';
        qty: number;
        reason?: string;
        linkedAdmissionId?: string;
    }
): Promise<{ transaction: InventoryTransaction; updatedItem: InventoryItem }> {
    const response = await fetch(`${API_URL}/inventory/${hospitalId}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to record transaction');
    }
    return response.json();
}

// Get low stock items
export async function getLowStockItems(hospitalId: string): Promise<InventoryItem[]> {
    const response = await fetch(`${API_URL}/inventory/${hospitalId}/alerts/low-stock`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch low stock items');
    }
    return response.json();
}

// Get consumption trends
export async function getConsumptionTrends(
    hospitalId: string,
    days: number = 7
): Promise<ConsumptionTrend[]> {
    const response = await fetch(`${API_URL}/inventory/${hospitalId}/trends?days=${days}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch consumption trends');
    }
    return response.json();
}
