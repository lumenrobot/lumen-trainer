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

## Preprocessing Raw Corpus into Train-Ready Corpus

### Select and Join into Cases Dataset

1. Execute:

        set HADOOP_HOME=D:\spark
        set SPARK_CLASSPATH=D:\spark\lib\postgresql-9.4.1208.jar
        D:
        cd \spark
        bin\spark-shell --packages com.databricks:spark-csv_2.10:1.4.0

2. In Spark Shell, get the DataFrame.
    Currently `buzz.twitterstatus` table causes Spark to throw `SQLException: Unsupported type 1111` ([SPARK-7869](https://issues.apache.org/jira/browse/SPARK-7869))
    due to `geography` columns, so we wrapped the table in a Spark-friendly view called `twitterstatus_simple`.
    
    Read from JDBC:
    
        val twitterstatus = sqlContext.read.format("jdbc").options(
            Map("driver" -> "org.postgresql.Driver",
                "url" -> "jdbc:postgresql://localhost/buzz_buzz_dev?user=postgres&password=bippo",
                "dbtable" -> "buzz.twitterstatus_simple")).load()

    TODO: `mediacontent` should be in different table!

    **Spark Crash Course (Optional): Inspecting the Raw Dataset**
    
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

3. Now we can get all the replies:
    
        val replies = (twitterstatus.filter("project_id = 'helpdesk_telkomsel' AND userscreenname = 'Telkomsel'")
            .groupBy($"inreplytostatusid")
            .agg(count($"id").alias("replystatuscount"), concat_ws(" ", collect_list($"text")).alias("reply")))
        
4. And join them to the original statuses:
    
        val inquiries = twitterstatus.filter("project_id = 'helpdesk_telkomsel'").select($"statusid", $"userscreenname", $"text".as("inquiry")) 
        val cases0 = (replies.join(inquiries, replies("inreplytostatusid") === inquiries("statusid"))
            .select($"statusid", $"userscreenname", $"inquiry", $"reply", $"replystatuscount"))
        cases0.show()

5. Naive whitespace cleaning to make the TSV output correct:

        import org.apache.spark.sql.functions._
        val cases = cases0.withColumn("inquiry", regexp_replace($"inquiry", "\\s+", " ")).withColumn("reply", regexp_replace($"reply", "\\s+", " "))
        cases.show()
        
5. Output to Parquet and TSV:
    
        import java.io._
        import org.apache.commons.io._
        FileUtils.deleteDirectory(new File("telkomsel_cases.parquet"))
        FileUtils.deleteDirectory(new File("telkomsel_cases.tsv"))
        cases.coalesce(1).write.save("telkomsel_cases.parquet")
        cases.coalesce(1).write.format("com.databricks.spark.csv").option("header", "true").option("delimiter", "\t").save("telkomsel_cases.tsv")
        
6. Backup Parquet and TSV file to Hendy's Dropbox: (Use your own folder)
    Unfortunately the Parquet has dynamic filename, please copy it manually.

        FileUtils.copyFile(new File("D:/spark/telkomsel_cases.tsv/part-00000"), 
            new File("C:/Users/ceefour/Dropbox/Lumen/Reasoning/helpdesk/telkomsel_cases.tsv"))

### Tokenizing the Dataset

You should now have a **cases** dataset such as `C:/Users/ceefour/Dropbox/Lumen/Reasoning/helpdesk/telkomsel_cases.parquet`.

We need to process `*_cases.tsv` file by transforming `inquiry` to `inquiry_clean` and `reply` to `reply_clean`.
Most processing are case-insensitive unless marked otherwise:

0. Read the cases dataset

        val cases = sqlContext.read.load("C:/Users/ceefour/Dropbox/Lumen/Reasoning/helpdesk/telkomsel_cases.parquet")
            
1. Make lowercase (both)

        import org.apache.spark.sql.functions._
        val tokendf1 = cases.withColumn("inquirymain", lower($"inquiry")).withColumn("replymain", lower($"reply"))

2. Remove @telkomsel (inquiry only)

        val tokendf2 = tokendf1.withColumn("inquirymain", regexp_replace($"inquirymain", "@telkomsel", ""))
        tokendf2.select("inquirymain").head()

3. Remove all @userscreenname mentions (reply only)

        val tokendf3 = tokendf2.withColumn("replymain", regexp_replace($"replymain", "(?<![a-z0-9_])@[a-z0-9_]+", ""))
        tokendf3.select("replymain").head()

4. Remove `(?<![a-z0-9_])-[a-z]+` (reply only). This is the staff name of the replier.

        val tokendf4 = tokendf3.withColumn("replymain", regexp_replace($"replymain", "(?<![a-z0-9_])-[a-z]+", ""))
        tokendf4.select("replymain").head()

5. Remove "[\d]" (reply only). This is the tweet number in multi-tweet reply.

        val tokendf5 = tokendf4.withColumn("replymain", regexp_replace($"replymain", "\\[\\d\\]", ""))
        tokendf5.select("replymain").head(10)

6. Remove "(mbak|mas|pak|bu)( \w+|[.,])" (reply only)

        val tokendf6 = tokendf5.withColumn("replymain", regexp_replace($"replymain", """(mbak|mas|pak|bu)( \w+|[.,])""", ""))
        tokendf6.select("reply", "replymain").head(10)

7. Separate word boundaries.

        val tokendf7 = (tokendf6.withColumn("inquirymain", regexp_replace($"inquirymain", """(?<!\s)\b(?!\s)*""", " "))
            .withColumn("replymain", regexp_replace($"replymain", """(?<!\s)\b(?!\s)""", " ")))
        tokendf7.select("inquirymain", "replymain").head(3)

8. Tokenize. (should we use OpenNLP? I think this is enough though.)

        import org.apache.spark.ml._
        import org.apache.spark.ml.feature._
        val inquiryTokenizer = new Tokenizer().setInputCol("inquirymain").setOutputCol("inquirytokens")
        val replyTokenizer = new Tokenizer().setInputCol("replymain").setOutputCol("replytokens")
        val tokendf8 = replyTokenizer.transform(inquiryTokenizer.transform(tokendf7))
        tokendf8.select("inquirytokens", "replytokens").head(10)

9. Synonym replacement (regex based first e.g. `pagi+` -> `pagi`), then static based e.g. `bila` -> `jika`)
    and spell correction (u/ -> untuk, etc.). For spell correction, maybe you can have Indonesian
    dictionary + Levenshtein corrector.
10. Stop words: min, admin, pagi, sore, siang, malam, kak, yang, kok, koq, kan, deh
    Remove ,+./()#!?

        val stopWords = Array("", ",", ".", "!", "?", "??", "???", ":(", ":)", "#", "@", "min", "admin", "pagi", "sore", "siang", "malam", "kak", "yang", "kok", "koq", "kan", "deh", "dan", "atau", "atas", "silakan", "yang", "menjadi", "sebagai", "kami", "bantu", "dahulu")
        val inquiryRemover = (new StopWordsRemover()
            .setStopWords(stopWords)
            .setInputCol("inquirytokens")
            .setOutputCol("inquiryfiltereds"))
        val replyRemover = (new StopWordsRemover()
            .setStopWords(stopWords)
            .setInputCol("replytokens")
            .setOutputCol("replyfiltereds"))
        val tokendf10 = replyRemover.transform(inquiryRemover.transform(tokendf8))
        tokendf10.select("inquiryfiltereds", "replyfiltereds").head(10)

12. OpenNLP-tokenize then re-join using " ". This effectively does trim also. (both)

References:

* http://spark.apache.org/docs/latest/ml-guide.html
* https://spark.apache.org/docs/latest/ml-features.html

### TODO: Try doing binary classification on each of the reply labels instead

Yes, this means you'll train 1000 NN models for 1000 labels (reply words).
But make a proof of concept with, say, 3 labels. So you have 2^3 = 8 possible combinations. If you can get 100% accurate
for 3 labels, then you're good :)

### Extract Features/Vectorize the Dataset

I try to mimic: Vinyals, O., Le, Q. (2015). [A neural conversational model](http://arxiv.org/pdf/1506.05869v1.pdf). arXiv preprint arXiv:1506.05869.

Now we need to convert that into feature-extracted dataset (word2vec), so each word/token from `inquiry_clean` becomes a column:

1. Load the `tokenized` dataset

        val featuredf = tokendf10

2. Hashing TF

        val inquiryHashingTF = new HashingTF().setNumFeatures(1000).setInputCol("inquiryfiltereds").setOutputCol("inquiryfeatures")
        val featuredf2 = inquiryHashingTF.transform(featuredf)
        featuredf2.select("inquiryfeatures").head()
        
    Previous attempt with hashingTF labels (not working):

        val inquiryHashingTF = new HashingTF().setNumFeatures(1000).setInputCol("inquiryfiltereds").setOutputCol("inquiryfeatures")
        val replyHashingTF = new HashingTF().setNumFeatures(1000).setInputCol("replyfiltereds").setOutputCol("replylabels")
        val featuredf2 = replyHashingTF.transform(inquiryHashingTF.transform(featuredf))
        featuredf2.select("inquiryfeatures", "replylabels").head()
        
        val labelIndexer = new StringIndexer().setInputCol("replyfiltereds").setOutputCol("replylabels").fit(featuredf)
        labelIndexer.transform(featuredf).show()

3. Join reply tokens as label then index label
        
        val joinUdf = udf((filtereds: Seq[String]) => filtereds.mkString(" "))
        val featuredf3 = featuredf2.withColumn("replylabel", joinUdf($"replyfiltereds"))
        featuredf3.select("replylabel").head(10)
        val labelIndexer = new StringIndexer().setInputCol("replylabel").setOutputCol("replyid").fit(featuredf3)
        val featuredf4 = labelIndexer.transform(featuredf3)
        // compare the dataset row count with labels size? ideally labels should be much (< 10%) fewer
        featuredf4.count()
        labelIndexer.labels.size
        featuredf4.select("replylabel", "replyid").head(10)

## Training the Model

See: https://databricks.com/blog/2015/12/02/databricks-and-h2o-make-it-rain-with-sparkling-water.html

1.

        import org.apache.spark.ml.classification._
        val layers = Array[Int](1000, 1, labelIndexer.labels.size)
        val trainer = (new MultilayerPerceptronClassifier().setLayers(layers).setBlockSize(128).setMaxIter(100)
            .setFeaturesCol("inquiryfeatures").setLabelCol("replyid"))
        val model = trainer.fit(featuredf4)

## Testing the Trained Model

1.
        val test = featuredf4.limit(10)
        model.transform(test).select("inquiryfiltereds", "replylabel", "replyid", "prediction").show()
        
## Predicting

TODO

