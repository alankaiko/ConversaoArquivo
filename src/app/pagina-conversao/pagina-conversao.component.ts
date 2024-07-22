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

    this.captureMainForm(documentoTotal);
  }

  captureMainForm(documentoTotal: Document) {
    const forms = Array.from(documentoTotal.querySelectorAll('h\\:form')) as HTMLElement[];

    for (let form of forms) {
      if (!this.isInsideModalPanel(form)) {
        this.filhosForm = [];
        this.processarUlEli(form);
        this.removeAndStoreChildren(form);

        if (form) {
          // Passo 1: Cria e adiciona a <div class="form-row"> ao formulário
          const formRowDiv = this.createDivFormRow(form);

          // Passo 2: Adiciona os filhos com <label> e <input> dentro da <div class="form-row">
          this.addFirstChildWithLabelAndInput(formRowDiv);

          // Passo 3: Cria uma nova <div class="row-button"> e a adiciona ao formulário depois da <div class="form-row">
          const divButton = this.createDivButton();
          form.appendChild(divButton);

          // Passo 4: Adiciona os botões à nova <div class="row-button">
          this.filhosForm.forEach(filho => {
            const hasButton = !!filho.querySelector('h\\:commandButton,a4j\\:commandButton,h\\:outputLink,h\\:commandLink');
            if (hasButton) {
              // Cria uma nova <div class="row-button"> para cada botão e adiciona ao <div class="row-button"> principal
              const buttonDiv = this.createDivButton();
              buttonDiv.appendChild(filho);
              divButton.appendChild(buttonDiv);
            }
          });

          console.log(documentoTotal);
          console.log(this.filhosForm);
        }

        const serializer = new XMLSerializer();
        this.conteudoPrincipalFinal = serializer.serializeToString(form);
      }
    }

    return null;
  }

  private processarUlEli(form: HTMLElement): void {
    const uls = Array.from(form.querySelectorAll('ul')) as HTMLElement[];

    uls.forEach(ul => {
      const lis = Array.from(ul.querySelectorAll('li')) as HTMLElement[];

      lis.forEach(li => {
        Array.from(li.children).forEach(child => {
          form.insertBefore(child, ul); // Move children of <li> directly to form
        });
      });

      ul.remove(); // Remove <ul> from DOM
    });
  }

  private removeAndStoreChildren(form: HTMLElement): void {
    const children = Array.from(form.children) as HTMLElement[];

    children.forEach(child => {
      if (child instanceof HTMLElement) {
        this.filhosForm.push(child); // Store the child element
        form.removeChild(child); // Remove the child from form
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

  private createDivFormRow(form: HTMLElement): HTMLDivElement {
    const divFormRow = document.createElement('div');
    divFormRow.className = 'form-row';

    // Adiciona ao <form> o novo <div class="form-row">
    form.appendChild(divFormRow);

    return divFormRow; // Retorna a referência da nova div
  }


  private addFirstChildWithLabelAndInput(container: HTMLElement): void {
    this.filhosForm.forEach(filho => {
      const hasLabel = !!filho.querySelector('label');
      const hasInput = !!filho.querySelector('h\\:inputText');
      const hasButton = !!filho.querySelector('h\\:commandButton,a4j\\:commandButton,h\\:outputLink,h\\:commandLink,a4j\\:commandLink');

      if (hasLabel && hasInput) {
        container.appendChild(this.transformToColMd4FormGroup(filho)); // Adiciona ao <div class="form-row">
      }
    });

    if (this.filhosForm.length > 0) {
      // Pega o primeiro item do array filhosForm
      const firstChild = this.filhosForm[1] as HTMLElement;

      // Verifica se o item possui <label> e <input>
      const hasLabel = !!firstChild.querySelector('label');
      const hasInput = !!firstChild.querySelector('h\\:inputText');

      if (hasLabel && hasInput) {
        container.appendChild(this.transformToColMd4FormGroup(firstChild)); // Adiciona ao <div class="form-row">
      }
    }
  }

  private transformToColMd4FormGroup(originalDiv: HTMLElement): HTMLElement {
    // Cria a nova div com a classe desejada
    const newDiv = document.createElement('div');
    newDiv.className = 'col-md-4 form-group';

    // Encontra o <label> e o <input> no div original
    const label = originalDiv.querySelector('label');
    const input = originalDiv.querySelector('h\\:inputtext');

    if (label && input) {
      // Cria o novo <h:outputLabel> e transfere o conteúdo do <label>
      const outputLabel = document.createElement('h:outputLabel');
      outputLabel.setAttribute('for', input.getAttribute('id') || '');

      // Cria o conteúdo do <h:outputLabel> a partir do <label>
      outputLabel.innerHTML = label.innerHTML;

      // Remove o <label> original
      label.remove();

      // Adiciona o <h:outputLabel> e o <h:inputtext> à nova div
      newDiv.appendChild(outputLabel);
      newDiv.appendChild(input);

      // Remove todos os atributos de estilo do div original e dos seus filhos
      this.removeStyleAttributes(newDiv);

      // Retorna a nova div
      return newDiv;
    }

    // Se não houver <label> ou <input>, retorna o div original
    return originalDiv;
  }

// Método auxiliar para remover todos os atributos style
  private removeStyleAttributes(element: HTMLElement): void {
    // Remove o atributo style do elemento atual
    element.removeAttribute('style');

    // Remove o atributo style de todos os filhos do elemento
    const children = Array.from(element.children) as HTMLElement[];
    children.forEach(child => this.removeStyleAttributes(child));
  }

  private createDivButton(): HTMLDivElement {
    const divButton = document.createElement('div');
    divButton.className = 'row-button';

    return divButton; // Retorna a nova div
  }

}
