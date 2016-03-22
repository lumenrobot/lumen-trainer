import {Page, NavController, NavParams, IonicApp, Content, Alert} from 'ionic-angular';
import {Http, Headers} from 'angular2/http';
import 'rxjs/Rx';

enum Gender {
    UNKNOWN = <any>'UNKNOWN',
    MALE = <any>'MALE',
    FEMALE = <any>'FEMALE'
}

enum CaseStatus {
    /**
     * Client asked but assistant not yet responded.
     */
    NEED_ASSISTANT_RESPONSE = <any>'NEED_ASSISTANT_RESPONSE',
    /**
     * Assistant responded and requiring more information.
     */
    NEED_CLIENT_RESPONSE = <any>'NEED_CLIENT_RESPONSE',
    /**
     * Assistant responded and does not require client to respond.
     * If this is left for some time, case can be transitioned to {@link #RESOLVED}.
     */
    ASSISTANT_RESPONDED = <any>'ASSISTANT_RESPONDED',
    /**
     * Assistant has responded to client request and client does not need
     * further assistance.
     */
    RESOLVED = <any>'RESOLVED'
}

enum ChatActor {
    CLIENT = <any>'CLIENT',
    ASSISTANT = <any>'ASSISTANT'
}

interface SampleConversation {
    id?: number,
    creationTime: string,
    timeZone: string,
    clientName: string,
    clientGender: Gender,
    clientAge: number,
    initiator: ChatActor,
    inLanguage: string,
    caseStatus: CaseStatus,
    messages: SampleMessage[],
    _links: any,
    icon: string
}

interface SampleMessage {
    id?: number,
    conversation?: any,
    actor?: ChatActor,
    creationTime?: string,
    creationTimeObj?: Date,
    bodyText: string    
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

        this.http.get('http://localhost:8114/sampleConversations')
            .map(res => res.json())
            .subscribe(data => this.items = data._embedded.sampleConversations, 
                err => console.error(err), () => console.info('sampleConversations loaded', this.items));

    }
    
    itemTapped(event, item) {
        this.nav.push(ConversationShowPage, {
            conversation: item
        });
    }
    
}

/**
 * Shows a {@link SampleConversation}.
 */
@Page({
    templateUrl: 'build/pages/conversation/conversationshow.html'
})
export class ConversationShowPage {
    conversation: SampleConversation;
    upConversation: SampleConversation;
    messages: SampleMessage[];
    icons: string[];
    items: SampleConversation[];
    form: {response: SampleMessage};

    constructor(private http: Http, private app: IonicApp, private nav: NavController, navParams: NavParams) {
        // If we navigated to this page, we will have an item available as a nav param
        this.upConversation = navParams.get('conversation');
        this.form = {
            response: {
                bodyText: null
            }
        };

        this.http.get(this.upConversation._links.self.href)
            .map(res => res.json())
            .subscribe(data => this.conversation = data,
                err => console.error(err),
                () => console.info('sampleConversation loaded', this.conversation));
    }
    
    ngAfterViewInit() {
        this.reloadMessages();
    }

    reloadMessages() {
        this.http.get(this.upConversation._links.messages.href)
            .map(res => res.json())
            .subscribe(data => {
                this.messages = data._embedded.sampleMessages;
                this.messages.forEach(x => x.creationTimeObj = new Date(x.creationTime));
            }, 
                err => console.error(err),
                () => {
                    console.info('SampleConversation.messages loaded', this.messages);
                    var messagesContent = this.app.getComponent('messagesContent') as Content;
                    messagesContent.scrollTo(0, messagesContent.getContentDimensions().contentHeight, 700);
                });
    }
    
    receiveClientMessage() {
        let prompt = Alert.create({
            title: 'Receive Client Message',
            inputs: [
                {
                    name: 'bodyText',
                    placeholder: 'Enter message...'
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    handler: data => console.debug('Cancel clicked', data)
                },
                {
                    text: 'Send',
                    handler: data => {
                        console.info('Send clicked', data);
                        let clientMessage: SampleMessage = {
                            conversation: this.conversation._links.self.href,
                            actor: ChatActor.CLIENT,
                            bodyText: data.bodyText
                        };
                        var json = JSON.stringify(clientMessage);
                        this.http.post('http://localhost:8114/sampleMessages', json,
                                {headers: new Headers({'Content-Type': 'application/json'})})
                            .subscribe(data => { console.info('Posted:', data); this.form.response.bodyText = null; }, 
                                err => console.error(err),
                                () => this.reloadMessages());
                    }
                },
            ]
        });
        this.nav.present(prompt);
    }

    responseKeyPress(event: KeyboardEvent) {
        if (event.keyCode == 13) {
            this.sendMessage();
        }
    }
    
    sendMessage() {
        this.form.response.conversation = this.conversation._links.self.href;
        this.form.response.actor = ChatActor.ASSISTANT;
        var json = JSON.stringify(this.form.response);
        this.http.post('http://localhost:8114/sampleMessages', json,
                {headers: new Headers({'Content-Type': 'application/json'})})
            .subscribe(data => { console.info('Posted:', data); this.form.response.bodyText = null; }, 
                err => console.error(err),
                () => this.reloadMessages());
    }
}
