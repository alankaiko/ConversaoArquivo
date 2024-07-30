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

  private lerArquivo(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const decoder = new TextDecoder('iso-8859-1');
      this.conteudoOriginal = decoder.decode(arrayBuffer);
      this.tranformarHtmlEmElemento();
    };
    reader.readAsArrayBuffer(file);
  }

  private tranformarHtmlEmElemento() {
    const parser = new DOMParser();
    const documentoTotal = parser.parseFromString(this.conteudoOriginal, 'application/xml');

    const rootElement = documentoTotal.getElementsByTagNameNS('*', 'root')[0] as HTMLElement;
    if (rootElement)
      this.addXmlnsAttributeIfMissing(rootElement);

    const fViewElement = documentoTotal.getElementsByTagNameNS('*', 'view')[0] as HTMLElement;
    if (fViewElement && !this.checkForBsitPageTitle(fViewElement))
      this.addBsitPageTitle(fViewElement);

    this.getDivsWithClearBoth(documentoTotal);

    this.captureMainForm(documentoTotal);
    this.transformarFormulariosModalPanel(documentoTotal);
    // this.ajustarStyleClassDataTable(documentoTotal);
    // this.substituirTags(documentoTotal);
    // const serializer = new XMLSerializer();
    // this.conteudoPrincipalFinal = serializer.serializeToString(documentoTotal);
    console.log(documentoTotal);
  }

  private captureMainForm(documentoTotal: Document) {
    const forms = Array.from(documentoTotal.getElementsByTagNameNS('*', 'form')) as HTMLElement[];

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

          if (isLastElement && currentDivRowButton)
            currentDivFormRow = this.createDivFormRow(form);
        });

        this.transformarDivs(form);

        const serializer = new XMLSerializer();
        this.conteudoPrincipalFinal = serializer.serializeToString(form);
      }
    }

    return null;
  }

  downloadFile() {
    const blob = new Blob([this.conteudoPrincipalFinal], {type: 'text/html'});

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'documento-modificado.html';
    a.click();

    URL.revokeObjectURL(a.href);
  }

  private processarUlEli(form: HTMLElement): void {
    const uls = Array.from(form.getElementsByTagNameNS('*', 'ul'));

    uls.forEach(ul => {
      const lis = Array.from(form.getElementsByTagNameNS('*', 'li'));

      lis.forEach(li => {
        Array.from(li.children).forEach(child => {
          form.insertBefore(child, ul);
        });
      });

      ul.remove();
    });
  }

  private removeAndStoreChildren(form: HTMLElement): void {
    const children = Array.from(form.children) as HTMLElement[];

    children.forEach(child => {
      this.filhosForm.push(child);
      form.removeChild(child);
    });
  }

  private isInsideModalPanel(element: HTMLElement): boolean {
    let currentElement: HTMLElement | null = element;
    while (currentElement) {
      if (currentElement.tagName === 'rich:modalPanel')
        return true;

      currentElement = currentElement.parentElement;
    }
    return false;
  }

  private addXmlnsAttributeIfMissing(element: HTMLElement): void {
    if (element.tagName.toLowerCase() === 'jsp:root' && !element.hasAttribute('xmlns:bsit'))
      element.setAttribute('xmlns:bsit', 'http://facelets.bsit-br.com.br');

  }

  private checkForBsitPageTitle(element: HTMLElement): boolean {
    return !!element.getElementsByTagNameNS('*', 'bsit\\:pageTitle')[0];
  }

  private addBsitPageTitle(element: HTMLElement): void {
    const namespaceURI = 'http://facelets.bsit-br.com.br';
    const bsitPageTitle = document.createElementNS(namespaceURI, 'bsit:pageTitle');

    bsitPageTitle.setAttribute('title', '');
    bsitPageTitle.setAttribute('code', '');
    bsitPageTitle.setAttribute('module', 'TM');
    bsitPageTitle.setAttribute('bean', '#{}');

    const tSaveStateElements = Array.from(element.getElementsByTagNameNS('*', 'saveState'));

    if (tSaveStateElements.length > 0) {
      const lastSaveState = tSaveStateElements[tSaveStateElements.length - 1];
      lastSaveState.parentNode.insertBefore(bsitPageTitle, lastSaveState.nextSibling);
    } else {
      element.insertBefore(bsitPageTitle, element.firstChild);
    }
  }

  private createDivFormRow(form: HTMLElement): HTMLDivElement {
    const divFormRow = document.createElementNS('*', 'div') as HTMLDivElement;
    divFormRow.className = 'form-row';
    form.appendChild(divFormRow);

    return divFormRow;
  }

  private transformarDivs(form: HTMLElement): void {
    const styledDivs = Array.from(form.querySelectorAll('div[style]')) as HTMLElement[];

    styledDivs.forEach(div => {
      if (div.closest('.row-button'))
        return;

      const newDiv = document.createElement('div');
      newDiv.className = 'col-md-4 form-group';

      while (div.firstChild)
        newDiv.appendChild(div.firstChild);

      div.parentNode?.insertBefore(newDiv, div);
      div.remove();

      this.removeStyleAttributes(newDiv);
      this.transformLabel(newDiv);
    });

    const clearBothDivs = Array.from(form.querySelectorAll('div[style*="clear: both"]')) as HTMLElement[];
    clearBothDivs.forEach(div => {
      if (!div.closest('.row-button')) {
        div.remove();
      }
    });
  }

  private transformLabel(element: HTMLElement): void {
    const labels = Array.from(element.getElementsByTagNameNS('*', 'label')) as HTMLElement[];

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
    const divButton = document.createElementNS('*', 'div') as HTMLDivElement;
    divButton.className = 'row-button';
    return divButton;
  }

  private isButtonElement(element: HTMLElement): boolean {
    return ['h:commandButton', 'a4j:commandButton', 'h:commandLink', 'h:outputLink'].some(tag => {
      const [prefix, localName] = tag.split(':');
      const elements = element.getElementsByTagNameNS('*', localName);
      return elements.length > 0;
    });
  }

  private transformarFormulariosModalPanel(documentoTotal: Document): void {
    const modalPanels = Array.from(documentoTotal.getElementsByTagNameNS('*', 'modalPanel')) as HTMLElement[];

    modalPanels.forEach(modalPanel => {
      const forms = Array.from(modalPanel.getElementsByTagNameNS('*', 'form')) as HTMLElement[];

      forms.forEach(form => {
        if (this.isFormDeletar(form)) {
          this.transformarFormDeletar(form);
        }
      });
    });
  }

  private isFormDeletar(form: HTMLElement): boolean {
    let currentElement: HTMLElement | null = form.parentElement;
    while (currentElement) {
      if (currentElement.tagName === 'rich:modalPanel') {
        const id = currentElement.getAttribute('id');
        return id ? id.toLowerCase().includes('delete') : false;
      }
      currentElement = currentElement.parentElement;
    }

    return false;
  }

  private transformarFormDeletar(form: HTMLElement): void {
    console.log(form);
    const divsCenter = Array.from(form.getElementsByTagNameNS('*', 'div[style*="text-align: center"][align="center"]')) as HTMLElement[];
    const clearBothDivs = Array.from(form.getElementsByTagNameNS('*', 'div[style*="clear: both"]')) as HTMLElement[];
    const label = divsCenter[0]?.getElementsByTagNameNS('*', 'label');
    const commandButton = divsCenter[1]?.getElementsByTagNameNS('*', 'commandButton');
    const outputLink = divsCenter[1]?.getElementsByTagNameNS('*', 'outputLink');

    // const newDivTextCenter = document.createElement('div');
    // newDivTextCenter.className = 'text-center';
    //
    // const newLabel = document.createElement('h:outputLabel');
    // newLabel.className = 'font-weight-bold';
    // if (label) {
    //   newLabel.innerHTML = label[0].textContent?.trim() || '';
    // }
    // newDivTextCenter.appendChild(newLabel);
    //
    // const newDivRowButton = document.createElement('div');
    // newDivRowButton.className = 'row-button justify-content-center';
    //
    // if (commandButton) {
    //   newDivRowButton.appendChild(commandButton[0]);
    // }
    // if (outputLink) {
    //   newDivRowButton.appendChild(outputLink[0]);
    // }
    //
    // divsCenter.forEach(div => div.remove());
    // clearBothDivs.forEach(div => div.remove());
    //
    // form.appendChild(newDivTextCenter);
    // form.appendChild(newDivRowButton);
  }

  private ajustarStyleClassDataTable(documentoTotal: Document): void {
    const dataTables = Array.from(documentoTotal.querySelectorAll('rich\\:dataTable')) as HTMLElement[];

    dataTables.forEach(dataTable => {
      dataTable.setAttribute('styleClass', 'mt-3');
    });
  }

  private substituirTags(documentoTotal: Document): void {
    // Define um mapa de substituições
    const substituicoes: { [key: string]: string } = {
      'rich\\:datatable': 'rich:dataTable'
      // Adicione mais substituições aqui, se necessário
    };

    const substituirTag = (element: Element, novaTag: string) => {
      const novoElemento = documentoTotal.createElement(novaTag);
      while (element.firstChild) {
        novoElemento.appendChild(element.firstChild);
      }
      Array.from(element.attributes).forEach(attr => {
        novoElemento.setAttribute(attr.name, attr.value);
      });
      element.replaceWith(novoElemento);
    };

    Object.keys(substituicoes).forEach(tagOriginal => {
      const novaTag = substituicoes[tagOriginal];
      const elementos = Array.from(documentoTotal.querySelectorAll(tagOriginal)) as HTMLElement[];
      elementos.forEach(elemento => substituirTag(elemento, novaTag));
    });
  }

  private getDivsWithClearBoth(documentoTotal: Document) {
    const clearBothDivs = Array.from(documentoTotal.querySelectorAll('div[style*="clear: both"]')) as HTMLElement[];
    clearBothDivs.forEach(divBoth => divBoth.remove());
  }
}
