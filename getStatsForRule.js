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
	 'logging':{
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
      "variables":['speed1','distance1','distance2','distancediff','weight1','weight2','weightdiff','going1','going2','goingdiff','type1','type2','typediff'],
     'functionSet':['+','-','*','/','^','if<='],
     'datafileurl':'/Users/adriangordon/Development/GP/GP/flatobservations.json',
      "rule":[ "-","*","-","if<=","speed1","going2",-6.8351,-2.6192,"^","going2",0.1175,"/","/","goingdiff",-1.6873,"-","/","+",-1.4090,"speed1","^","going1","speed1","if<=","+",-1.4090,9.2973,"if<=","going2","/","if<=","-","/","+",-1.4090,"speed1","^","going1","going2","if<=","speed1","if<=","going2","/","if<=","going2","going1","speed1",4.4473,"if<=","speed1",-5.8824,-1.4090,"going2",-8.9986,"speed1","*",1.2560,-8.9996,9.1184,"going1","speed1",4.4473,"if<=","speed1",-5.8824,-1.4090,"going2",-8.9986,"+","*","/","goingdiff",-1.6873,"+",-1.6873,"speed1","*","/","^",9.2973,"speed1","/",-0.1335,-4.6932,"-","-","*","-","if<=",-8.9986,"+",-7.8231,"*",1.2560,"if<=","going2","if<=","going2","/","/","+",-1.4090,"speed1","going1","if<=","speed1",-5.8824,-1.4090,"going2",-8.9986,"+","*","if<=","speed1","+",-7.8231,"*",1.2560,-8.9996,"+","going2",9.4690,"speed1","+",-1.6873,"speed1",-1.4090,"*",1.2560,-8.9996,9.1184,"+","going2","goingdiff","speed1",-2.6192,"if<=","*","goingdiff",8.6207,"if<=","going1","going2","/","/","goingdiff",-1.6873,"-","/","+",-1.4090,9.2973,"^","going2",0.1175,"+","going1","going1","going1","/","going2","going1","going2",-8.9986,"if<=","goingdiff","going1","going1","if<=","going2","going1",-8.9986,"speed1","*",1.2560,-8.9996,9.1184,"/","goingdiff",-1.2860],
      "gpnodepath":"../Node/GPNode"
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

var observations;
var nodeid=0;

//stats derived from observations
var observationsStats={
  maxSpeedDif:{
    speed1:0.0,
    speed2:0.0,
    dif:0.0
  },
  minSpeedDif:{
    speed1:0.0,
    speed2:0.0,
    dif:0.0
  },
  maxGoingIncrease:0.0,
  maxGoingDecrease:0.0,
  maxDistanceIncrease:0.0,
  maxDistanceDecrease:0.0,
  mindistance:0.0,
  maxdistance:0.0,
  maxWeightIncrease:0.0,
  maxWeightDecrease:0.0,
  maxweight:0.0,
  minweight:0.0,
};





function getObservationsStats(){
  for(var i=0;i<observations.length;i++){
    var observation=observations[i];

    if((observation.speed1 < 25.0 )&&(observation.speed2 < 25.0)&&(observation.weight1 < 190)&&(observation.weight2 < 190)){

    if(i==0){

      if(observation.weight1 > observation.weight2){
        observationsStats.maxdweight=observation.weight1;
        observationsStats.minweight=observation.weight2;
      }
      else{
        observationsStats.maxweight=observation.weight2;
        observationsStats.minweight=observation.weight1;
      }



      if(observation.distance1 > observation.distance2){
        observationsStats.maxdistance=observation.distance1;
        observationsStats.mindistance=observation.distance2;
      }
      else{
        observationsStats.maxdistance=observation.distance2;
        observationsStats.mindistance=observation.distance1;
      }
    }
    else{
      if(observation.weight1 >observationsStats.maxweight ){
        observationsStats.maxweight=observation.weight1;
      }
      if(observation.weight1 <observationsStats.minweight ){
        observationsStats.minweight=observation.weight1;
      }

      if(observation.weight2 >observationsStats.maxdweight ){
        observationsStats.maxweight=observation.weight2;
      }
      if(observation.weight2 < observationsStats.minweight ){
        observationsStats.minweight=observation.weight2;
      }



      if(observation.distance1 >observationsStats.maxdistance ){
        observationsStats.maxdistance=observation.distance1;
      }
      if(observation.distance1 <observationsStats.mindistance ){
        observationsStats.mindistance=observation.distance1;
      }

      if(observation.distance2 >observationsStats.maxdistance ){
        observationsStats.maxdistance=observation.distance2;
      }
      if(observation.distance2 < observationsStats.mindistance ){
        observationsStats.mindistance=observation.distance2;
      }

    }


    var speedDif=(observation.speed1-observation.speed2) / observation.speed1;

    if(speedDif > observationsStats.maxSpeedDif.dif){
      observationsStats.maxSpeedDif={
        speed1:observation.speed1,
        speed2:observation.speed2,
        dif:speedDif
      }
    }

    if(speedDif < observationsStats.minSpeedDif.dif){
      observationsStats.minSpeedDif={
        speed1:observation.speed1,
        speed2:observation.speed2,
        dif:speedDif
      }
    }


    /*if(speedDif > observationsStats.maxSpeedDecrease.dif){
      observationsStats.maxSpeedDecrease={
        speed1:observation.speed1,
        speed2:observation.speed2,
        dif:speedDif

      }
    }
    if(speedDif < observationsStats.maxSpeedIncrease){
      observationsStats.maxSpeedIncrease={
        speed1:observation.speed1,
        speed2:observation.speed2,
        dif:speedDif

      }
    }*/

    var goingdif=observation.goingdiff;

    if(goingdif > observationsStats.maxGoingIncrease){
      observationsStats.maxGoingIncrease=goingdif;
    }
    if(goingdif < observationsStats.maxGoingDecrease){
      observationsStats.maxGoingDecrease=goingdif;
    }

    var distancedif=observation.distancediff;

    if(distancedif > observationsStats.maxDistanceIncrease){
      observationsStats.maxDistanceIncrease=distancedif;
    }
    if(distancedif < observationsStats.maxDistanceDecrease){
      observationsStats.maxDistanceDecrease=distancedif;
    }

    var weightdif=observation.weightdiff;

    if(weightdif > observationsStats.maxWeightIncrease){
      observationsStats.maxWeightIncrease=weightdif;
    }
    if(weightdif < observationsStats.maxWeightDecrease){
      observationsStats.maxWeightDecrease=weightdif;
    }





  }
  }

}


observations= JSON.parse(fs.readFileSync(nconf.get('datafileurl'), 'utf8'));
logger.info("N Observations: " + observations.length);
getObservationsStats();
logger.info(JSON.stringify(observationsStats));
var rule=nconf.get('rule');
//console.log(rule);
//console.log(nconf.get('variables'));
var testNode=new gpnode().parseNode(rule,nconf.get('variables'),nconf.get('functionSet'));
var min=0;
var max=0;

for(var i=0;i<observations.length;i++){
  var observation=observations[i];
  var val= testNode.eval(observation);
  if(val > max)max=val;
  if(val < min)min=val;


}
logger.info('min: ' + min + " max: " + max);


