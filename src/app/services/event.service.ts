import { EventCard, EventCardUI } from "@/models/event";
import { mapEventGetAll } from "@/models/mappers";
import { httpResource } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable(
    { providedIn: 'root' }
)
export class EventService {
    private apiUrl = `${environment.apiBaseUrl}/Events`;

    /*     
        copyCard(card: KanbanCardType, listId: number) {
              let lists = [];
      
              for (let i = 0; i < this._lists.length; i++) {
                  let list = this._lists[i];
      
                  if (list.id === listId && list.cards) {
                      let cardIndex = list.cards.indexOf(card);
                      let newId = parseInt(this.generateId());
                      let newCard = { ...card, id: newId };
                      list.cards.splice(cardIndex, 0, newCard);
                  }
      
                  lists.push(list);
              }
      
              this.updateLists(lists);
          }
      

      
      */

    moveCard(card: EventCardUI, targetListId: number, sourceListId: number) {
        if (card.id) {
         //   let lists = this._lists.map((l) => (l.id === targetListId ? { ...l, cards: [...(l.cards || []), card] } : l));
        }
    }
}
