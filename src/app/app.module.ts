import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { VideoPlayerComponent } from './subtitling-container/video-player/video-player.component';
import { SubtitlingContainerComponent } from './subtitling-container/subtitling-container.component';
import { DialogComponentComponent } from './subtitling-container/dialog-component/dialog-component.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { DialogContentComponent } from './subtitling-container/dialog-component/dialog-content/dialog-content.component';
import { ImportButtonComponent } from './shared/components/import-button/import-button.component';
import { HttpClientModule } from '@angular/common/http';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { MenuComponent } from './top-toolbar/menu/menu.component';
import { AngularFireModule} from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { firebaseConfig } from 'src/environments/environment';
import { LoginButtonComponent } from './shared/components/login-button/login-button.component';
import { MatToolbarModule} from '@angular/material/toolbar';
import { VideoInitFormComponent } from './components/video-add-form/video-init-form.component';
import { MatDividerModule} from '@angular/material/divider';
import { HomeCardsComponent } from './shared/components/home-cards/home-cards.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { MatDialogModule} from '@angular/material/dialog';
import { VideoCardComponent } from './components/video-card/video-card.component';
import { FullscreenLoaderComponent } from './shared/components/fullscreen-loader/fullscreen-loader.component';
import { DialogConfirmationComponent } from './shared/components/dialog-confirmation/dialog-confirmation.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SubTimelineComponent } from './subtitling-container/sub-timeline/sub-timeline.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SubtitleTileComponent } from './subtitling-container/sub-timeline/subtitle-tile/subtitle-tile.component';
import { CommunityVideoCardComponent } from './components/community-video-card/community-video-card.component';
import { DetailsViewComponent } from './components/details-view/details-view.component';
import { MatTableModule } from '@angular/material/table';
import { UnsavedChangesDialogComponent } from './components/dialog-modal/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { PersonCreationDialogComponent } from './components/dialog-modal/person-creation-dialog/person-creation-dialog/person-creation-dialog.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { GenerateVoiceDialogComponent } from './components/dialog-modal/generate-voice-modal/genereate-voice-modal.component';
import { GenerateTTSComponent } from './components/generate-tts/generate-tts/generate-tts.component';
import { MatStepperModule } from '@angular/material/stepper';
import { FilterPipe } from './shared/pipes/search-filter.pipe';
import { MatSelectModule } from '@angular/material/select';
import { SaveSubtitleDialogComponent } from './components/dialog-modal/save-subtitle-dialog/save-subtitle-dialog.component';
import { CommunitySubtitlingContainerComponent } from './community-subtitling-container/community-subtitling-container.component';
import { ConfirmationModalComponent } from './components/dialog-modal/confirmation-modal/confirmation-modal.component';
import { BatchDialogModalComponent } from './components/dialog-modal/batch-dialog-modal/batch-dialog-modal.component';
import { NgOptimizedImage } from "@angular/common";
import { ProfileDropdownComponent } from './shared/components/profile-dropdown/profile-dropdown.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ShareSubtitleDialogComponent } from './components/dialog-modal/share-subtitle-dialog/share-subtitle-dialog.component';
import { MatGridListModule } from '@angular/material/grid-list';
import {MatSortModule} from "@angular/material/sort";
import { TransferOwnershipDialogComponent } from './components/dialog-modal/transfer-ownership-dialog/transfer-ownership-dialog.component';
import { MessagesComponent } from './components/messages/messages.component';
import { DetailsViewServiceService } from './services/details-view-service.service';
import { ShareSubtitlingContainerComponent } from './share-subtitling-container/share-subtitling-container.component';
import { SharedVideoCardComponent } from './components/shared-video-card/shared-video-card.component';
import { RequestCommunityHelpComponent } from './components/dialog-modal/request-community-help/request-community-help.component';
import { PlaceABidComponent } from './components/dialog-modal/place-a-bid/place-a-bid.component';
import { DownloadOptionsDialogComponent } from './components/dialog-modal/download-options-dialog/download-options-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateSubsDialogComponent } from './components/dialog-modal/translate-subs-dialog/translate-subs-dialog.component';
import { MatRadioModule } from '@angular/material/radio';
import { DetectLanguageDialogComponent } from './components/dialog-modal/detect-language-dialog/detect-language-dialog.component';
import { CommentDialogComponent } from './components/dialog-modal/comment-dialog/comment-dialog.component';
import { CommunityHelpService } from './services/community-help.service';
import { ProfilePreviewDialogComponent } from './components/dialog-modal/profile-preview-dialog/profile-preview-dialog.component';
import { EditRequestDialogComponent } from './components/dialog-modal/edit-request-dialog/edit-request-dialog.component';
import { ViewonlyModeDialogComponent } from './components/dialog-modal/viewonly-mode-dialog/viewonly-mode-dialog.component';
import { SearchSharedfilterPipe } from './shared/pipes/search-sharedfilter.pipe';
import { SearchCommunityfilterPipe } from './shared/pipes/search-communityfilter.pipe';

@NgModule({
  declarations: [
    AppComponent,
    VideoPlayerComponent,
    SubtitlingContainerComponent,
    DialogComponentComponent,
    DialogContentComponent,
    ImportButtonComponent,
    LoaderComponent,
    MenuComponent,
    LoginButtonComponent,
    VideoInitFormComponent,
    HomeCardsComponent,
    DashboardComponent,
    SignInComponent,
    VideoCardComponent,
    FullscreenLoaderComponent,
    DialogConfirmationComponent,
    SubTimelineComponent,
    SubtitleTileComponent,
    CommunityVideoCardComponent,
    DetailsViewComponent,
    UnsavedChangesDialogComponent,
    PersonCreationDialogComponent,
    GenerateVoiceDialogComponent,
    GenerateTTSComponent,
    FilterPipe,
    SaveSubtitleDialogComponent,
    CommunitySubtitlingContainerComponent,
    ConfirmationModalComponent,
    BatchDialogModalComponent,
    ProfileDropdownComponent,
    ProfileComponent,
    ShareSubtitleDialogComponent,
    TransferOwnershipDialogComponent,
    MessagesComponent,
    ShareSubtitlingContainerComponent,
    SharedVideoCardComponent,
    RequestCommunityHelpComponent,
    PlaceABidComponent,
    DownloadOptionsDialogComponent,
    TranslateSubsDialogComponent,
    DetectLanguageDialogComponent,
    CommentDialogComponent,
    ProfilePreviewDialogComponent,
    EditRequestDialogComponent,
    ViewonlyModeDialogComponent,
    SearchSharedfilterPipe,
    SearchCommunityfilterPipe
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule,
        YouTubePlayerModule,
        MatIconModule,
        FormsModule,
        MatTooltipModule,
        FlexLayoutModule,
        MatCardModule,
        HttpClientModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        AngularFireModule.initializeApp(firebaseConfig),
        AngularFireAuthModule,
        AngularFirestoreModule,
        AngularFireStorageModule,
        AngularFireDatabaseModule,
        MatToolbarModule,
        MatDividerModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        DragDropModule,
        MatDialogModule,
        ColorPickerModule,
        MatStepperModule,
        MatSelectModule,
        NgOptimizedImage,
        MatGridListModule,
        MatSortModule,
        MatCheckboxModule,
        MatRadioModule
    ],
  providers: [DetailsViewServiceService, CommunityHelpService],
  bootstrap: [AppComponent]
})
export class AppModule { }
