import { Injectable } from "@angular/core";
import { CommunityHelpRequest } from "../models/firestore-schema/help-request.model";

@Injectable()
  
export class CommunityHelpService  {
    communityRequestDetails: CommunityHelpRequest;

    setCommunityRequestDetails(details: CommunityHelpRequest): void {
        this.communityRequestDetails = details;
    }
    
}