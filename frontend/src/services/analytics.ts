import { hospitalApiRequest } from './api';

export interface DoctorAvailability {
    free: number;
    occupied: number;
    offline: number;
    total: number;
}

export interface DepartmentWorkload {
    department: string;
    activePatients: number;
    occupied: number;
    free: number;
    total: number;
}

export interface TopDoctor {
    name: string;
    activePatients: number;
    inConsult: number;
}

export interface QueueTrendPoint {
    time: string;
    queueLength: number;
}

export interface HospitalAnalytics {
    doctorAvailability: DoctorAvailability;
    departmentWorkload: DepartmentWorkload[];
    topDoctors: TopDoctor[];
    queueTrend: QueueTrendPoint[];
}

export const getHospitalAnalytics = async (): Promise<HospitalAnalytics> => {
    try {
        const [availability, workload, topDoctors, trend] = await Promise.all([
            hospitalApiRequest('/analytics/doctor-availability'),
            hospitalApiRequest('/analytics/department-workload'),
            hospitalApiRequest('/analytics/top-doctors?limit=5'),
            hospitalApiRequest('/analytics/queue-trend?hours=6')
        ]);

        return {
            doctorAvailability: availability,
            departmentWorkload: workload,
            topDoctors: topDoctors,
            queueTrend: trend
        };
    } catch (error) {
        console.error('Error fetching hospital analytics:', error);
        throw error;
    }
};
