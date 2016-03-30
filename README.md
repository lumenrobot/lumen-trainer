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

## Spark Preparation

1. You need to copy `hadoop-2.7.1/winutils.exe` (download from https://github.com/steveloughran/winutils) into `D:\spark\bin`
    (see http://stackoverflow.com/a/34184857/122441, https://blogs.msdn.microsoft.com/arsen/2016/02/09/resolving-spark-1-6-0-java-lang-nullpointerexception-not-found-value-sqlcontext-error-when-running-spark-shell-on-windows-10-64-bit/)

2. Execute: (this will add _Everyone_ to `D:\tmp\hive`'s Security)

        D:
        cd \spark
        bin\winutils chmod777 \tmp\hive

3. Download http://search.maven.org/remotecontent?filepath=org/postgresql/postgresql/9.4.1208/postgresql-9.4.1208.jar into
    D:\spark\lib

## Inspecting the Raw Corpus using Spark

1. Execute:

        set HADOOP_HOME=D:\spark
        set SPARK_CLASSPATH=D:\spark\lib\postgresql-9.4.1208.jar
        D:
        cd \spark
        bin\spark-shell --packages com.databricks:spark-csv_2.10:1.4.0

2. In Spark Shell, get the DataFrame.
    Currently `buzz.twitterstatus` table causes Spark to throw `SQLException: Unsupported type 1111` ([SPARK-7869](https://issues.apache.org/jira/browse/SPARK-7869))
    due to `geography` columns, so we need to wrap the table in a Spark-friendly view.
    
    In PgAdmin / `psql`:
    
        CREATE OR REPLACE VIEW buzz.twitterstatus_clean AS
        SELECT id, project_id, statusid, fetchtime, creationtime, timezone, 
                                          userscreenname, userid, username, userlocation, userlang, text, 
                                          lang, retweet, inreplytostatusid, inreplytouserid, inreplytoscreenname, 
                                          placeid, placename, placefullname, placetype, placeuri, placecountry, 
                                          placecountrycode, placestreetaddress, placeboundingboxswlat, 
                                          placeboundingboxswlon, placeboundingboxnelat, placeboundingboxnelon, 
                                          placeboundingboxtype, lat, lon, mediaid, mediatext, mediaurihttp, 
                                          mediaurihttps, mediatype, medianormaluri, mediadisplayuri, mediaexpandeduri, 
                                          mediasizes, mediacontenttype, mediacontentlength, mediaextension, 
                                          mediawidth, mediaheight
                                     FROM buzz.twitterstatus

    In Spark Shell:
    
        val twitterstatus = sqlContext.read.format("jdbc").options(
            Map("driver" -> "org.postgresql.Driver",
                "url" -> "jdbc:postgresql://localhost/buzz_buzz_dev?user=postgres&password=bippo",
                "dbtable" -> "buzz.twitterstatus_clean")).load()

    TODO: `mediacontent` should be in different table!

    Now you can get number of loaded:
    
        twitterstatus.count()
        
    Inspect schema and some rows:
    
        twitterstatus.printSchema()
        twitterstatus.show()
        twitterstatus.take(3)

    Filter a bit: (check [DataFrame API](http://spark.apache.org/docs/latest/api/scala/index.html#org.apache.spark.sql.DataFrame))
    
        twitterstatus.select("project_id", "userscreenname", "inreplytoscreenname", "text").show()
        twitterstatus.filter("project_id = 'helpdesk_telkomsel'").select("project_id", "userscreenname", "inreplytoscreenname", "text").show()
        twitterstatus.filter("project_id = 'helpdesk_telkomsel' AND userscreenname = 'Telkomsel'").groupBy($"inreplytostatusid").agg(count($"id").alias("replystatuscount"), concat_ws(" ", collect_list($"text")).alias("reply")).show()

    Now we can get all the replies:
    
        val replies = twitterstatus.filter("project_id = 'helpdesk_telkomsel' AND userscreenname = 'Telkomsel'").groupBy($"inreplytostatusid").agg(count($"id").alias("replystatuscount"), concat_ws(" ", collect_list($"text")).alias("reply"))
        
    And join them to the original statuses:
    
        val inquiries = twitterstatus.filter("project_id = 'helpdesk_telkomsel'").select($"statusid", $"userscreenname", $"text".as("inquiry")) 
        var telkomsel_cases = replies.join(inquiries, replies("inreplytostatusid") === inquiries("statusid")).select($"statusid", $"userscreenname", $"inquiry", $"reply", $"replystatuscount")
        telkomsel_cases.show()
        
    Output to CSV:
    
        telkomsel_cases.coalesce(1).write.format("com.databricks.spark.csv").option("header", "true").option("delimiter", "\t").save("telkomsel_cases.tsv")

## Preprocessing Raw Corpus into Train-Ready Corpus

So we need to process `*_cases.tsv` file by transforming `inquiry` to `inquiry_clean` and `reply` to `reply_clean`.
Most processing are case-insensitive unless marked otherwise:

1. Make lowercase (both)
2. Remove @telkomsel (inquiry only)
3. Remove all @userscreenname mentions (reply only)
4. Remove "-[A-Za-z]+" (reply only)
5. Remove "[\d]" (reply only)
6. Remove "(mbak|mas) (\w+)" (reply only)
7. Remove "(mbak|mas)[.]" (reply only)
8. Synonym replacement&and spell correction (u/ -> untuk, etc.). For spell correction, maybe you can have Indonesian
    dictionary + Levenshtein corrector.
9. Stop words: min, admin, pagi, sore, siang, malam, kak, yang, kok, koq, kan, deh
10. Replace ,+./()#!? with " "
11. OpenNLP-tokenize then re-join using " ". This effectively does trim also. (both)

Now we need to convert that into feature-extracted dataset (word2vec), so each word/token from `inquiry_clean` becomes a column:

TODO

## Training the Model

See: https://databricks.com/blog/2015/12/02/databricks-and-h2o-make-it-rain-with-sparkling-water.html

TODO

## Testing the Trained Model

TODO

## Predicting

TODO

