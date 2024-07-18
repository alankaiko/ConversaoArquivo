import {Component, OnInit} from '@angular/core';
import {MenuItem} from "primeng/api";

@Component({
  selector: 'app-menu-inicial',
  templateUrl: './menu-inicial.component.html',
  styleUrls: ['./menu-inicial.component.css']
})
export class MenuInicialComponent implements OnInit {
  items: MenuItem[];

  ngOnInit() {
    this.items = [
      {
        label: 'File',
        items: [
          {
            label: 'Página de conversão',
            routerLink: ['pagina-conversao']
          }
        ]
      },
      {
        label: 'Quit'
      }
    ];
  }
}
