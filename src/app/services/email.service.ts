import { Injectable } from '@angular/core';
import { NotifierService } from './notifier.service';
import  emailjs  from 'emailjs-com';
//import {EmailJS_IDs} from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private notifier: NotifierService) { }

  sendEmail(email: string, to_email: string) {
    emailjs.send('service_trizanq', 'template_kbddrwk', {
      from_email: email,
      to_email: to_email
    }, "mzL-kaIaqUfwXy_py")
      .then(() => {
        this.notifier.showNotification("Invitation has been sent to "+ to_email +" successfully!", "OK");
      })
      .catch(error => {
        this.notifier.showNotification(error, "DISMISS");
      });
  }

  sendShareSubEmail(email: string, to_email: string, filename:string, videoId: string) {
    emailjs.send('service_trizanq', 'template_x0t27ro', {
      from_email: email,
      to_email: to_email,
      filename: filename,
      videoId: videoId
    }, "mzL-kaIaqUfwXy_py")
      .then(() => {
        this.notifier.showNotification("Notification has been sent to "+ to_email +" successfully!", "OK");
      })
      .catch(error => {
        this.notifier.showNotification(error, "DISMISS");
      });
  }



}
