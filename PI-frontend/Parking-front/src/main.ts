import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';  // Fournir le router
import { routes } from './app/app.routes';  // Importer tes routes
import { AppComponent } from './app/app.component';  // Ton composant principal

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes)  // Configurer le routage
  ]
}).catch(err => console.error(err));
