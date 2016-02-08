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
     "constants":{
     	"nconstants": 100,
     	"min":-10.0,
     	"max":10.0,
     	
     },
     "variables":['speed1','distance1','distance2','distancediff','weight1','weight2','weightdiff','going1','going2','goingdiff'],
     'functionSet':['+','-','*','/','^','if<='],
     'proportions':{			//proportions in which nodes are created: 50/50 functions vs terminals (grow)
     	'functions': 0.5,
     	'variables':0.25,		//50:50 variables vs constants
     	'constants':0.25,
     },
     'populationsize':500,
     'mind':2,
     'maxd':6,
     'crossoverrate':0.9,
     'pointmutationrate':0.05,
     'pointmutationratefunctions':0.9,
     'datafileurl':'/Users/adriangordon/Development/GP/GP/observations.json',
     'nelite':20,
     'ngenerations':100


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
			else if(isFunction){				//only return a function
				if(sn.type=="function"){
					selected=true;
					selectedIndex=i;

				}
			}
			else if(sn.type != 'function'){		//only returna terminal
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
		else if(inArray(token,nconf.get('variables'))){			//variable
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


var rule=["-","-","-","^",-2.2635,8.0547,"*",4.9096,"/","+",-8.7345,"*","distance2","goingdiff","-","if<=","weightdiff",-8.7345,"*",4.9096,"if<=",7.3357,"distancediff",-2.2635,"if<=",-1.4868,"weight2",-2.2635,"-","if<=","weightdiff","^","if<=",-1.4868,"weight2",-2.2635,"*","if<=","-","if<=","weightdiff","speed1","weight2","distance1","*",4.9096,"distancediff","weight2","distance1",7.3357,"distancediff",8.0547,"going1",7.3357,"-","+","if<=","*","+","+","if<=","distance1","/","^","if<=",-1.4868,"-","if<=","+",-1.4868,"weight2","weightdiff","speed1","weight1","^","^","distance1",-2.2635,"^","*","-",-2.7546,"distance1","/",2.5947,8.0547,"*","distance1","goingdiff",-2.2635,"/",2.3792,-3.4093,"speed1","+",-3.1683,"+","/",2.8033,"goingdiff","distance2",4.9096,"weight2","-","if<=","distance1","-","distancediff","*",4.9096,"/","-","^","-","if<=","distance1","going1","distance2","weight2","if<=","^","*","+","distance1","distance1","*","if<=",-0.0999,-2.5417,"goingdiff","distancediff","*","going1",-8.7345,"/","if<=",-1.4868,"weight2",-2.2635,"*","if<=","*",4.9096,"distancediff",-0.0999,"distancediff","distance2",-2.4760,"distance2","*","if<=",-2.2635,"goingdiff","going1","distancediff","*",8.0547,-8.7345,"+","^",-2.7546,-0.7124,"*",-2.2635,"goingdiff","weight2","/","going2","goingdiff","-","+","+","if<=","distance1","-","-","^","if<=",-1.4868,8.0547,-2.2635,"^",-2.2635,8.0547,8.0547,"+","if<=",-5.2669,-6.6087,"going1",-2.6198,"going2","distance2",4.9096,"weight2","-","if<=","distance1",-1.9041,-2.5417,"if<=","^","*","+","goingdiff","distance1","*","if<=",-0.0999,-2.5417,"going1","distancediff","*","going1","distance1","/","going2","goingdiff","*","if<=","distance2","weight2","going1","distancediff","distance2","+","^",-7.9920,8.0547,"distance1","-","-","^",-2.2635,8.0547,"if<=","distance1","going1","speed1","/","*","distance2","goingdiff","-","weight2","*",4.9096,-2.4760,"*",4.9096,"distancediff","if<=","^","*","+",-0.7124,"/","*","distance2","goingdiff","-","if<=","weightdiff","speed1","*","distance1","goingdiff",7.3357,"*","distancediff",-2.4760,"*","if<=",-0.0999,-2.5417,"going1","distancediff","*","going1","going1",-7.9920,"weight2","+","distancediff","*","distance2","goingdiff",-1.4868,-9.2846,"if<=","*",4.9096,"distancediff","distance1","distance1",-2.2635,"-","if<=","weightdiff","speed1","weight2",7.3357,"*",4.9096,-2.4760,-2.5417,"weight2","distance1",-9.2846,"distancediff","*",4.9096,"distance1","distancediff","distance2",-0.7124,"distance1","*",4.9096,-2.4760,"*","distancediff",-2.7546,"*",4.9096,"distancediff","*","distance1","goingdiff"];
//var observation={"speed1":15.67431823011357,"speed2":14.66318489158312,"datediff":226,"going1":0,"going2":-2,"goingdiff":-2,"distance1":1207.008,"distance2":2830.0679999999998,"distancediff":1623.0599999999997,"weight1":126,"weight2":115,"weightdiff":-11,"_id":"5682b5d9daeeac24032e55ef"}
//var observation={"speed1":15.67431823011357,"speed2":14.377086851272361,"datediff":257,"going1":0,"going2":1,"goingdiff":1,"distance1":1207.008,"distance2":2435.0472,"distancediff":1228.0392,"weight1":126,"weight2":187,"weightdiff":61,"_id":"5682b5d9daeeac24032e55f0"}
var observation={"speed1":14.545770065075924,"speed2":15.314316462081718,"datediff":10,"going1":1,"going2":-1,"goingdiff":-2,"distance1":2011.68,"distance2":2276.8559999999998,"distancediff":265.1759999999997,"weight1":124,"weight2":130,"weightdiff":6,"_id":"5682b5d9daeeac24032e5606"}

var testNode=parseNode(rule);


//console.log(testNode.toStrArr());

var val=testNode.eval(observation);
var s1=observation.speed1;
var predicted= s1 + ((s1*val)/100000);
console.log('predicted: ' +predicted);







