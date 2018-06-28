
//nconf is used globally
nconf=require('nconf');

//favour environment variables and command line arguments
nconf.env().argv();

//if 'conf' environment variable or command line argument is provided, load 
//the configuration JSON file provided as the value
if(path=nconf.get('conf')){
  //logger.info("use file: " + path);
  nconf.file({file:path});
 
}

nconf.defaults(
{
  
    "bfdatabaseurl"     : "localhost/bfdata",
    "logging":{
        "fileandline":true,
        "logger":{
           "console":{
            "level":"info",
            "colorize":true,
            "label":"scrape",
            "timestamp":true
            }
          }

     },
     "host":"localhost",
     "port":"3000",
     "processtimeout":1800000 //half an hour
});


var moment=require('moment');

var rpCollections=["races"];
var rpDatabaseUrl=nconf.get("rpdatabaseurl");
var rpdb=require("mongojs").connect(rpDatabaseUrl, rpCollections);

var bfCollections=["bfraces"];
var bfDatabaseUrl=nconf.get("bfdatabaseurl");
var bfdb = require("mongojs").connect(bfDatabaseUrl, bfCollections);

var courseLookup=nconf.get("courseLookup");

//configure logging
var winston=require('winston');
var loggingConfig=nconf.get('logging');


var fileAndLine=loggingConfig.fileandline;



Object.keys(loggingConfig).forEach(function(key){
   
    if(key!= "fileandline")winston.loggers.add(key,loggingConfig[key]);

});

//logger is used globally

logger=require('winston').loggers.get('logger');
logger.exitOnError=false;

if(fileAndLine){
  var logger_info_old=logger.info;
  logger.info=function(msg){
    var fandl=traceCaller(1);
    return(logger_info_old.call(this,fandl + " " + msg));
  }


  var logger_error_old=logger.error;
  logger.error=function(msg){
    var fandl=traceCaller(1);
    return(logger_error_old.call(this,fandl + " " + msg));
  }
 
}

function traceCaller(n) {
    if( isNaN(n) || n<0) n=1;
    n+=1;
    var s = (new Error()).stack
      , a=s.indexOf('\n',5);
    while(n--) {
      a=s.indexOf('\n',a+1);
      if( a<0 ) { a=s.lastIndexOf('\n',s.length); break;}
    }
    b=s.indexOf('\n',a+1); if( b<0 ) b=s.length;
    a=Math.max(s.lastIndexOf(' ',b), s.lastIndexOf('/',b));
    b=s.lastIndexOf(':',b);
    s=s.substring(a+1,b);
    return s;
  }

//end logging config


//iterate over all bf bets which don't have a rp raceid

var bfRaceCursor=bfdb.bfraces.find({rpraceid:{$exists:false}});

doProcessOneRace();

function doProcessOneRace(){
   
  bfRaceCursor.next(function(err, race) {
     if(race){
      var course=race.course;
        //logger.info(course);
        var rpCourse=courseLookup[course];
        //logger.info(rpCourse);
        if(typeof rpCourse == 'undefined'){
          logger.error("No lookup for course: " + course);
          doProcessOneRace();
        }
        else{
          var scheduledOff=race.scheduled_off;
          var bfOfftimeMoment=moment.utc(scheduledOff).toDate();
          var bfDateText=moment.utc(bfOfftimeMoment).format('YYYY-MM-DD');
          var bfHourText=moment.utc(bfOfftimeMoment).format('H');
          var bfMinuteText=moment.utc(bfOfftimeMoment).format('mm');

          var bfHoursI=parseInt(bfHourText);

          if(bfHoursI > 12)bfHoursI-=12;

          var timeSearchString="" + bfHoursI + ":" + bfMinuteText;
          var search={
            date:new Date(bfDateText + "T00:00:00.000Z"),
            meeting:{$regex:rpCourse},
            offtime:{$regex:timeSearchString}
            
          }
          //meeting:{$regex:rpCourse},
          //  offtime:{$regex:timeSearchString}
          //logger.info(JSON.stringify(search));
          rpdb.races.findOne(search,function(err, rprace){
            if(rprace){
              //logger.info("date and course and time found: " + JSON.stringify(race) + " " +JSON.stringify(rprace));
              logger.info("update bfrace: " + race._id + " with rpraceid: " + rprace._id);
              bfdb.bfraces.update({_id:race._id},{$set:{rpraceid:rprace._id}},function(err){
                doProcessOneRace();
              });
              
            }
            else{
              logger.info("RP date and course and time not Not found: " + JSON.stringify(search));
              doProcessOneRace();
            }
            

          })

          //logger.info(course + " " +scheduledOff + " " + bfDateText + " " + bfHoursI + ":" + bfMinuteText);
          //doProcessOneRace();
        }

        
      }
      else{
        process.exit();
      }
    });
  }


