export interface MiqaatMonth {
    month: number;
    date: number;
    miqaats: Miqaat[];
}

export interface Miqaat {
    title: string;
    description?: string;
    phase: string;
    priority: number;
    year?: number;
}
