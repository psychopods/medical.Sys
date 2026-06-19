export interface AnnualReport {
    id: string;
    year: number;
    title: string;
    description: string;
    fileSize: string;
    pageCount: number;
    downloadUrl: string;
    createdAt: string;
    lastModifiedAt: string;
}

export interface QuarterlyReport {
    id: string;
    quarter: string;
    title: string;
    period: string;
    description: string;
    fileSize: string;
    downloadUrl: string;
    createdAt: string;
    lastModifiedAt: string;
}

export interface SuccessStory {
    id: string;
    title: string;
    description: string;
    impact: string;
    date: string;
    category: 'education' | 'healthcare' | 'social' | 'nutrition';
    createdAt: string;
    lastModifiedAt: string;
}

export interface ImpactMetricDataset {
    label: string;
    values: number[];
    color: string;
}

export interface ImpactDataResponse {
    success: boolean;
    title: string;
    labels: string[];
    datasets: ImpactMetricDataset[];
}

export interface ImpactMetric {
    id: string;
    label: string;
    q1Value: number;
    q2Value: number;
    q3Value: number;
    q4Value: number;
    color: string;
    year: number;
    createdAt: string;
    lastModifiedAt: string;
}

// Request Bodies
export interface CreateAnnualReportBody {
    id: string;
    year: number;
    title: string;
    description: string;
    fileSize: string;
    pageCount: number;
    downloadUrl: string;
}

export interface CreateQuarterlyReportBody {
    id: string;
    quarter: string;
    title: string;
    period: string;
    description: string;
    fileSize: string;
    downloadUrl: string;
}

export interface CreateSuccessStoryBody {
    id: string;
    title: string;
    description: string;
    impact: string;
    date: string;
    category: 'education' | 'healthcare' | 'social' | 'nutrition';
}

export interface CreateImpactMetricBody {
    id: string;
    label: string;
    q1Value: number;
    q2Value: number;
    q3Value: number;
    q4Value: number;
    color: string;
    year: number;
}
