import {Component} from '@angular/core';

@Component({
  selector: 'app-pagina-conversao',
  templateUrl: './pagina-conversao.component.html',
  styleUrls: ['./pagina-conversao.component.css']
})
export class PaginaConversaoComponent {
  conteudoOriginal: string | null = null;
  conteudoPrincipalFinal: string | null = null;
  filhosForm: any[] = [];

  selecionarArquivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.lerArquivo(file);
    }
  }

  lerArquivo(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const decoder = new TextDecoder('iso-8859-1');
      this.conteudoOriginal = decoder.decode(arrayBuffer);
      this.tranformarHtmlEmElemento();
    };
    reader.readAsArrayBuffer(file);
  }

  tranformarHtmlEmElemento() {
    let conteudo = this.processarConteudo();
    const parser = new DOMParser();
    const documentoTotal = parser.parseFromString(conteudo, 'text/html');

    const rootElement = documentoTotal.querySelector('jsp\\:root') as HTMLElement;
    if (rootElement) {
      this.addXmlnsAttributeIfMissing(rootElement);
    }

    const fViewElement = documentoTotal.querySelector('f\\:view') as HTMLElement;
    if (fViewElement && !this.checkForBsitPageTitle(fViewElement)) {
      this.addBsitPageTitle(fViewElement);
    }

    const mainForm = this.captureMainForm(documentoTotal);
    if (mainForm) {
      this.manipularFormularios(documentoTotal);
      console.log(documentoTotal);
      console.log(this.filhosForm);
    }

    const serializer = new XMLSerializer();
    this.conteudoPrincipalFinal = serializer.serializeToString(mainForm);
  }

  captureMainForm(documentoTotal: Document): HTMLElement | null {
    // Captura todos os elementos <h:form> no documento
    const forms = Array.from(documentoTotal.querySelectorAll('h\\:form')) as HTMLElement[];

    // Itera sobre todos os formulários encontrados
    for (let form of forms) {
      if (!this.isInsideModalPanel(form)) {
        // Inicializa o array filhosForm
        this.filhosForm = [];

        // Remove e processa <ul> e <li>
        this.processarUlEli(form);

        // Remove cada filho do formulário e adiciona ao array filhosForm
        this.removeAndStoreChildren(form);

        return form;
      }
    }

    // Se todos os formulários encontrados estiverem dentro de <rich:modalPanel>, retorna null
    return null;
  }

  private processarUlEli(form: HTMLElement): void {
    // Captura todas as <ul> dentro do <h:form>
    const uls = Array.from(form.querySelectorAll('ul')) as HTMLElement[];

    uls.forEach(ul => {
      // Captura todos os filhos <li> do <ul>
      const lis = Array.from(ul.querySelectorAll('li')) as HTMLElement[];

      lis.forEach(li => {
        // Move o conteúdo da <li> para o pai do <ul>
        Array.from(li.children).forEach(child => {
          form.insertBefore(child, ul); // Insere os filhos de <li> diretamente no <form>
        });
      });

      // Remove o <ul> do DOM
      ul.remove();
    });
  }

  private removeAndStoreChildren(form: HTMLElement): void {
    // Cria uma cópia dos filhos do formulário para iterar
    const children = Array.from(form.children) as HTMLElement[];

    // Itera sobre a cópia dos filhos
    children.forEach(child => {
      if (child instanceof HTMLElement) {
        // Adiciona o filho ao array filhosForm
        this.filhosForm.push(child);
        // Remove o filho do formulário
        form.removeChild(child);
      }
    });
  }

  private isInsideModalPanel(element: HTMLElement): boolean {
    let currentElement: HTMLElement | null = element;
    while (currentElement) {
      if (currentElement.tagName.toLowerCase() === 'rich:modalpanel') {
        return true;
      }
      currentElement = currentElement.parentElement;
    }
    return false;
  }

  private moveLiToParent(element: HTMLElement): void {
    const uls = Array.from(element.querySelectorAll('ul')) as HTMLElement[];

    uls.forEach(ul => {
      const lis = Array.from(ul.querySelectorAll('li')) as HTMLElement[];

      lis.forEach(li => {
        Array.from(li.children).forEach(child => {
          ul.parentNode?.insertBefore(child, ul);
        });
      });

      ul.remove();
    });
  }

  private processarConteudo(): string {
    return this.conteudoOriginal?.replace(/<([a-zA-Z][^\s\/>]*)([^>]*)\/>/g, (match, tagName, attributes) => {
      return `<${tagName}${attributes}></${tagName}>`;
    }) || '';
  }

  addXmlnsAttributeIfMissing(element: HTMLElement): void {
    if (element.tagName.toLowerCase() === 'jsp:root' && !element.hasAttribute('xmlns:bsit')) {
      element.setAttribute('xmlns:bsit', 'http://facelets.bsit-br.com.br');
    }
  }

  checkForBsitPageTitle(element: HTMLElement): boolean {
    return !!element.querySelector('bsit\\:pageTitle');
  }

  addBsitPageTitle(element: HTMLElement): void {
    const bsitPageTitle = document.createElement('bsit:pageTitle');
    bsitPageTitle.setAttribute('title', '');
    bsitPageTitle.setAttribute('code', '');
    bsitPageTitle.setAttribute('module', 'TM');
    bsitPageTitle.setAttribute('bean', '#{}');

    const tSaveStateElements = element.querySelectorAll('t\\:saveState');

    if (tSaveStateElements.length > 0) {
      const lastSaveState = tSaveStateElements[tSaveStateElements.length - 1];
      lastSaveState.parentNode.insertBefore(bsitPageTitle, lastSaveState.nextSibling);
    } else {
      element.insertBefore(bsitPageTitle, element.firstChild);
    }
  }

  manipularFormularios(documentoTotal: Document): void {
    const forms = Array.from(documentoTotal.querySelectorAll('h\\:form')) as HTMLElement[];
    if (forms.length > 0) {
      this.moveLiToParent(forms[0]);
    }
  }
}
