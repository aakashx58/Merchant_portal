import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { LoggerService } from './app/core/services/logger.service';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  new LoggerService().error('Bootstrap error', err),
);
