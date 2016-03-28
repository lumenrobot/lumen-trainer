# Lumen Trainer

Collector for corpus of conversations, usable by Lumen Reasoner.

5 steps to use Lumen Trainer:

1. Collecting raw corpus
    Alternatively: Download raw corpus snapshot
2. Preprocessing raw corpus into train-ready corpus
3. Training the model
4. Testing the trained model
5. Predicting

## Collecting Raw Corpus

1. Create PostgreSQL database `buzz_buzz_dev`
2. Inside database `buzz_buzz_dev`, create schema `buzz`.
3. Clone [soluvas-buzz](https://github.com/soluvas/soluvas-buzz).
4. In `soluvas-buzz/twitter-collector/config`, put `lumen.TwitterApp.jsonld` and `lumen-lumenrobot.TwitterAuthorization.jsonld`
    from `Dropbox/Lumen/config`
5. To collect from `@IndosatCare`, do:

        ./twitter-collector.sh -a lumen -u lumenrobot -p helpdesk_indosatcare indosatcare

    To collect from `@Telkomsel`, do:
    
        ./twitter-collector.sh -a lumen -u lumenrobot -p helpdesk_telkomsel telkomsel

## Download Raw Corpus Snapshot

Hendy only: Get from `Dropbox\Big_Stuff\buzz_backup\daily\postgresql`

## Preprocessing Raw Corpus into Train-Ready Corpus

TODO

## Training the Model

TODO

## Testing the Trained Model

TODO

## Predicting

TODO

