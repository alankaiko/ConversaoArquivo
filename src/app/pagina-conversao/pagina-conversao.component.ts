import {Component} from '@angular/core';

@Component({
  selector: 'app-pagina-conversao',
  templateUrl: './pagina-conversao.component.html',
  styleUrls: ['./pagina-conversao.component.css']
})
export class PaginaConversaoComponent {
  conteudoOriginal: string | null = null;
  conteudoPrincipalFinal: string | null = null;
  filhosFview: any[] = [];
  filhos: any[] = [];

  selecionarArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.lerArquivo(file);
    }
  }

  lerArquivo(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const decoder = new TextDecoder('iso-8859-1');
      this.conteudoOriginal = decoder.decode(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }

  montarConteudo() {
    let adicionarImportBsit = this.adicionarImportBsit(this.conteudoOriginal);
    let colocarTagFecharSaveState = this.fecharTagExplicito(adicionarImportBsit);

    this.filhosFview = this.extrairFilhosFView(colocarTagFecharSaveState);
    this.conteudoPrincipalFinal = this.conteudoSoComFView(colocarTagFecharSaveState);

    this.montarPagina();
  }

  private adicionarImportBsit(content: string): string {
    // Regex para identificar a tag <jsp:root> e seus atributos
    const jspRootPattern = /<jsp:root([^>]*)>/;

    return content.replace(jspRootPattern, (match, attributes) => {
      // Verificar se o xmlns:bsit já está presente
      if (!attributes.includes('xmlns:bsit')) {
        // Adicionar o xmlns:bsit ao atributo
        attributes += ' \nxmlns:bsit="http://facelets.bsit-br.com.br"';
      }
      return `<jsp:root${attributes}>`;
    });
  }

  private fecharTagExplicito(content: string): string {
    return content.replace(/<(\w+:\w+)([^>]*?)\/>/g, '<$1$2></$1>');
  }

  private extrairFilhosFView(content: string): string[] {
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

  private conteudoSoComFView(content: string): string {
    return content.replace(/<f:view[^>]*>[\s\S]*?<\/f:view>/, () => {
      return `<f:view contentType="text/html"></f:view>`;
    });
  }

  private conteudoSoForm(content: HTMLElement) {
    content.childNodes.forEach(elo => {
      console.log(elo);
    })
  }

  //------------------------------------------------------------------------------------------
  private montarPagina() {
    let saveStateComponents = this.filterSaveStateComponents();
    this.conteudoPrincipalFinal = this.adicionarSaveStateFView(saveStateComponents);

    this.modifyContentArray();
  }

  private filterSaveStateComponents(): string[] {
    // Filtra os componentes que são <t:saveState> e armazena em uma nova lista
    const saveStateComponents = this.filhosFview.filter(component => /<t:saveState[^>]*>/i.test(component));

    // Atualiza a lista global removendo os componentes <t:saveState>
    this.filhosFview = this.filhosFview.filter(component => !/<t:saveState[^>]*>/i.test(component));

    // Encontra o primeiro <div> ou <t:div> que contém <rich:messages> como filho direto
    const index = this.filhosFview.findIndex(component =>
      /<div[^>]*>[\s\S]*<rich:messages[^>]*>[\s\S]*<\/rich:messages>[\s\S]*<\/div>/i.test(component) ||
      /<t:div[^>]*>[\s\S]*<rich:messages[^>]*>[\s\S]*<\/rich:messages>[\s\S]*<\/t:div>/i.test(component)
    );

    let firstDivWithRichMessages = '';

    if (index !== -1) {
      firstDivWithRichMessages = this.filhosFview[index];
      // Remove o componente da lista global
      this.filhosFview.splice(index, 1);
    }

    // Retorna a lista de componentes <t:saveState>
    return saveStateComponents.concat(firstDivWithRichMessages ? [firstDivWithRichMessages] : []);
  }

  private adicionarSaveStateFView(tags: string[]): string {
    // Converte o array de tags para uma única string sem vírgulas
    const tagsString = tags.join('');

    // Regex para encontrar as tags <f:view> e substituir seu conteúdo pelas tags
    const fViewPattern = /(<f:view[^>]*>)([\s\S]*?)(<\/f:view>)/gi;
    return this.conteudoPrincipalFinal.replace(fViewPattern, (match, p1, p2, p3) => {
      // Substitui o conteúdo entre as tags <f:view> pelo conteúdo das tags
      return `${p1}${tagsString}${p3}`;
    });
  }

  //------------------------------------------------------------------------------------------
// Método para modificar o conteúdo do formulário
  modifyFormContent(formElement: Element): void {
    // Aqui você pode fazer as substituições necessárias dentro do formulário
    formElement.innerHTML = formElement.innerHTML.replace(/<div[^>]*style="[^"]*">([\s\S]*?)<\/div>/g, (match, innerContent) => {
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
  }

// Método principal para modificar o conteúdo do formulário dentro do array
  private modifyContentArray(): void {
    const parser = new DOMParser();
   let formPrincipal;

    this.filhosFview.forEach(filho => {
      const doc = parser.parseFromString(`<div>${filho}</div>`, 'text/html');
      const rootElement = doc.body.firstElementChild;

      if (rootElement) {
        const mainForm = this.findMainForm(rootElement, true);

        if (mainForm)
          formPrincipal = mainForm;
      }

      if (formPrincipal)
        this.filhos = this.extractFormChildren(formPrincipal);
    });


    let teste = this.conteudoSoForm(formPrincipal);
  }

  private findMainForm(element: Element, pegarFormPrincipal: boolean): Element | null {
    if (element.tagName.toLowerCase() === 'h:form') {
      // Verifica se o formulário está dentro de um <rich:modalPanel>
      let parent = element.parentElement;
      while (parent && pegarFormPrincipal) {
        if (parent.tagName.toLowerCase() === 'rich:modalpanel') {
          return null; // Ignora se estiver dentro de um <rich:modalPanel>
        }
        parent = parent.parentElement;
      }
      return element;
    }

    for (let i = 0; i < element.children.length; i++) {
      const found = this.findMainForm(element.children[i], true);
      if (found) {
        return found;
      }
    }

    return null;
  }

  extractFormChildren(formElement: Element): string[] {
    const childrenArray: string[] = [];

    // Iterar sobre os filhos diretos do formulário
    Array.from(formElement.children).forEach(child => {
      let childHtml = (child as HTMLElement).outerHTML;

      // Removendo quebras de linha e tabulações
      childHtml = childHtml.replace(/[\r\n\t]+/g, ' ').trim();

      childrenArray.push(childHtml);
    });

    return childrenArray;
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

  // modifyFormContent(component: string): string {
  //   // Aqui você pode fazer as substituições necessárias
  //   return component.replace(/<div[^>]*>/g, '<div class="col-md-12 form-group">')
  //     .replace(/<label[^>]*>([\s\S]*?)<\/label>/g, '<h:outputLabel>$1</h:outputLabel>')
  //     .replace(/<h:inputText([^>]*)>/g, '<h:inputText$1 class="form-control">');
  // }

  downloadModifiedContent(): void {
    if (this.conteudoPrincipalFinal) {
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(this.conteudoPrincipalFinal);
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


}
