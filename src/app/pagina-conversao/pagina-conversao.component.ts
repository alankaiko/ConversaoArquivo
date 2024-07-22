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

  tranformarHtmlEmElemento() {
    let conteudo = this.processarConteudo();

    const parser = new DOMParser();
    const documentoTotal = parser.parseFromString(`${conteudo}`, 'text/html');

    // Verifica e adiciona o atributo xmlns:bsit na tag jsp:root
    const rootElement = documentoTotal.querySelector('jsp\\:root') as HTMLElement;
    if (rootElement) {
      this.addXmlnsAttributeIfMissing(rootElement);
    }

    // Verifica e adiciona a tag <bsit:pageTitle> dentro de <f:view>
    const fViewElement = documentoTotal.querySelector('f\\:view') as HTMLElement;
    if (fViewElement && !this.checkForBsitPageTitle(fViewElement)) {
      this.addBsitPageTitle(fViewElement);
    }

    // Captura o formulário principal
    const mainForm = this.captureMainForm(documentoTotal);
    if (mainForm) {
      // Remove as divs com clear: both
      this.removerDivsComClearBoth(mainForm);

      // Agora, manipular os formulários restantes
      this.manipularFormularios(documentoTotal);
      this.processarFilhosDoForm(mainForm);
      console.log(documentoTotal);
    }


    const serializer = new XMLSerializer();
    this.conteudoPrincipalFinal = serializer.serializeToString(mainForm);
  }

  captureMainForm(documentoTotal: Document): HTMLElement | null {
    // Captura todos os elementos <h:form> no documento
    const forms = Array.from(documentoTotal.querySelectorAll('h\\:form')) as HTMLElement[];

    // Itera sobre todos os formulários encontrados
    for (let form of forms) {
      let currentElement: HTMLElement | null = form;
      let isInsideModalPanel = false;

      // Verifica se o <h:form> está dentro de um <rich:modalPanel>
      while (currentElement) {
        if (currentElement.tagName.toLowerCase() === 'rich:modalpanel') {
          isInsideModalPanel = true;
          break;
        }
        currentElement = currentElement.parentElement;
      }

      // Se o formulário não estiver dentro de um <rich:modalPanel>, retorna-o como o principal
      if (!isInsideModalPanel) {
        return form;
      }
    }

    // Se todos os formulários encontrados estiverem dentro de <rich:modalPanel>, retorna null
    return null;
  }

  private removerDivsComClearBoth(form: HTMLElement): void {
    // Captura todas as <div> filhas do <h:form>
    const divs = Array.from(form.querySelectorAll('div')) as HTMLElement[];

    divs.forEach(div => {
      const style = div.getAttribute('style');

      if (style && style.includes('clear: both')) {
        // Remove a <div> do pai
        div.remove();
      }
    });
  }

  private processarConteudo(): string {
    return this.conteudoOriginal.replace(/<([a-zA-Z][^\s\/>]*)([^>]*)\/>/g, (match, tagName, attributes) => {
      return `<${tagName}${attributes}></${tagName}>`;
    });
  }

  addXmlnsAttributeIfMissing(element: HTMLElement): void {
    if (element.tagName.toLowerCase() === 'jsp:root') {
      if (!element.hasAttribute('xmlns:bsit')) {
        element.setAttribute('xmlns:bsit', 'http://facelets.bsit-br.com.br');
      }
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

    if (forms.length > 0)
      this.processarForm(forms[0]);
  }

  processarForm(form: HTMLElement): void {
    // Primeiro, remove <ul> e <li>, e coloca o conteúdo dentro de uma nova <div class="form-row">
    this.removerUlEli(form);

    // Em seguida, processa e modifica as <div> restantes dentro do <h:form>
    const divs = Array.from(form.querySelectorAll('div')) as HTMLElement[];
    divs.forEach(div => {
      this.modificarDiv(div);
    });

    // Adiciona uma <div class="form-row"> se não houver <ul>
    const uls = Array.from(form.querySelectorAll('ul')) as HTMLElement[];
    if (uls.length === 0) {
      this.adicionarDivFormRow(form);
    }
  }

  private removerUlEli(form: HTMLElement): void {
    // Cria uma nova <div class="form-row"></div> para encapsular o conteúdo
    const formRowDiv = document.createElement('div');
    formRowDiv.className = 'form-row';

    // Captura todas as <ul> dentro do <h:form>
    const uls = Array.from(form.querySelectorAll('ul')) as HTMLElement[];

    uls.forEach(ul => {
      // Move o conteúdo das <li> para a nova <div class="form-row">
      Array.from(ul.children).forEach(li => {
        if (li.tagName.toLowerCase() === 'li') {
          // Move o conteúdo da <li> para a nova <div class="form-row">
          Array.from(li.children).forEach(child => {
            formRowDiv.appendChild(child.cloneNode(true));
          });
        }
      });

      // Remove o <ul> do DOM
      ul.remove();
    });

    // Se a nova <div class="form-row"> contiver algum conteúdo, insere-a dentro do <h:form>
    if (formRowDiv.children.length > 0) {
      form.appendChild(formRowDiv);
    }
  }

  private modificarDiv(div: HTMLElement): void {
    // Verifica se a <div> possui atributos de estilo e remove-os
    if (div.hasAttribute('style')) {
      div.removeAttribute('style');
    }

    // Atualiza a classe da <div> para col-md-4 form-group
    if (!div.classList.contains('form-group')) {
      div.className = 'col-md-4 form-group';
    }
  }

  private adicionarDivFormRow(form: HTMLElement): void {
    // Cria uma nova <div class="form-row"></div> e a adiciona como pai de todo o conteúdo dentro do formulário
    const formRowDiv = document.createElement('div');
    formRowDiv.className = 'form-row';

    // Move o conteúdo atual do formulário para a nova <div class="form-row">
    Array.from(form.children).forEach(child => {
      formRowDiv.appendChild(child);
    });

    // Adiciona a nova <div class="form-row"> ao <h:form>
    form.appendChild(formRowDiv);
  }

  processarUl(ul: HTMLElement): void {
    // Captura todas as tags <li> dentro do <ul>
    const lis = Array.from(ul.querySelectorAll('li')) as HTMLElement[];

    // Cria o <div class="form-row"></div>
    const divFormRow = document.createElement('div');
    divFormRow.className = 'form-row';

    // Move o conteúdo de cada <li> para o novo <div class="form-row"></div>
    lis.forEach(li => {
      divFormRow.appendChild(li);
    });

    // Substitui o <ul> pelo novo <div class="form-row"></div>
    ul.parentElement?.replaceChild(divFormRow, ul);
  }

  processarFilhosDoForm(form: HTMLElement): void {
    // Captura todas as <div> dentro do <h:form>
    const divs = Array.from(form.querySelectorAll('div')) as HTMLElement[];

    divs.forEach(div => {
      // Verifica se a div tem as classes col-md-4 e form-group
      if (div.classList.contains('col-md-4') && div.classList.contains('form-group')) {
        // Remove o atributo style da própria div
        div.removeAttribute('style');

        // Remove o atributo style de todos os elementos filhos
        this.removeStyleFromChildElements(div);

        // Substitui labels por h:outputLabel e associa com o elemento correspondente
        const label = div.querySelector('label');
        if (label) {
          // Verifica se o label ainda é filho da div
          if (label.parentElement === div) {
            // Cria um novo elemento <h:outputLabel>
            const outputLabel = document.createElement('h:outputLabel') as HTMLElement;

            // Mantém o conteúdo da tag <label>
            outputLabel.innerHTML = label.innerHTML;

            // Procura o elemento de entrada associado
            const inputElement = div.querySelector('h\\:inputText, h\\:selectOneMenu, h\\:inputTextarea, h\\:selectBooleanCheckbox') as HTMLElement;

            // Log para verificar o elemento de entrada encontrado
            if (inputElement) {
              console.log('Elemento de entrada encontrado:', inputElement);
              if (inputElement.id) {
                outputLabel.setAttribute('for', inputElement.id);
                console.log('Atributo for adicionado:', inputElement.id);
              } else {
                console.warn('Elemento de entrada sem id:', inputElement);
              }
            } else {
              console.warn('Nenhum elemento de entrada encontrado dentro da div:', div);
            }

            // Copia os atributos da tag <label> para <h:outputLabel>
            Array.from(label.attributes).forEach(attr => {
              outputLabel.setAttribute(attr.name, attr.value);
            });

            // Substitui o <label> pelo novo <h:outputLabel>
            div.replaceChild(outputLabel, label);
          }
        }
      }
    });
  }

  removeStyleFromChildElements(parentDiv: HTMLElement): void {
    // Captura todos os elementos filhos do pai
    const childElements = Array.from(parentDiv.querySelectorAll('*')) as HTMLElement[];

    // Remove o atributo style de cada filho
    childElements.forEach(element => {
      element.removeAttribute('style');
    });
  }
}
