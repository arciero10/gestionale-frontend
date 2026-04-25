export interface Person {
id: number;
firstName: string;
lastName: string;
createdAt: string;
email: string | null;
phoneNumber: string | null;
address: string | null;
city: string | null;
region: string | null;
country: string | null;
postalCode: string | null;
birthDate: string | null;
notes: string | null;
service: Service;
}

export interface PersonCreate {
    id?: number;
    firstName: string;
    lastName: string;
    createdAt: Date | null;
    email: string | null;
    phoneNumber: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    postalCode: string | null;
    birthDate: Date | null;
    notes: string | null;
    service: Service;
    disability: boolean | null;
    parishId: number | null;
    communityNumber: number | null;
}

export interface PersonResponseDTO {
    id: number;
    firstName: string;
    lastName: string;
    createdAt: Date | null;
    email: string | null;
    phoneNumber: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    postalCode: string | null;
    birthDate: Date | null;
    notes: string | null;
    service: Service;
    disability: boolean | null;
    parishId: number | null;
    communityNumber: number | null;
    communityId: number | null;
    userId: string | null;
}

export enum Service
{
    None = 0,
    Responsabile = 1,
    Ostiario = 2,
    Prete = 3,
    Catechista = 4,
    Fratello = 5,
    Ospite = 6,
    Cantore = 7,
    AiutoOstiario = 8
}

export interface Attendance {
    personId: number;
    status:AttendanceStatus;
    note: string | null;
}

export enum AttendanceStatus { No = 0, Yes = 1 }