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
      'minfofx': -3822.29204809203,
      'maxfofx':  2728.4733961504203,
      'minspeeddif':-0.41814347028775656,
      'maxspeeddif': 0.2946788078697486,
      'observation':{"speed1":16.24880956959883,"speed2":17.3041683220497,"datediff":0,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1400,"distance2":2800,"distancediff":1400,"weight1":130,"weight2":130,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf2b6"}

     
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


var nodeid=0;



function node(args){
  this.id=nodeid++;
  this.type=args.type;//function|variable|constant
  this.functionname=args.functionname;//if it is a function
  this.variablename=args.variablename;//if it is a variable
  this.value=args.value;//value if it is a constant;

  if(typeof this.functionname !== 'undefined'){
    if(this.functionname=='if<=')
      this.arity=4;
    else this.arity=2;

    if(typeof args.arguments !== 'undefined')
      this.arguments=args.arguments;//new Array(arity);
    else this.arguments=new Array(this.arity);
  }


  this.copy=function(){

    var copy=new node({type:this.type,functionname:this.functionname, variablename:this.variablename,value:this.value});

    if(this.type=='function'){
       copy.arguments=new Array(this.arity);

      for(var i=0;i<this.arity;i++){
        copy.arguments[i]=this.arguments[i].copy();
      }
    }

    return(copy);
  }

  this.toArray=function(){

    if(this.type=='function'){
      //var f=[this];

      var args=[this];

      for(var i=0;i<this.arity;i++){
        var arg=this.arguments[i];
        args=args.concat(arg.toArray());
      }
      return(args);

    }
    else {
      var list=[this];
      return(list);
    }
  }

  this.selectIndex=function(isFunction){

    var ar=this.toArray();
    var selected=false;
    var selectedIndex;

    while(!selected){
      var i=Math.floor(Math.random() * ar.length)
      var sn=ar[i]; //randomly select an element

      if(typeof isFunction == 'undefined'){ //no argument, either fn or terminal is acceptable
        selected=true;
        selectedIndex=i;
      }
      else if(isFunction){        //only return a function
        if(sn.type=="function"){
          selected=true;
          selectedIndex=i;

        }
      }
      else if(sn.type != 'function'){   //only returna terminal
        selected=true;
        selectedIndex=i;

      }

      


    }






    return(selectedIndex);


  }

  this.getAbsError=function(variablebindings){

    var val=this.eval(variablebindings);
    if(isNaN(val)){
      logger.info(this.toStrArr());
      logger.info(JSON.stringify(variablebindings))
    }

    var speed1=variablebindings.speed1;
    var speed2=variablebindings.speed2;

    //var err=variablebindings.speed2-val;

    var observed=((speed2 -speed1)/speed1) * 100000;

    var err=observed - val;

    //logger.info("val: " + val + " err: " + err);

    return(Math.abs(err));

  }



  

  this.eval=function(variablebindings){ 
    try{
      if(this.type=='constant'){
        return(this.value);
      }
      else if(this.type=='variable'){
        return(variablebindings[this.variablename]);
      }
      else if(this.type=='function'){
        var argVals=new Array(this.arity);

        for(var i=0;i<this.arity;i++){
          argVals[i]=this.arguments[i].eval(variablebindings);
        }

        if(this.functionname=='+'){
          var rval=parseFloat(argVals[0]) + parseFloat(argVals[1]);
          if(isNaN(rval)){
            //logger.info(JSON.stringify(this) + " " + rval + " " + JSON.stringify(argVals))
            return(0)
          }
          return(rval);
        }
        else if(this.functionname=='-'){
          var rval=argVals[0] - argVals[1];
          if(isNaN(rval)){
            //logger.info(JSON.stringify(this) + JSON.stringify(argVals))
            return(0)
          }
          return(rval);
          
        }
        else if(this.functionname=='*'){
          var rval=argVals[0] * argVals[1];
          if(isNaN(rval)){
            //logger.info(this.toStrArr() + " " + JSON.stringify(argVals))
            return(0)
          }
          return(rval);
          
        }
        else if(this.functionname=='/'){
          var rval;
          if(argVals[0]==0)rval=0
          else rval=argVals[0] / argVals[1];
          if(isNaN(rval)){
            //logger.info(JSON.stringify(this) + JSON.stringify(argVals));
            return(0)
            
          }
          return(rval);
          
        }
        else if(this.functionname=='^'){
          //logger.info(JSON.stringify(argVals));
          var rval=Math.pow(argVals[0], Math.floor(argVals[1]));
          if(!isFinite(rval)){
            rval=Number.MAX_VALUE;
          }
          if(isNaN(rval)){
            //logger.info(JSON.stringify(this) + JSON.stringify(argVals))
            return(0)
          }
          return(rval);
          
        }
        else if(this.functionname=='if<='){
          if(argVals[0] <= argVals[1]){
            rval=argVals[2];
            if(isNaN(rval)){
              //logger.info(JSON.stringify(this) + JSON.stringify(argVals))
              return(0)
            }
            return(rval)
          }
          else{
            rval=argVals[2];
            if(isNaN(rval)){
              //logger.info(JSON.stringify(this) + JSON.stringify(argVals))
              return(0)
            }
            return(rval);
          }
        }

      }
    }catch(err){
      logger.error(err);
      logger.error(JSON.stringify(this));
    }

  }
  this.printStr=function(depth,full){
    var str='' + this.id + " ";
    for(var i=0;i<depth;i++){
      str+=' ';

    }
    if(this.type=='constant'){
      str+=this.value;
      str+='\n';

    }
    else if(this.type=='variable'){
      str+=this.variablename;
      str+='\n';
    }
    else if(this.type=='function'){
      str+=this.functionname + '\n';
      if(full){

        for(var i=0;i<this.arity;i++){
          var arg=this.arguments[i];
          str+=arg.printStr(depth + 1,true);

        }
      }

    }
    return(str);
  }
  this.toStrArr=function(){
    var str='';// + this.id + " ";
    
    if(this.type=='constant'){
      str+=this.value ;
      str+=',';

    }
    else if(this.type=='variable'){
      str+='"' + this.variablename + '"';
      str+=',';
    }
    else if(this.type=='function'){
      str+='"'+this.functionname + '",';
      if(true){

        for(var i=0;i<this.arity;i++){
          var arg=this.arguments[i];
          str+=arg.toStrArr();// + ',';

        }
      }

    }
    return(str);
  }
}




//returns a node structure by parsing an array of strings

var parsePos=0;
function parseNode(ar){
  var newNode;
  var token=ar[parsePos];
  if(typeof token !== 'undefined'){
    parsePos++;

    if(typeof token=='number'){
      newNode=new node({'type':'constant','value':token}); //constant
    }
    else if(inArray(token,nconf.get('variables'))){     //variable
      newNode=new node({'type':'variable','variablename':token});
    }
    else if(inArray(token,nconf.get('functionSet'))) {

        var arity=2;

      if(token=='if<='){
        arity=4;
      }
      var newNode=new node({'type':'function','functionname':token});

      for(var i=0;i<arity;i++){
        newNode.arguments[i]=parseNode(ar);
      }
    


    }

    return(newNode);
  }


}

function inArray(token,array){

  for(var i=0;i<array.length;i++){
    if(token == array[i])return(true);
  }

  return(false);
}


var testNode=parseNode(nconf.get('rule'));

var val= testNode.eval(nconf.get('observation'));


var predictedProportion=(val - nconf.get('minfofx'))/(nconf.get('maxfofx') -nconf.get('minfofx'));

var predictedChange=nconf.get('minspeeddif') +(predictedProportion *(nconf.get('maxspeeddif') - nconf.get('minspeeddif')));

console.log('val: ' + val + ' predictedProportion: ' + predictedProportion + " predictedChange: " + predictedChange) ;

var predictedSpeed=nconf.get('observation').speed1 + (nconf.get('observation').speed1 * predictedChange);
console.log(JSON.stringify(nconf.get('observation')));
console.log(predictedSpeed);

  


