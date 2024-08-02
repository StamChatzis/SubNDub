import { Component } from '@angular/core';
import {LoadingService} from "../../../services/loading.service";
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'app-batch-dialog-modal',
  templateUrl: './batch-dialog-modal.component.html',
  styleUrls: ['./batch-dialog-modal.component.css']
})
export class BatchDialogModalComponent {
  public loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null)

  constructor(private loadingService: LoadingService) {
    this.loadingService.loading$.subscribe(isLoading => {
      this.loading.next(isLoading)
    })
  }

  onClickToCreateBatch(){
    this.loadingService.setLoading(true)
  }
}
