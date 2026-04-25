import { Attendance } from "./person";

export interface EventCard {
  id: number;
  title: string | null;
  description: string | null;
  progress: number;
  attachments: number;
  comments: Comment[] | null;
  startDate: string;      // ISO 8601 con offset, es. "2025-11-08T12:00:00+01:00"
  dueDate: string;        // ISO 8601 con offset
  completed?: boolean | null;
  priority: string | null;
  taskList: EventTask;    // enum condiviso
  communityId: number;
  createdAt: string;      // ISO 8601 con offset o UTC (dipende dal server)
  createdByUserId: number;
  attendances: Attendance[] | null;
  areaId: number;
}

export interface EventCardCreate {
  id: number;
  title: string;
  description: string | null;
  progress: number;
  attachments: number;
  comments: Comment[] | null;
  startDate: string;      // ISO 8601 con offset, es. "2025-11-08T12:00:00+01:00"
  dueDate: string;        // ISO 8601 con offset
  completed?: boolean | null;
  priority: string | null;
  taskList: EventTask;    // enum condiviso
  communityId: number;
  createdAt: string;      // ISO 8601 con offset o UTC (dipende dal server)
  createdByUserId: number;
}


// Se ti servono i tipi di supporto (replicano i nomi server-side)
export interface EventTask {
    id: number;
    title: string;
    tasks: TaskItem[];
}

export interface TaskItem {
    id: number;
    text: string;
    completed: boolean;
}

export interface Comment {
    id: number;
    name: string;
    text: string;
    createdAt: string;
}

//ui
export interface EventCardUI {
  id: number;
  title: string;
  description: string;
  progress: number;
  attachments: number;
  comments: Comment[];
  startDateRaw: string;
  startDate: Date;
  dueDateRaw: string;
  dueDate: Date;
  completed: boolean | null;
  priority: string;
  taskList: EventTask | null;
  communityId: number;
  createdAtRaw: string;
  createdAt: Date;
  createdByUserId: number;
  attendances: any[];
  areaId: number;
}


