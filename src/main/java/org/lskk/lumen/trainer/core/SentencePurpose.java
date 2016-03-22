package org.lskk.lumen.trainer.core;

/**
 * <a href="https://freelance-writing-articles.knoji.com/the-different-classification-of-sentences/">Classification of sentences</a>. <a href="http://www.k12reader.com/4-sentence-types/">4 Sentence types</a>.
 * Created by ceefour on 23/03/2016.
 */
public enum SentencePurpose {
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
    DECLARATIVE,
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
    INTERROGATIVE,
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
    IMPERATIVE,
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
    EXCLAMATORY
}
