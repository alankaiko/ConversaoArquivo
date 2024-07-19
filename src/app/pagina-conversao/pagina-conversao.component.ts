import {Component} from '@angular/core';

@Component({
  selector: 'app-pagina-conversao',
  templateUrl: './pagina-conversao.component.html',
  styleUrls: ['./pagina-conversao.component.css']
})
export class PaginaConversaoComponent {
  fileContent: string | null = null;
  modifiedContent: string | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.readFileContent(file);
    }
  }

  readFileContent(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const decoder = new TextDecoder('iso-8859-1');
      this.fileContent = decoder.decode(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }

  modifyContent(): void {
    if (this.fileContent) {
      let content = this.fileContent;

      // Extraímos o conteúdo das tags <h:form>
      const formPattern = /<h:form[^>]*>([\s\S]*?)<\/h:form>/g;
      let match;
      let modifiedForms = [];

      while ((match = formPattern.exec(content)) !== null) {
        let formContent = match[1];

        // Modificamos o conteúdo dentro da tag <h:form>
        formContent = this.modifyFormContent(formContent);

        modifiedForms.push(`<h:form>${formContent}</h:form>`);
      }

      // Reconstruímos o conteúdo completo substituindo as tags <h:form> originais
      this.modifiedContent = content.replace(formPattern, () => modifiedForms.shift() || '');
    }
  }

  modifyFormContent(formContent: string): string {
    // Aqui você pode fazer as substituições necessárias
    formContent = formContent.replace(/<div[^>]*style="[^"]*">([\s\S]*?)<\/div>/g, (match, innerContent) => {
      const labelPattern = /<label[^>]*>([\s\S]*?)<\/label>/;
      const inputTextPattern = /<h:inputText([^>]*)>/;

      const labelMatch = labelPattern.exec(innerContent);
      const inputTextMatch = inputTextPattern.exec(innerContent);

      if (labelMatch && inputTextMatch) {
        const labelText = labelMatch[1];
        const inputTextAttributes = inputTextMatch[1];

        return `
          <div class="col-md-12 form-group">
            <h:outputLabel>${labelText}</h:outputLabel>
            <h:inputText${inputTextAttributes.trim()}
                         class="form-control">
            </h:inputText>
          </div>
        `;
      }

      return match;
    });

    return formContent;
  }

  downloadModifiedContent(): void {
    if (this.modifiedContent) {
      const encoder = new TextEncoder();
      const uint8Array = new TextEncoder().encode(this.modifiedContent);
      const blob = new Blob([uint8Array], {type: 'text/plain;charset=iso-8859-1'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modified_file.jsp';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }
}
