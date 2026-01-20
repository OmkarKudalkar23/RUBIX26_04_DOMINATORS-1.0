// ==================== CENTRALIZED DASHBOARD API ====================

export interface CentralizedHospitalData {
    id: string;
    name: string;
    address: string;
    bedSummary: {
        totalBeds: number;
        occupiedBeds: number;
        availableBeds: number;
        byType: Array<{
            type: string;
            total: number;
            occupied: number;
            available: number;
        }>;
    };
    opdLoad: {
        today: {
            total: number;
            scheduled: number;
            completed: number;
            cancelled: number;
        };
        last7Days: {
            total: number;
        };
    };
    admissionsLoad: {
        today: number;
        pending: number;
        admitted: number;
        last7Days: number;
    };
}

export interface CentralizedCapacityResponse {
    updatedAt: string;
    citySummary: {
        totalBeds: number;
        occupiedBeds: number;
        availableBeds: number;
        todayAppointments: number;
        last7DaysAppointments: number;
        todayAdmissions: number;
        pendingAdmissions: number;
        admittedAdmissions: number;
        last7DaysAdmissions: number;
    };
    hospitals: CentralizedHospitalData[];
}

/**
 * Get centralized hospital capacity data
 * Fetches anonymized bed availability and patient load data from all hospitals
 */
export const getCentralizedHospitalCapacity = async (): Promise<CentralizedCapacityResponse> => {
    try {
        const response = await fetch('http://localhost:5000/api/hospitals/capacity', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch centralized capacity: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching centralized hospital capacity:', error);
        throw error;
    }
};
