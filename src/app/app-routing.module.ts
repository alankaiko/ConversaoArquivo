import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PaginaConversaoComponent} from "./pagina-conversao/pagina-conversao.component";

const routes: Routes = [
  {
    path: 'pagina-conversao',
    component: PaginaConversaoComponent,
    data: {
      title: 'Tela Inicial'
    }
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
