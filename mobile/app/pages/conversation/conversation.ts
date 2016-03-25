import {Page, NavController, NavParams, IonicApp, Content, Alert, Modal, ViewController} from 'ionic-angular';
import {Http, Headers, URLSearchParams} from 'angular2/http';
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

/**
 * Based on <a href="http://emotion-research.net/projects/humaine/earl">HUMAINE EARL</a>
 * and <a href="https://en.wikipedia.org/wiki/Contrasting_and_categorization_of_emotions#Plutchik.27s_wheel_of_emotions">Plutchik's</a>.
 * Created by ceefour on 07/10/2015.
 */
enum EmotionKind {
    NEUTRAL = <any>'NEUTRAL',
    /**
     * Happiness is a mental or emotional state of well-being defined by positive or pleasant emotions ranging from contentment to intense joy.[1] A variety of biological, psychological, religious and philosophical approaches have striven to define happiness and identify its sources. Various research groups, including positive psychology, are employing the scientific method to research questions about what "happiness" is, and how it might be attained.
     */
    JOY = <any>'JOY',
    /**
     * In a social context, trust has several connotations. Definitions of trust typically refer to a situation characterized by the following aspects: One party (trustor) is willing to rely on the actions of another party (trustee); the situation is directed to the future. In addition, the trustor (voluntarily or forcedly) abandons control over the actions performed by the trustee. As a consequence, the trustor is uncertain about the outcome of the other's actions; they can only develop and evaluate expectations. The uncertainty involves the risk of failure or harm to the trustor if the trustee will not behave as desired. Vladimir Ilych Lenine expresses this idea with the sentence “Trust is good, control is better”.
     */
    TRUST = <any>'TRUST',
    /**
     * Fear is a feeling induced by perceived danger or threat that occurs in certain types of organisms, which causes a change in metabolic and organ functions and ultimately a change in behavior, such as fleeing, hiding or freezing from perceived traumatic events. Fear in human beings may occur in response to a specific stimulus occurring in the present, or in anticipation or expectation of a future threat perceived as a risk to body or life. The fear response arises from the perception of danger leading to confrontation with or escape from/avoiding the threat (also known as the fight-or-flight response), which in extreme cases of fear (horror and terror) can be a freeze response or paralysis.
     */
    FEAR = <any>'FEAR',
    /**
     * Surprise is a brief mental and physiological state, a startle response experienced by animals and humans as the result of an unexpected event. Surprise can have any valence; that is, it can be neutral/moderate, pleasant, unpleasant, positive, or negative. Surprise can occur in varying levels of intensity ranging from very-surprised, which may induce the fight-or-flight response, or little-surprise that elicits a less intense response to the stimuli.
     */
    SURPRISE = <any>'SURPRISE',
    /**
     * Sadness (also called heavy-heartedness) is emotional pain associated with, or characterized by feelings of disadvantage, loss, despair, grief, helplessness, disappointment and sorrow. An individual experiencing sadness may become quiet or lethargic, and withdraw themselves from others. An example of severe sadness is depression. Crying is often an indication of sadness.
     */
    SADNESS = <any>'SADNESS',
    /**
     * Disgust is an emotional response of revulsion to something considered offensive, distasteful, or unpleasant. In The Expression of the Emotions in Man and Animals, Charles Darwin wrote that disgust is a sensation that refers to something revolting. Disgust is experienced primarily in relation to the sense of taste (either perceived or imagined), and secondarily to anything which causes a similar feeling by sense of smell, touch, or vision. Musically sensitive people may even be disgusted by the cacophony of inharmonious sounds. Research continually has proven a relationship between disgust and anxiety disorders such as arachnophobia, blood-injection-injury type phobias, and contamination fear related obsessive–compulsive disorder (also known as OCD).
     */
    DISGUST = <any>'DISGUST',
    /**
     * Anger or wrath is an intense emotional response. It is a normal emotion that involves a strong uncomfortable and emotional response to a perceived provocation. Often it indicates when one's personal boundaries are violated. Some have a learned tendency to react to anger through retaliation. Anger may be utilized effectively by setting boundaries or escaping from dangerous situations. Some people describe anger as a normal emotion that involves a strong uncomfortable and emotional response to a perceived provocation. Raymond Novaco of UC Irvine, who since 1975 has published a plethora of literature on the subject, stratified anger into three modalities: cognitive (appraisals), somatic-affective (tension and agitations), and behavioral (withdrawal and antagonism). William DeFoore, an anger-management writer, described anger as a pressure cooker: we can only apply pressure against our anger for a certain amount of time until it explodes.
     */
    ANGER = <any>'ANGER',
    /**
     * Anticipation, or being enthusiastic, is an emotion involving pleasure, excitement, and sometimes anxiety in considering some expected or longed-for good event.
     */
    ANTICIPATION = <any>'ANTICIPATION'
}

/**
 * <a href="https://freelance-writing-articles.knoji.com/the-different-classification-of-sentences/">Classification of sentences</a>. <a href="http://www.k12reader.com/4-sentence-types/">4 Sentence types</a>.
 * Created by ceefour on 23/03/2016.
 */
enum SentencePurpose {
    /**
     * Make it easier for R/Spark/H2O that doesn't support NULL very well.
     */
    UNKNOWN = <any>'UNKNOWN',
    /**
     * Declarative sentences make a statement to relay information or ideas. They are punctuated with a simple period. Formal essays or reports are composed almost entirely of declarative sentences.
     *
     * <p>Examples of Declarative Sentences:</p>
     *
     * <ul>
     *     <li>The concert begins in two hours.</li>
     *     <li>July 4th is Independence Day.</li>
     *     <li>Declarative sentences make a statement</li>.
     *     <li>You’re a good man, Charlie Brown.</li>
     *     <li>Green is my favorite color.</li>
     *     <li>Hawaii is a tropical climate.</li>
     * </ul>
     */
    DECLARATIVE = <any>'DECLARATIVE',
    /**
     * Interrogative sentences are also easy to spot. That’s because they always ask a question and end in a question mark.
     *
     * <p>Examples of Interrogative Sentences:</p>
     *
     * <ul>
     *     <li>Is it snowing?</li>
     *     <li>Have you had breakfast?</li>
     *     <li>Do you want Coke or Pepsi?</li>
     *     <li>Who are you taking to the prom?</li>
     *     <li>You like Mexican food, don’t you?</li>
     * </ul>
     * <p>Notice that the interrogatives may require a simple yes/no response or are more open ended, each end in a question mark.</p>
     */
    INTERROGATIVE = <any>'INTERROGATIVE',
    /**
     * Imperative sentences issue commands or requests or they can express a desire or wish. They are punctuated with a simple period or they can be exclamations requiring an exclamation mark. It all depends on the strength of emotion you want to express. Exclamatory sentences can consist of a single verb or they can be more lengthy and complex.
     *
     * <p>Examples of Imperative Sentences:</p>
     *
     * <ul>
     *     <li>Halt!</li>
     *     <li>Yield.</li>
     *     <li>Watch for oncoming traffic.</li>
     *     <li>Respond immediately.</li>
     *     <li>Please lower your voice.</li>
     *     <li>Meet me at the town square.</li>
     *     <li>Drop what you’re doing and come celebrate with us!</li>
     </ul>
     */
    IMPERATIVE = <any>'IMPERATIVE',
    /**
     * Exclamatory sentences express strong emotion. It doesn’t really matter what the emotion is, an exclamatory sentence is the type of sentence needed to express it. Exclamatory sentences always end in an exclamation mark, so it’s pretty easy to spot them.  Use exclamatory sentences to portray emotion but take care to use them sparingly. Otherwise, your writing will lack sincerity.
     *
     * <p>Examples of Exclamatory Sentences</p>
     *
     * <ul>
     *     <li>The river is rising!</li>
     *     <li>I can’t wait for the party!</li>
     *     <li>I don’t know what I’ll do if I don’t pass this test!</li>
     *     <li>Oh, my goodness, I won!</li>
     *     <li>Suddenly, a bear appeared in my path!</li>
     *     <li>This is the best day of my life!</li>
     *     <li>Please don’t go!</li>
     * </ul>
     */
    EXCLAMATORY = <any>'EXCLAMATORY'
}

enum ChatActor {
    CLIENT = <any>'CLIENT',
    ASSISTANT = <any>'ASSISTANT'
}

interface SampleConversation {
    id?: number,
    creationTime?: string,
    timeZone?: string,
    clientName?: string,
    clientGender?: Gender,
    clientAge?: number,
    initiator?: ChatActor,
    inLanguage?: string,
    caseStatus?: CaseStatus,
    messages?: SampleMessage[],
    _links?: any
}

interface SampleMessage {
    id?: number,
    conversation?: any,
    actor?: ChatActor,
    creationTime?: string,
    creationTimeObj?: Date,
    bodyText: string,
    emotionKind?: EmotionKind,
    sentencePurpose?: SentencePurpose
}

var apiUri;
if ('8100' == window.location.port) {
    // local development mode
    apiUri = window.location.protocol + '//' + window.location.hostname + ':8284' + '/api/';
} else if ('80' == window.location.port || '443' == window.location.port) {
    // standard deployment mode
    apiUri = window.location.protocol + '//' + window.location.hostname + '/api/';
} else {
    // custom deployment mode
    apiUri = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/api/';
}
console.info('API URI:', apiUri);

@Page({
    templateUrl: 'build/pages/conversation/conversationadd-modal.html'
})
class ConversationAddModal {
    conversation: SampleConversation;
    
    constructor(private viewCtrl: ViewController,
        private nav: NavController,
        private params: NavParams,
        private app: IonicApp) {
        this.conversation = params.get('conversation');
        console.debug('ConversationAddModal.conversation =', this.conversation);
    }
    
    dismiss() {
        this.viewCtrl.dismiss();
    }
    
    ngAfterViewInit() {
        this.app.getComponent('conversationClientName').setFocus();
    }
    
    send() {
        if (this.conversation.clientName == null || this.conversation.clientName == '') {
            let alert = Alert.create({
                'title': 'Missing Client Name',
                'subTitle': 'Please enter client name.',
                buttons: ['OK']
            });
            this.nav.present(alert);
            return;
        }
        if (this.conversation.clientGender == null || this.conversation.clientGender == Gender.UNKNOWN) {
            let alert = Alert.create({
                'title': 'Missing Client Gender',
                'subTitle': 'Please select client gender.',
                buttons: ['OK']
            });
            this.nav.present(alert);
            return;
        }
        if (this.conversation.clientAge == null || this.conversation.clientAge < 0) {
            let alert = Alert.create({
                'title': 'Missing Client Age',
                'subTitle': 'Please enter client age.',
                buttons: ['OK']
            });
            this.nav.present(alert);
            return;
        }
        this.viewCtrl.dismiss(this.conversation);
    }
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
    }
    
    onPageWillEnter() {
        this.reloadConversations();
    }
    
    reloadConversations() {
        this.http.get(apiUri + 'sampleConversations/search/findTopUnresponded', 
                {search: 'size=200'})
            .map(res => res.json())
            .subscribe(data => this.items = data._embedded.sampleConversations, 
                err => console.error(err), () => console.info('sampleConversations loaded', this.items));
    }
    
    itemTapped(event, item) {
        this.nav.push(ConversationShowPage, {
            conversation: item
        });
    }
    
    addConversation() {
        let newConversation: SampleConversation = {
            clientGender: Gender.FEMALE,
            clientAge: 25
        };
        let modal = Modal.create(ConversationAddModal, {conversation: newConversation});
        modal.onDismiss(conversation => {
            if (conversation != null) {
                var json = JSON.stringify(conversation);
                this.http.post(apiUri + 'sampleConversations', json,
                        {headers: new Headers({'Content-Type': 'application/json'})})
                    .subscribe(data => { console.info('Posted SampleConversation:', data); }, 
                        err => console.error(err),
                        () => this.reloadConversations());
            }
        });
        this.nav.present(modal);
    }
}

@Page({
    templateUrl: 'build/pages/conversation/respond-modal.html'
})
class RespondModal {
    response: SampleMessage;
    
    constructor(private viewCtrl: ViewController,
        private nav: NavController,
        private params: NavParams,
        private app: IonicApp) {
        this.response = params.get('response');
        console.debug('RespondModal.response =', this.response);
    }
    
    ngAfterViewInit() {
        this.app.getComponent('respondModalBodyText').setFocus();
    }
    
    dismiss() {
        this.viewCtrl.dismiss();
    }
    
    send() {
        if (this.response.bodyText == null || this.response.bodyText == '') {
            let alert = Alert.create({
                'title': 'Missing Message',
                'subTitle': 'Please type message.',
                buttons: ['OK']
            });
            this.nav.present(alert);
            return;
        }
        if (this.response.sentencePurpose == null || this.response.sentencePurpose == SentencePurpose.UNKNOWN) {
            let alert = Alert.create({
                'title': 'Missing Purpose',
                'subTitle': 'Please select purpose.',
                buttons: ['OK']
            });
            this.nav.present(alert);
            return;
        }
        if (this.response.emotionKind == null) {
            let alert = Alert.create({
                'title': 'Missing Emotion',
                'subTitle': 'Please select emotion.',
                buttons: ['OK']
            });
            this.nav.present(alert);
            return;
        }
        this.viewCtrl.dismiss(this.response);
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
    purposeIcons = {
        'UNKNOWN': 'remove', 
        'DECLARATIVE': 'information-circle',
        'INTERROGATIVE': 'help-circle',
        'IMPERATIVE': 'arrow-dropright-circle',
        'EXCLAMATORY': 'alert'};
    emotionIcons = {
        'NEUTRAL': '1f610_neutral',
        'JOY': '1f603_joy',
        'TRUST': '1f607_trust',
        'FEAR': '1f631_fear',
        'SURPRISE': '1f632_surprise',
        'SADNESS': '1f622_sadness',
        'DISGUST': '1f616_disgust',
        'ANGER': '1f624_anger',
        'ANTICIPATION': '1f633_anticipation'
    };

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
    
    refocusInput() {
        var messagesContent = this.app.getComponent('messagesContent') as Content;
        if (null != messagesContent) {
            messagesContent.scrollTo(0, messagesContent.getContentDimensions().contentHeight, 700);
        }
        this.app.getComponent('responseInput').setFocus();
        window.setTimeout(() => {
            let responseInput = this.app.getComponent('responseInput');
            if (responseInput != null) responseInput.setFocus();
        }, 700);
    }
    
    ngAfterViewInit() {
        this.reloadMessages();
    }

    reloadMessages() {
        this.http.get(apiUri + 'sampleMessages/search/findAllByConversationId',
            {search: 'conversationId=' + this.upConversation.id + '&sort=creationTime,desc&page=0&size=50'})
            .map(res => res.json())
            .subscribe(data => {
                this.messages = (data._embedded.sampleMessages as SampleMessage[]).reverse();
                this.messages.forEach(x => x.creationTimeObj = new Date(x.creationTime));
            }, 
                err => console.error(err),
                () => {
                    console.info('SampleConversation.messages loaded', this.messages);
                    this.refocusInput();
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
                        this.http.post(apiUri + 'process/sampleMessages', json,
                                {headers: new Headers({'Content-Type': 'application/json'})})
                            .map(res => res.json())
                            .subscribe(data => { 
                                console.info('Posted SampleMessage:', data);
                                data.creationTimeObj = new Date(data.creationTime); 
                                this.messages.push(data); 
                                this.form.response.bodyText = null; 
                            }, 
                                err => console.error(err),
                                () => this.refocusInput());
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
        let modal = Modal.create(RespondModal, {response: this.form.response});
        modal.onDismiss(response => {
            if (response != null) {
                response.conversation = this.conversation._links.self.href;
                response.actor = ChatActor.ASSISTANT;
                var json = JSON.stringify(response);
                this.http.post(apiUri + 'process/sampleMessages', json,
                        {headers: new Headers({'Content-Type': 'application/json'})})
                    .map(res => res.json())
                    .subscribe(data => {
                        console.info('Posted:', data);
                        data.creationTimeObj = new Date(data.creationTime); 
                        this.messages.push(data); 
                        this.form.response.bodyText = null; 
                    }, 
                        err => console.error(err),
                        () => this.refocusInput());
            }
        });
        this.nav.present(modal);
    }
}
