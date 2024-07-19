import {Component} from '@angular/core';

@Component({
  selector: 'app-pagina-conversao',
  templateUrl: './pagina-conversao.component.html',
  styleUrls: ['./pagina-conversao.component.css']
})
export class PaginaConversaoComponent {
  fileContent: string | null = null;
  modifiedContent: string | null = null;
  componentsArray: string[][] = []; // Array para armazenar componentes filhos de cada form

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

        // Extraímos os componentes filhos do <h:form>
        const components = this.extractComponents(formContent);

        // Adicionamos os componentes extraídos ao array de componentes
        this.componentsArray.push(components);

        // Modificamos o conteúdo dentro da tag <h:form>
        formContent = this.modifyFormContent(formContent);

        modifiedForms.push(`<h:form>${formContent}</h:form>`);
      }

      setTimeout(() => {
        console.log(this.componentsArray);
      })
      // Reconstruímos o conteúdo completo substituindo as tags <h:form> originais
      this.modifiedContent = content.replace(formPattern, () => modifiedForms.shift() || '');
    }
  }

  extractComponents(formContent: string): string[] {
    // Regex para identificar <div>, <t:div> e outros componentes dentro do <h:form>
    const componentPattern = /<div[^>]*>[\s\S]*?<\/div>|<t:div[^>]*>[\s\S]*?<\/t:div>|<[^\/>]+>[\s\S]*?<\/[^>]+>/g;
    const components = [];
    let match;

    while ((match = componentPattern.exec(formContent)) !== null) {
      const component = match[0];

      // Limpeza dos caracteres de controle
      const cleanedComponent = this.cleanComponent(component);

      // Filtragem manual para ignorar <div> com style="clear: both"
      if (!(/<div[^>]*style\s*=\s*["'][^"']*clear:\s*both[^"']*["'][^>]*>/i).test(cleanedComponent)) {
        components.push(cleanedComponent);
      }
    }

    return components;
  }

  cleanComponent(component: string): string {
    // Remove os caracteres de controle e normaliza o texto
    return component
      .replace(/\r\n/g, '')  // Remove quebras de linha
      .replace(/\r/g, '')    // Remove retorno de carro
      .replace(/\n/g, '')    // Remove novas linhas
      .replace(/\t/g, '');   // Remove tabulações
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
      const uint8Array = encoder.encode(this.modifiedContent);
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
