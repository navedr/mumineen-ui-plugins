export interface MiqaatMonth {
    month: number;
    date: number;
    miqaats: Miqaat[];
}

export interface Miqaat {
    title: string;
    description?: string;
    phase: "day" | "night";
    priority: number;
    year?: number;
}
