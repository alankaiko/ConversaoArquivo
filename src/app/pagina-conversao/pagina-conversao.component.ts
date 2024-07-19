import {Component, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-pagina-conversao',
  templateUrl: './pagina-conversao.component.html',
  styleUrls: ['./pagina-conversao.component.css']
})
export class PaginaConversaoComponent {
  fileContent: string | ArrayBuffer | null = null;

  selecionarArquivo(event: Event): void {
    const arquivo = event.target as HTMLInputElement;
    if (arquivo.files && arquivo.files.length) {
      const file = arquivo.files[0];
      this.conteudoArquivo(file);
    }
  }

  conteudoArquivo(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.fileContent = reader.result;
    };
    reader.readAsText(file);
  }
}
