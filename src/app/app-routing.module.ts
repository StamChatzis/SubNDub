import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MessagesComponent } from './components/messages/messages.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { AngularFireAuthGuard, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/compat/auth-guard';
import { SubtitlingContainerComponent } from './subtitling-container/subtitling-container.component';
import { DetailsViewComponent } from './components/details-view/details-view.component';
import { GenerateTTSComponent } from './components/generate-tts/generate-tts/generate-tts.component';
import { CommunitySubtitlingContainerComponent } from './community-subtitling-container/community-subtitling-container.component';
import {ProfileComponent} from "./components/profile/profile.component";
import { ShareSubtitlingContainerComponent } from './share-subtitling-container/share-subtitling-container.component';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['']);
const redirectLoggedInToDashboard = () => redirectLoggedInTo(['dashboard']);

const routes: Routes = [
  {path: '', component: SignInComponent},
  {path: 'dashboard', component: DashboardComponent, canActivate: [AngularFireAuthGuard], data:{ authGuardPipe: redirectUnauthorizedToLogin }},
  {path: 'messages', component: MessagesComponent, canActivate: [AngularFireAuthGuard], data:{ authGuardPipe: redirectUnauthorizedToLogin }},
  {path: 'profile', component: ProfileComponent, canActivate: [AngularFireAuthGuard], data:{ authGuardPipe: redirectUnauthorizedToLogin }},
  {path: 'details/:id', component: DetailsViewComponent, canActivate: [AngularFireAuthGuard], data:{ authGuardPipe: redirectUnauthorizedToLogin }},
  {path: 'edit/:id/:languageCode/:name/:language/:subtitleId', component: SubtitlingContainerComponent, canActivate: [AngularFireAuthGuard], data:{ authGuardPipe: redirectUnauthorizedToLogin }},
  {path: 'community/edit/:id/:languageCode/:requestId', component: CommunitySubtitlingContainerComponent, canActivate: [AngularFireAuthGuard], data:{ authGuardPipe: redirectUnauthorizedToLogin }},
  {path: 'generate-tts/:id/:languageCode', component: GenerateTTSComponent, canActivate: [AngularFireAuthGuard], data:{ authGuardPipe: redirectUnauthorizedToLogin }},
  {path: 'shared/:id', component: ShareSubtitlingContainerComponent, canActivate: [AngularFireAuthGuard], data:{ authGuardPipe: redirectUnauthorizedToLogin }},
  {path: 'edit/shared/:id/:ownerId/:languageCode/:name/:language/:right/:subtitleId', component: SubtitlingContainerComponent, canActivate: [AngularFireAuthGuard], data:{ authGuardPipe: redirectUnauthorizedToLogin }}
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
