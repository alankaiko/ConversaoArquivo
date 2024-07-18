import {Component, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-pagina-conversao',
  templateUrl: './pagina-conversao.component.html',
  styleUrls: ['./pagina-conversao.component.css']
})
export class PaginaConversaoComponent {
  onUpload: EventEmitter<any> = new EventEmitter<any>();
  onError: EventEmitter<any> = new EventEmitter<any>();


}
