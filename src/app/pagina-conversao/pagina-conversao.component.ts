import {Component} from '@angular/core';

@Component({
  selector: 'app-pagina-conversao',
  templateUrl: './pagina-conversao.component.html',
  styleUrls: ['./pagina-conversao.component.css']
})
export class PaginaConversaoComponent {
  fileContent: string | null = null;
  modifiedContent: string | null = null;
  filhos: any[] = [];
  filhosFview: any[] = [];

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
    this.filhos = [];
    if (this.fileContent) {
      let modifiedContent = this.convertSelfClosingTags(this.fileContent);

      const fViewChildren = this.extractFViewChildren(modifiedContent);
      console.log(fViewChildren);


      // let content = this.addPageTitleToFView(this.fileContent);
      //
      // // Extraímos o conteúdo das tags <h:form>
      // const formPattern = /<h:form[^>]*>([\s\S]*?)<\/h:form>/g;
      // let match;
      // let modifiedForms = [];
      //
      // while ((match = formPattern.exec(content)) !== null) {
      //   let formContent = match[1];
      //   formContent = this.modifyClearDivs(formContent);
      //   // Extraímos os componentes do form
      //   const components = this.extractComponents(formContent);
      //   this.filhos.push(components);
      //
      //   // Modificamos o conteúdo dentro da tag <h:form>
      //   const modifiedFormContent = components.map(component => this.modifyFormContent(component)).join('');
      //   modifiedForms.push(`<h:form>${modifiedFormContent}</h:form>`);
      // }
      //
      // // Reconstruímos o conteúdo completo substituindo as tags <h:form> originais
      // this.modifiedContent = content.replace(formPattern, () => modifiedForms.shift() || '');
    }
  }

  extractComponents(formContent: string): string[] {
    const components = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${formContent}</div>`, 'text/html');
    const formElement = doc.body.firstChild!;

    formElement.childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        components.push((node as HTMLElement).outerHTML);
      }
    });

    return components;
  }

  modifyFormContent(component: string): string {
    // Aqui você pode fazer as substituições necessárias
    return component.replace(/<div[^>]*>/g, '<div class="col-md-12 form-group">')
      .replace(/<label[^>]*>([\s\S]*?)<\/label>/g, '<h:outputLabel>$1</h:outputLabel>')
      .replace(/<h:inputText([^>]*)>/g, '<h:inputText$1 class="form-control">');
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

  cleanComponent(component: string): string {
    // Remove os caracteres de controle e normaliza o texto
    return component.replace(/[\r\n\t]+/g, ' ').trim()
  }

  modifyClearDivs(content: string): string {
    return content.replace(/<div\s+style\s*=\s*["'][^"']*clear:[^"']*["'][^>]*\/>/gi, '');
  }

  filterDivsWithClearBoth(components: string[]): string[] {
    return components.filter(component => {
      // Verifica se o componente é uma `<div>` e se o atributo `style` contém "clear: both"
      const clearBothPattern = /<div[^>]*style\s*=\s*["'][^"']*clear:\s*both[^"']*["'][^>]*>/i;
      return !clearBothPattern.test(component);
    });
  }

  mosttrar() {
    this.filhos[0] = this.filterDivsWithClearBoth(this.filhos[0]);
    console.log(this.filhos);
  }

  addPageTitleToFView(content: string): string {
    // Define o novo componente que será adicionado
    const pageTitleComponent = `\n<bsit:pageTitle title="" code="" module="TM" bean="#{}"/>`;

    // Regex para encontrar a tag <f:view> e inserir o novo componente como primeiro filho
    const fViewPattern = /(<f:view[^>]*>)([\s\S]*?)(<\/f:view>)/i;

    // Substitui o conteúdo da tag <f:view> adicionando o novo componente
    const modifiedContent = content.replace(fViewPattern, (match, p1, p2, p3) => {
      return `${p1}${pageTitleComponent}\n${p2}${p3}`;
    });

    return modifiedContent;
  }


  convertSelfClosingTags(content: string): string {
    return content.replace(/<(\w+:\w+)([^>]*?)\/>/g, '<$1$2></$1>');
  }

  extractFViewChildren(content: string): string[] {
    // Regex para capturar o conteúdo da tag <f:view>
    const fViewContentMatch = content.match(/<f:view[^>]*>([\s\S]*?)<\/f:view>/);
    if (!fViewContentMatch) {
      return [];
    }

    const fViewContent = fViewContentMatch[1];

    // Regex para capturar todas as tags filhos diretos dentro da tag <f:view>
    const childTagPattern = /<([a-zA-Z0-9-]+:[a-zA-Z0-9-]+|div|t:div|rich:modalPanel|[^>\/]+)[^>]*>([\s\S]*?<\/\1>)?/g;
    const childrenArray: string[] = [];

    let match;
    while ((match = childTagPattern.exec(fViewContent)) !== null) {
      let childHtml = match[0];

      // Removendo quebras de linha e tabulações
      childHtml = this.cleanComponent(childHtml);

      childrenArray.push(childHtml);
    }

    return childrenArray;
  }


}
