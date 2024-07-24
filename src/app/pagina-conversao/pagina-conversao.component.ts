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
    this.transformarDivs(documentoTotal); // Adiciona esta linha

    const serializer = new XMLSerializer();
    this.conteudoPrincipalFinal = serializer.serializeToString(documentoTotal);
  }

  captureMainForm(documentoTotal: Document) {
    const forms = Array.from(documentoTotal.querySelectorAll('h\\:form')) as HTMLElement[];

    for (let form of forms) {
      if (!this.isInsideModalPanel(form)) {
        this.filhosForm = [];
        this.processarUlEli(form);
        this.removeAndStoreChildren(form);

        let currentDivFormRow = this.createDivFormRow(form);
        let currentDivRowButton: HTMLDivElement | null = null;

        this.filhosForm.forEach((filho, index) => {
          const isButton = this.isButtonElement(filho);
          const isLastElement = index === this.filhosForm.length - 1;

          if (isButton) {
            if (!currentDivRowButton) {
              currentDivRowButton = this.createDivButton();
              form.appendChild(currentDivRowButton);
            }
            currentDivRowButton.appendChild(filho);
          } else {
            if (currentDivRowButton) {
              currentDivFormRow = this.createDivFormRow(form);
              currentDivRowButton = null;
            }
            currentDivFormRow.appendChild(filho);
          }

          if (isLastElement && currentDivRowButton) {
            currentDivFormRow = this.createDivFormRow(form);
          }
        });

        console.log(documentoTotal);
        console.log(this.filhosForm);

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
      const hasButton = !!filho.querySelector('h\\:commandButton,a4j\\:commandButton,h\\:outputLink,h\\:commandLink');

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
      // Cria o novo <h:outputLabel> e transfere o conteúdo do <label> original
      const newLabel = document.createElement('h:outputLabel');
      newLabel.innerHTML = label.innerHTML;

      // Adiciona os novos elementos à nova div
      newDiv.appendChild(newLabel);
      newDiv.appendChild(input);
    }

    return newDiv; // Retorna a nova div com a estrutura desejada
  }

  transformarDivs(document: Document): void {
    const floatLeftDivs = Array.from(document.querySelectorAll('div[style*="float: left"]')) as HTMLElement[];

    floatLeftDivs.forEach(div => {
      const newDiv = document.createElement('div');
      newDiv.className = 'col-md-4 form-group';

      while (div.firstChild) {
        newDiv.appendChild(div.firstChild);
      }

      div.parentNode?.insertBefore(newDiv, div);
      div.remove();

      this.removeStyleAttributes(newDiv);
      this.transformLabel(newDiv);
    });

    const clearBothDivs = Array.from(document.querySelectorAll('div[style*="clear: both"]')) as HTMLElement[];
    clearBothDivs.forEach(div => div.remove());
  }

  private transformLabel(element: HTMLElement): void {
    const labels = Array.from(element.querySelectorAll('label')) as HTMLElement[];

    labels.forEach(label => {
      const outputLabel = document.createElement('h:outputLabel');
      outputLabel.setAttribute('for', label.nextElementSibling?.getAttribute('id') || '');
      outputLabel.innerHTML = label.innerHTML;
      label.replaceWith(outputLabel);
    });
  }

  private removeStyleAttributes(element: HTMLElement): void {
    if (element.hasAttribute('style')) {
      element.removeAttribute('style');
    }

    Array.from(element.children).forEach(child => {
      this.removeStyleAttributes(child as HTMLElement);
    });
  }

  private createDivButton(): HTMLDivElement {
    const divButton = document.createElement('div');
    divButton.className = 'row-button';
    return divButton;
  }

  private isButtonElement(element: HTMLElement): boolean {
    return ['h\\:commandButton', 'a4j\\:commandButton', 'h\\:commandLink', 'h\\:outputLink'].some(tag => element.querySelector(tag));
  }

}
