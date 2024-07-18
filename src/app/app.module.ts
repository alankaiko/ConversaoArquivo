import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MenuInicialComponent } from './menu-inicial/menu-inicial.component';
import {MenubarModule} from "primeng/menubar";
import { PaginaConversaoComponent } from './pagina-conversao/pagina-conversao.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuInicialComponent,
    PaginaConversaoComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        MenubarModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
