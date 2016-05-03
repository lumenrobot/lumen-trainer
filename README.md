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

3. Remove all @userscreenname mentions (both)

        val tokendf3 = (tokendf2.withColumn("inquirymain", regexp_replace($"inquirymain", "(?<![a-z0-9_])@[a-z0-9_]+", ""))
            .withColumn("replymain", regexp_replace($"replymain", "(?<![a-z0-9_])@[a-z0-9_]+", "")) )
        tokendf3.select("inquirymain", "replymain").head()

4. Remove `(?<![a-z0-9_])-[a-z]+` (reply only). This is the staff name of the replier.

        val tokendf4 = tokendf3.withColumn("replymain", regexp_replace($"replymain", "(?<![a-z0-9_])-[a-z]+", ""))
        tokendf4.select("replymain").head()

5. Remove "[\d]" (reply only). This is the tweet number in multi-tweet reply.

        val tokendf5 = tokendf4.withColumn("replymain", regexp_replace($"replymain", "\\[\\d\\]", ""))
        tokendf5.select("replymain").head(10)

6. Remove "(mbak|mas|pak|bu)( \w+|[.,])" (reply only)

        val tokendf6 = tokendf5.withColumn("replymain", regexp_replace($"replymain", """(mbak|mas|pak|bu)( \w+|[.,])""", ""))
        tokendf6.select("reply", "replymain").head(10)

7. Remove http/s, 0812345xxx (both)

        val tokendf7 = ( tokendf6.withColumn("inquirymain", regexp_replace( regexp_replace($"inquirymain", """http(s?)://\S+""", ""), """0[0-9x]+""", "") )
            .withColumn("replymain", regexp_replace( regexp_replace($"replymain", """http(s?)://\S+""", ""), """0[0-9x]+""", "") ) )
        tokendf7.select("replymain", "reply").head(10)
        // ensure filtered
        tokendf7.filter($"inquirymain".like("%http%")).head(1)
        tokendf7.filter($"inquirymain".like("%0812%")).head(1)
        tokendf7.filter($"replymain".like("%http%")).head(1)

8. Separate word boundaries. Remove a single letter or a word consisting of only numerics. Remove all non-word tokens.

        val tokendf8 = (tokendf7.withColumn("inquirymain", regexp_replace( regexp_replace( regexp_replace($"inquirymain", """(?<!\s)\b(?!\s)*""", " "), """\b(\w|[0-9]+)\b""", " "), """\W+""", " ") )
            .withColumn("replymain", regexp_replace( regexp_replace( regexp_replace($"replymain", """(?<!\s)\b(?!\s)*""", " "), """\b(\w|[0-9]+)\b""", " "), """\W+""", " ") ) )
        tokendf8.select("inquirymain", "replymain").head(10)

9. Tokenize. (should we use OpenNLP? I think this is enough though.)

        import org.apache.spark.ml._
        import org.apache.spark.ml.feature._
        val inquiryTokenizer = new Tokenizer().setInputCol("inquirymain").setOutputCol("inquirytokens")
        val replyTokenizer = new Tokenizer().setInputCol("replymain").setOutputCol("replytokens")
        val tokendf9 = replyTokenizer.transform(inquiryTokenizer.transform(tokendf8))
        tokendf9.select("inquirytokens", "replytokens").head(10)

10. Synonym replacement (regex based first e.g. `pagi+` -> `pagi`), then static based e.g. `bila` -> `jika`)
    and spell correction (u/ -> untuk, etc.). For spell correction, maybe you can have Indonesian
    dictionary + Levenshtein corrector.
11. Stop words: min, admin, pagi, sore, siang, malam, kak, yang, kok, koq, kan, deh
    Remove ,+./()#!?

        val stopWords = Array("", ",", ".", "!", "?", "??", "???", ":(", ":)", "*", "#", "@", "/", "-", "(", ")", "min", "admin", "pagi", "sore", "siang", "malam", "kak", "yang", "kok", "koq", "kan", "deh", "kah", "dan", "atau", "atas", "silakan", "yang", "yg", "menjadi", "sebagai", "kami", "bantu", "dahulu", "hai", "di", "nya", "sangat", "sgt", "amat")
        val inquiryRemover = (new StopWordsRemover()
            .setStopWords(stopWords)
            .setInputCol("inquirytokens")
            .setOutputCol("inquiryfiltereds"))
        val replyRemover = (new StopWordsRemover()
            .setStopWords(stopWords)
            .setInputCol("replytokens")
            .setOutputCol("replyfiltereds"))
        val tokendf11 = replyRemover.transform(inquiryRemover.transform(tokendf9))
        tokendf11.select("inquiryfiltereds", "replyfiltereds").head(10)

    Let's count the filtered tokens, both inquiry and reply:
    
        val inquiryExploded = tokendf11.select(explode($"inquiryfiltereds").alias("inquirytoken"))
        inquiryExploded.show()
        val inquiryIndexer = new StringIndexer().setInputCol("inquirytoken").setOutputCol("inquirytokenid").fit(inquiryExploded)
        // make this < 1000
        inquiryIndexer.labels.size
        inquiryIndexer.labels
        println(inquiryIndexer.labels.mkString(" "))
    
12. OpenNLP-tokenize then re-join using " ". This effectively does trim also. (both)
13. Save it:

        import java.io._
        import org.apache.commons.io._
        FileUtils.deleteDirectory(new File("telkomsel_tokenized.parquet"))
        tokendf11.coalesce(1).write.save("telkomsel_tokenized.parquet")

    Please copy to `Dropbox/Lumen/Reasoning/helpdesk`.

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

        val featuredf = sqlContext.read.load("C:/Users/ceefour/Dropbox/Lumen/Reasoning/helpdesk/telkomsel_tokenized.parquet")

2. Hashing TF (inquiry only)

        import org.apache.spark.sql.functions._
        import org.apache.spark.ml._
        import org.apache.spark.ml.feature._
        val inquiryHashingTF = new HashingTF().setNumFeatures(1000).setInputCol("inquiryfiltereds").setOutputCol("inquiryfeatures")
        val featuredf2 = inquiryHashingTF.transform(featuredf)
        featuredf2.select("inquiryfiltereds", "inquiryfeatures").head()
        
    Not working: Previous attempt with hashingTF labels:

        val inquiryHashingTF = new HashingTF().setNumFeatures(1000).setInputCol("inquiryfiltereds").setOutputCol("inquiryfeatures")
        val replyHashingTF = new HashingTF().setNumFeatures(1000).setInputCol("replyfiltereds").setOutputCol("replylabels")
        val featuredf2 = replyHashingTF.transform(inquiryHashingTF.transform(featuredf))
        featuredf2.select("inquiryfeatures", "replylabels").head()
        
        val labelIndexer = new StringIndexer().setInputCol("replyfiltereds").setOutputCol("replylabels").fit(featuredf)
        labelIndexer.transform(featuredf).show()

3. Not working well: Join reply tokens as label then index label
        
        val joinUdf = udf((filtereds: Seq[String]) => filtereds.mkString(" "))
        val featuredf3 = featuredf2.withColumn("replylabel", joinUdf($"replyfiltereds"))
        featuredf3.select("replylabel").head(10)
        val labelIndexer = new StringIndexer().setInputCol("replylabel").setOutputCol("replyid").fit(featuredf3)
        val featuredf4 = labelIndexer.transform(featuredf3)
        // compare the dataset row count with labels size? ideally labels should be much (< 10%) fewer
        featuredf4.count()
        labelIndexer.labels.size
        featuredf4.select("replylabel", "replyid").head(10)

    Not working well: Attempt just use binary classification for X top reply words/labels:

        val labelExploded = featuredf2.select(explode($"replyfiltereds").alias("replylabel"))
        labelExploded.show()
        val labelIndexer = new StringIndexer().setInputCol("replylabel").setOutputCol("replyid").fit(labelExploded)
        labelIndexer.labels.size
        labelIndexer.labels
        println(labelIndexer.labels.mkString(" "))

    Use this for now: Attempt just use binary classification. e.g. `terima` reply:

        val joinUdf = udf((filtereds: Seq[String]) => filtereds.mkString(" "))
        val featuredf3 = featuredf2.withColumn("replyfiltered", joinUdf($"replyfiltereds"))
        featuredf3.select("replyfiltered").head(10)
        val featuredf4 = (featuredf3.withColumn("terimaLabel", $"replyfiltered".like("%terima%").cast("double"))
            .withColumn("baikLabel", $"replyfiltered".like("%baik%").cast("double"))
            .withColumn("cekLabel", $"replyfiltered".like("%cek%").cast("double")))
        featuredf4.select($"inquiryfiltereds", $"terimaLabel", $"baikLabel", $"cekLabel").show()
        
        // Split Training & Test Dataset
        val test = featuredf4.limit(20)
        val train = featuredf4.except(test)
        
        // Training
        import org.apache.spark.ml.classification._
        val layers = Array[Int](1000, 20, 2)
        val terimaTrainer = (new MultilayerPerceptronClassifier().setLayers(layers).setBlockSize(128).setMaxIter(50)
            .setFeaturesCol("inquiryfeatures").setLabelCol("terimaLabel"))
        val terimaModel = terimaTrainer.fit(train).setPredictionCol("terimaPrediction")
        val baikTrainer = (new MultilayerPerceptronClassifier().setLayers(layers).setBlockSize(128).setMaxIter(50)
            .setFeaturesCol("inquiryfeatures").setLabelCol("baikLabel"))
        val baikModel = baikTrainer.fit(train).setPredictionCol("baikPrediction")
        val cekTrainer = (new MultilayerPerceptronClassifier().setLayers(layers).setBlockSize(128).setMaxIter(50)
            .setFeaturesCol("inquiryfeatures").setLabelCol("cekLabel"))
        val cekModel = cekTrainer.fit(train).setPredictionCol("cekPrediction")
        // Test!
        val predicted = cekModel.transform(baikModel.transform(terimaModel.transform(test)))
        predicted.select("inquiryfiltereds", "replyfiltered", "terimaLabel", "terimaPrediction", "baikLabel", "baikPrediction", "cekLabel", "cekPrediction").show()

## Experiment: Training, Reply HashingTF are reduced using PCA first

*TODO*: Fixing these may give you better performance:

    // PCA
    16/04/02 18:16:54 WARN LAPACK: Failed to load implementation from: com.github.fommil.netlib.NativeSystemLAPACK
    16/04/02 18:16:54 WARN LAPACK: Failed to load implementation from: com.github.fommil.netlib.NativeRefLAPACK
    // Linear Regression
    16/04/02 18:17:03 WARN BLAS: Failed to load implementation from: com.github.fommil.netlib.NativeSystemBLAS
    16/04/02 18:17:03 WARN BLAS: Failed to load implementation from: com.github.fommil.netlib.NativeRefBLAS

LM doesn't work at all! :(

    val inquiryHashingTF = new HashingTF().setNumFeatures(1000).setInputCol("inquiryfiltereds").setOutputCol("inquiryfeatures")
    val replyHashingTF = new HashingTF().setNumFeatures(1000).setInputCol("replyfiltereds").setOutputCol("replylabels")
    val featuredf2 = replyHashingTF.transform(inquiryHashingTF.transform(featuredf))
    featuredf2.select("replyfiltereds", "replylabels").show()
    
    // PCA the replylabels
    featuredf2.select("replylabels").map(x => x.getAs[SparseVector](0)).first()
    featuredf2.select("replylabels").map(x => x(0))
    val pca = new org.apache.spark.ml.feature.PCA().setK(3).setInputCol("replylabels").setOutputCol("replypca")
    val pcaModel = pca.fit(featuredf2)
    import org.apache.spark.mllib.linalg._
    val v0udf = udf((x: Vector) => x(0))
    val v1udf = udf((x: Vector) => x(1))
    val v2udf = udf((x: Vector) => x(2))
    val featuredf3 = pcaModel.transform(featuredf2).withColumn("replypca0", v0udf($"replypca") ).withColumn("replypca1", v1udf($"replypca") ).withColumn("replypca2", v2udf($"replypca") )
    featuredf3.select("replyfiltereds", "replylabels", "replypca", "replypca0", "replypca1", "replypca2").show()
    // Split Training & Test Dataset
    val test = featuredf3.limit(20)
    val train = featuredf3.except(test)
    // Train
    import org.apache.spark.ml.classification._
    import org.apache.spark.ml.regression._
    val pca0Trainer = (new LinearRegression().setMaxIter(100).setRegParam(0.3).setElasticNetParam(0.8)
        .setFeaturesCol("inquiryfeatures").setLabelCol("replypca0"))
    val pca0Model = pca0Trainer.fit(train).setPredictionCol("prediction0")
    val pca1Trainer = (new LinearRegression().setMaxIter(100).setRegParam(0.3).setElasticNetParam(0.8)
        .setFeaturesCol("inquiryfeatures").setLabelCol("replypca1"))
    val pca1Model = pca1Trainer.fit(train).setPredictionCol("prediction1")
    val pca2Trainer = (new LinearRegression().setMaxIter(100).setRegParam(0.3).setElasticNetParam(0.8)
        .setFeaturesCol("inquiryfeatures").setLabelCol("replypca2"))
    val pca2Model = pca2Trainer.fit(train).setPredictionCol("prediction2")
    // Validate on train
    val validated = pca2Model.transform(pca1Model.transform(pca0Model.transform(train)))
    validated.select("inquiryfiltereds", "replyfiltereds", "replypca0", "prediction0", "replypca1", "prediction1", "replypca2", "prediction2").show()
    // Test!
    val predicted = pca2Model.transform(pca1Model.transform(pca0Model.transform(test)))
    predicted.select("inquiryfiltereds", "replyfiltereds", "replypca0", "prediction0", "replypca1", "prediction1", "replypca2", "prediction2").show()

Result:

    +--------------------+--------------------+--------------------+--------------------+--------------------+--------------------+--------------------+------------------+
    |    inquiryfiltereds|      replyfiltereds|           replypca0|         prediction0|           replypca1|         prediction1|           replypca2|       prediction2|
    +--------------------+--------------------+--------------------+--------------------+--------------------+--------------------+--------------------+------------------+
    |[pagiii, ada, lag...|[selamat, ada, bi...| -0.3314020219168389| -0.9912411564400341| 0.10456535127247156|  0.1516935557851563| 0.18097083199219668|0.4340939616977683|
    |[filmnasionalfavo...|[terima, kasih, p...|  0.5069582705150794|-0.22704097315143223| -0.9607766570659154|-0.28251291428610076|   0.941528669847476|0.4340939616977683|
    |[filmnasionalfavo...|[terima, kasih, p...|  0.5504657038728358|-0.22704097315143223| -0.9975449049444007|-0.28251291428610076|  0.9868268279466268|0.4340939616977683|

### Try RandomForest Regressor:

    val inquiryHashingTF = new HashingTF().setNumFeatures(1000).setInputCol("inquiryfiltereds").setOutputCol("inquiryfeatures")
    val replyHashingTF = new HashingTF().setNumFeatures(1000).setInputCol("replyfiltereds").setOutputCol("replylabels")
    val featuredf2 = replyHashingTF.transform(inquiryHashingTF.transform(featuredf))
    featuredf2.select("replyfiltereds", "replylabels").show()
    
    // PCA the replylabels
    featuredf2.select("replylabels").map(x => x.getAs[SparseVector](0)).first()
    featuredf2.select("replylabels").map(x => x(0))
    val pca = new org.apache.spark.ml.feature.PCA().setK(3).setInputCol("replylabels").setOutputCol("replypca")
    val pcaModel = pca.fit(featuredf2)
    import org.apache.spark.mllib.linalg._
    val vudf = udf((x: Vector, idx: Integer) => x(idx))
    val vlimitudf = udf((x: Vector) => new DenseVector(Array(x(0), x(1), x(2))))
    val featuredf3 = pcaModel.transform(featuredf2).withColumn("replypca0", vudf($"replypca", lit(0)) ).withColumn("replypca1", vudf($"replypca", lit(1)) ).withColumn("replypca2", vudf($"replypca", lit(2)) ).withColumn("replypca", vlimitudf($"replypca"))
    featuredf3.select("replyfiltereds", "replylabels", "replypca", "replypca0", "replypca1", "replypca2").show()
    // Split Training & Test Dataset
    val test = featuredf3.limit(20)
    val train = featuredf3.except(test)
    // Train
    import org.apache.spark.ml.classification._
    import org.apache.spark.ml.regression._
    val layers = Array[Int](1000, 20, 1)
    val maxDepth = 10
    val numTrees = 20
    val pca0Trainer = (new RandomForestRegressor().setMaxDepth(maxDepth).setNumTrees(numTrees)
        .setFeaturesCol("inquiryfeatures").setLabelCol("replypca0"))
    val pca0Model = pca0Trainer.fit(train).setPredictionCol("prediction0")
    val pca1Trainer = (new RandomForestRegressor().setMaxDepth(maxDepth).setNumTrees(numTrees)
        .setFeaturesCol("inquiryfeatures").setLabelCol("replypca1"))
    val pca1Model = pca1Trainer.fit(train).setPredictionCol("prediction1")
    val pca2Trainer = (new RandomForestRegressor().setMaxDepth(maxDepth).setNumTrees(numTrees)
        .setFeaturesCol("inquiryfeatures").setLabelCol("replypca2"))
    val pca2Model = pca2Trainer.fit(train).setPredictionCol("prediction2")
    
    // Validate PCA0 only on train
    val validated = pca0Model.transform(train))
    validated.select("inquiryfiltereds", "inquiryfeatures", "replyfiltereds", "replypca0", "prediction0").show()
    // Validate on train
    var pivot = train.filter($"inquirymain".startsWith(" min knp sinyal")).select("inquirymain", "replypca").head()
    val trainV = pivot.getAs[Vector](1) 
    val assembler = new VectorAssembler().setInputCols(Array("prediction0", "prediction1", "prediction2")).setOutputCol("prediction")
    val distUdf = udf( (a: Vector, b: Vector) => Vectors.sqdist(a, b) )
    val distpivotUdf = udf( (a: Vector) => Vectors.sqdist(a, trainV) )
    val validated = assembler.transform(pca2Model.transform(pca1Model.transform(pca0Model.transform(train)))).withColumn("dist", distUdf($"replypca", $"prediction")).withColumn("distpivot", distpivotUdf($"prediction"))
    validated.select("inquiryfiltereds", "replyfiltereds", "replypca", "prediction", "dist", "distpivot").show()
    
    validated.select("inquiryfiltereds", "replyfiltereds", "replypca0", "prediction0", "replypca1", "prediction1", "replypca2", "prediction2").show()
    // Test!
    val predicted = pca2Model.transform(pca1Model.transform(pca0Model.transform(test)))
    predicted.select("inquiryfiltereds", "replyfiltereds", "replypca0", "prediction0", "replypca1", "prediction1", "replypca2", "prediction2").show()

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

