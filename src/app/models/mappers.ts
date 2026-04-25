import { EventCard, EventCardUI } from "./event";
import { AreaKanban, AreaUI } from "./macro-area";
export function mapAreaGetAll(src: AreaKanban): AreaUI {
  return {
    id: src.id,
    title: src.title,
    cards: src.cards.map(mapEventGetAll),
    type: src.type,
  };
}



export function mapEventGetAll(src: EventCard): EventCardUI {
  return {
    id: src.id,
    title: src.title ?? '',
    description: src.description ?? '',
    progress: src.progress,
    attachments: src.attachments,
    comments: src.comments ?? [],
    startDateRaw: src.startDate,
    startDate: new Date(src.startDate),
    dueDateRaw: src.dueDate,
    dueDate: new Date(src.dueDate),
    completed: src.completed ?? null,
    priority: src.priority ?? '',
    taskList: src.taskList,
    communityId: src.communityId,
    createdAtRaw: src.createdAt,
    createdAt: new Date(src.createdAt),
    createdByUserId: src.createdByUserId,
    attendances: src.attendances ?? [],
    areaId: src.areaId,
  }
}