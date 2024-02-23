

var Sentiment = require('sentiment');
const { Builder, Browser, By, Key, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const diacritic = require('diacritic'); 
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');

let db2;
async function connectDatabase(){
  if(!db2){
    var client = await MongoClient.connect('mongodb://localhost:27017/');
    db2 = client.db('news_analyse');
    console.log('connected to database server: ', ' mongodb://localhost:27017/' +  'news_analyse')
  }
  return db2
}
 
async function chooseDBconnection(collection){
    var res = await db2.collection(collection).find({}).sort({_id:-1}).toArray();
    return res
  
}

async function createDBconnection(collection, document){
    var res = await db2.collection(collection).insertOne(document)
    return res
  
}

async function deleteDBconnection(collection, id){
    var res = await db2.collection(collection).deleteOne( { "_id" : new ObjectId(id) } ); 
    return res
  
}

function generateTime(time){
    var second = time % 60;
    var minute = Math.floor(time / 60) % 60;
    var hour = Math.floor(time / 3600) % 24;
    var days = Math.floor(time / 86400);

    second = (second < 10) ? '0'+second : second;
    minute = (minute < 10) ? '0'+minute : minute;
    hour = (hour < 10) ? '0'+hour : hour;
    day = (days < 10) ? '0'+ days : days;

    return day + ':' + hour + ':' + minute + ':' + second
}

function sleep(ms) {
    return new Promise((resolve) => { setTimeout(resolve, ms); })
}


var infoArray = []
var infoArray2 = []
var infoArray3 = []
  
var frequencyTable = {
    'a': '8.2',
    'b': '1.5',
    'c': '2.8',
    'd': '4.3',
    'e': '12.7',
    'f': '2.2',
    'g': '2.0',
    'h': '6.1',
    'i': '7.0',
    'j': '0.15',
    'k': '0.77',
    'l': '4.0',
    'm': '2.4',
    'n': '6.7',
    'o': '7.5',
    'p': '1.9',
    'q': '0.095',
    'r': '6.0',
    's': '6.3',
    't': '9.1',
    'u': '2.8', 
    'v': '0.98',
    'w': '2.4',
    'x': '0.15',
    'y': '2.0',
    'z': '0.074'
}

var alphaPoints = {
    '20': 'Izteikts ar kaunu',
    '30': 'Izteikts ar pazemojumu',
    '50': 'Izteikts ar intereses trūkumu',
    '75': 'Izteikts ar žēlumu',
    '100': 'Izteikts ar bailēm',
    '125': 'Izveikts ar velmēm',
    '150': 'Izteikts ar dusmām',
    '175': 'Izteikts ar lepnumu',
    '200': 'Izteikts ar drosmi',
    '250': 'Izteikts neitrāli',
    '310': 'Izteikts ar pārvarēšanu',
    '350': 'Izteikts caur iemeslu meklēšanu',
    '400': 'Izteikts ar prieku',
    '500': 'Izteikts ar mīlestību',
    '540': 'Izteikts ar komfortu',
    '600': 'Izteikts ar mieru',
    '700': 'Visticamāk salietojies prieku'
}

async function example() {
    let options = new firefox.Options();
    options.headless();
  
    let driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
  
  try {
    await driver.get('https://www.delfi.lv/archive/latest');
    const headlines = await driver.findElements(By.className('headline__title'));

    for (const headline of headlines) {
      const spanElement = await headline.findElement(By.tagName('span'));
      const text = await spanElement.getText();

      infoArray.push(text) 
    }
  } finally {
    await driver.quit();
  }
}

async function example2() {
    let options = new firefox.Options();
    options.headless();
  
    let driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
  
  try {
    await driver.get('https://www.delfi.lv/life/archive/latest');
    const headlines = await driver.findElements(By.className('headline__title'));

    for (const headline of headlines) {
      const spanElement = await headline.findElement(By.tagName('span'));
      const text = await spanElement.getText();

      infoArray2.push(text) 
    }
  } finally {
    await driver.quit();
  }
}

async function example3() {
    let options = new firefox.Options();
    options.headless();
  
    let driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
  
  try {
    await driver.get('https://www.delfi.lv/bizness/archive/latest');
    const headlines = await driver.findElements(By.className('headline__title'));

    for (const headline of headlines) {
      const spanElement = await headline.findElement(By.tagName('span'));
      const text = await spanElement.getText();

      infoArray3.push(text) 
    }
  } finally {
    await driver.quit();
  }
}
 
var status = 1
var botUTC = 0;
var botTime = 0;
var news_added = 0;
var newest_article = ''
var newest_article_time = ''
var newest_article_type = ''
var news_total = ''
var totalpositive = 0
var totalnegative = 0

async function generateFULL(infoArray, index){
    var finalRESULTS = []
    for(var e=0; e<infoArray.length; e++){
        var textX = infoArray[e]
        var sentiment = new Sentiment();
        var result = sentiment.analyze(infoArray[e]);
        var finalresult = ""
        if(result.score > 0){
            finalresult = 'pozitīvs'
        } else {
            if(result.score === 0){
                finalresult = 'neitrāls'
            } else {
                finalresult = 'negatīvs'
            }
        }

        const normalizedString = textX.replace(/[^\x00-\x7F]/g, '').replace(/[^a-zA-Z0-9]/g, '').split('');
        var maxFrequency = 0
        var aplhaPoint = ''
        for(var v=0; v<normalizedString.length; v++){  
            maxFrequency += Number(frequencyTable[normalizedString[v].toLowerCase()])
        }
        maxFrequency = (maxFrequency).toFixed(0)

        var keys_x = Object.keys(alphaPoints)
        for(var k=0; k<keys_x.length; k++){
            
            if(Number(maxFrequency) >= Number(keys_x[k]) & Number(maxFrequency) <= Number(keys_x[k+1])){
                aplhaPoint = keys_x[k]
            }
        } 

        var typeX = ''
        if(index === '1'){ typeX = 'tops'}
        if(index === '2'){ typeX = 'dzīve'}
        if(index === '3'){ typeX = 'bizness'}

        finalRESULTS.push({'text': infoArray[e], 'result': finalresult, 'frequency': maxFrequency, 'alpha': aplhaPoint, 'alphatext': alphaPoints[aplhaPoint], 'date': new Date(Date.now()).toLocaleString(), 'full': result, 'type': typeX }) 
    }

    return finalRESULTS
}

async function handleALL(){ 
    var news_previous = await chooseDBconnection('news') 
    news_total = news_previous.length
    var finalRESULTS = []
    
    var e1 = await generateFULL(infoArray, '1')
    var e2 = await generateFULL(infoArray2, '2')
    var e3 = await generateFULL(infoArray3, '3')
    for(var v1=0; v1<e1.length; v1++){ finalRESULTS.push(e1[v1])}
    for(var v2=0; v2<e2.length; v2++){ finalRESULTS.push(e2[v2])}
    for(var v3=0; v3<e3.length; v3++){ finalRESULTS.push(e3[v3])}

    
 
    if(finalRESULTS.length > 0){ 
        for(var j=0; j<finalRESULTS.length; j++){
            var text_match = news_previous.filter(obj => { return obj.text === (finalRESULTS[j]['text']).toString()})
            if(text_match.length === 0){
                news_added++
                newest_article = finalRESULTS[j]['text']
                newest_article_time = finalRESULTS[j]['date']
                newest_article_type = finalRESULTS[j]['type']
                await createDBconnection('news', finalRESULTS[j]) 
            }
        } 
 
    }

    if(news_previous.length > 0){
        var objFinal = {}
        for(var t=0; t<news_previous.length; t++){ 
            var day1 = new Date(news_previous[t]['date']).getDate()
            var month1 = new Date(news_previous[t]['date']).getUTCMonth() + 1
            var year1 = new Date(news_previous[t]['date']).getFullYear()
            var formated = day1 + '-' + month1 + '-' + year1
 
            objFinal[formated] = {
                'tops': { 'pozitīvs': '', 'negatīvs': '', 'neitrāls': ''},
                'dzīve': { 'pozitīvs': '', 'negatīvs': '', 'neitrāls': ''},
                'bizness': { 'pozitīvs': '', 'negatīvs': '', 'neitrāls': ''} 
            }  
        }

        for(var t1=0; t1<news_previous.length; t1++){ 
            var day1 = new Date(news_previous[t1]['date']).getDate()
            var month1 = new Date(news_previous[t1]['date']).getUTCMonth() + 1
            var year1 = new Date(news_previous[t1]['date']).getFullYear()
            var formated = day1 + '-' + month1 + '-' + year1
 
            if(news_previous[t1]['result'] === 'pozitīvs'){
                objFinal[formated][news_previous[t1]['type']]['pozitīvs'] = Number(objFinal[formated][news_previous[t1]['type']]['pozitīvs']) + 1  
            } else {
                if(news_previous[t1]['result'] === 'negatīvs'){
                    objFinal[formated][news_previous[t1]['type']]['negatīvs'] = Number(objFinal[formated][news_previous[t1]['type']]['negatīvs']) + 1 
                   
                } else {
                    if(news_previous[t1]['result'] === 'neitrāls'){
                        objFinal[formated][news_previous[t1]['type']]['neitrāls'] = Number(objFinal[formated][news_previous[t1]['type']]['neitrāls']) + 1 
                        
                    }
                }
            }

        }

         

        var finalV = Object.keys(objFinal) 
        for(var t=0; t<finalV.length; t++){
            var date_name = finalV[t]
            var date_data = objFinal[date_name]

             
            totalpositive += Number(date_data['tops']['pozitīvs'])
            totalpositive += Number(date_data['dzīve']['pozitīvs'])
            totalpositive += Number(date_data['bizness']['pozitīvs']) 
            totalnegative += Number(date_data['tops']['negatīvs'])
            totalnegative += Number(date_data['dzīve']['negatīvs'])
            totalnegative += Number(date_data['bizness']['negatīvs']) 

        }

        console.log(objFinal) 
    }
    
    infoArray = []
    
} 
 
 
async function startAPP(){
    await connectDatabase()
    await example() 
    await example2()
    await example3()

    setInterval(async() => {
        await example() 
        await example2()
        await example3()
    }, 1120000)

    while(status == 1){
        botTime++;
        D = generateTime(botTime)
        botUTC = D
    
        var finalSentiment = 'negative'
        if(Number(totalpositive) > Number(totalnegative)){ finalSentiment = 'positive'} 

        await handleALL()
        var logText = {
            'botUTC': botUTC,
            'total_positive': totalpositive,
            'total_negative': totalnegative,
            'final_sentiment': finalSentiment,
            'news_added': news_added,
            'news_total': news_total,
            'newest_article': newest_article,
            'newest_article_time': newest_article_time,
            'newest_article_type': newest_article_type
        }
        
        console.log(logText) 
        

        await sleep(1000)
        totalnegative = 0
        totalpositive = 0
         
    }
     
}
startAPP()
 
