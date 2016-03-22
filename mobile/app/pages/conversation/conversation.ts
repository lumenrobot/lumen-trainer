import {Page, NavController, NavParams} from 'ionic-angular';
import {Http, Headers} from 'angular2/http';
import 'rxjs/Rx';

interface SampleConversation {
    id?: number,
    creationTime: string,
    clientName: string,
    clientGender: string,
    clientAge: number,
    icon: string
}

/**
 * Lists SampleConversation objects.
 */
@Page({
    templateUrl: 'build/pages/conversation/conversationlist.html'
})
export class ConversationListPage {
    selectedItem: any;
    icons: string[];
    items: SampleConversation[];


    constructor(private http: Http, private nav: NavController, navParams: NavParams) {
        // If we navigated to this page, we will have an item available as a nav param
        this.selectedItem = navParams.get('item');

        this.http.get('http://localhost:8114/sampleConversations/')
            .map(res => res.json())
            .subscribe(data => this.items = data._embedded.sampleConversations, err => console.error(err), () => console.info('sampleConversations loaded', this.items));

    }

    itemTapped(event, item) {
        this.nav.push(ConversationListPage, {
            item: item
        });
    }
}
