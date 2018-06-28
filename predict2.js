var winston=require('winston');
var fs = require('fs'),

//nconf is used globally
nconf=require("nconf");

//favour environment variables and command line arguments
nconf.env().argv();

//if 'conf' environment variable or command line argument is provided, load 
//the configuration JSON file provided as the value
//
if(path=nconf.get('conf')){
  
  nconf.file({file:path});
 
}

nconf.defaults({
	 logging:{
        "fileandline":true,
        "logger":{
           "console":{
            "level":"info",
            "colorize":true,
            "label":"gp",
            "timestamp":true
            }
          }

     },
     "gpnodepath":"../Node/GPNode",
     "variables":['speed1','distance1','distance2','distancediff','weight1','weight2','weightdiff','going1','going2','goingdiff'],
     "functionSet":['+','-','*','/','^','if<='],
     "datafileurl":'/Users/adriangordon/Development/GP/GP/flatobservations.json',
 });


//configure logging
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

  var gpnode=require(nconf.get("gpnodepath"));

  var rule=nconf.get("rule");
  var stats=nconf.get("observationStats");
  var node=new gpnode().parseNode(rule,nconf.get('variables'),nconf.get('functionSet'));


  var observations=JSON.parse(fs.readFileSync(nconf.get('datafileurl'), 'utf8'));
  //Once through dataset, to get min and max values of the function
  var minfofx=0.0;
  var maxfofx=0.0;
  for(var i=0;i<observations.length;i++){
    var obs=observations[i];
    if(obs.speed1!== null && obs.speed2 !== null){
  
    //for(var i=0;i<1000;i++){
      obs.val=node.eval(obs);
      //console.log(JSON.stringify(obs));
      if(obs.val > maxfofx)maxfofx=obs.val;
      if(obs.val < minfofx)minfofx=obs.val;
    }

  }

  logger.info("minfofx: " + minfofx + " maxfofx: " + maxfofx);
  



  var predictedVal=node.eval(nconf.get("observation"));

  //var observationStats=nconf.get("observationStats").minSpeedDif;
  //console.log(JSON.stringify(observationStats));


  var predictedProportion=(predictedVal - minfofx)/(maxfofx - minfofx);
  var predictedChange=nconf.get('observationStats').minSpeedDif.dif +(predictedProportion *(nconf.get('observationStats').maxSpeedDif.dif - nconf.get('observationStats').minSpeedDif.dif));
  var observation=nconf.get("observation");

  var predictedSpeed=observation.speed1 + (predictedChange *  observation.speed1); 

  logger.info("speed1:" + observation.speed1 + " predictedVal: " + predictedVal + 'predictedProportion: ' + predictedProportion + ' predictedChange: ' + predictedChange + ' predictedSpeed: ' + predictedSpeed);






