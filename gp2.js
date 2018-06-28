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

var goingMappings={"Firm":-3,"Good To Firm":-2,"Standard":-1,"Good":-1,"Good To Soft":0,"Good To Yielding":-1,"Standard To Slow":0,"Yielding":1,"Yielding To Soft":1,"Soft":1,"Soft To Heavy":2,"Heavy":3}


// "variables":['speed1','distance1','distance2','distancediff','weight1','weight2','weightdiff','going1','going2','goingdiff','type1','type2','typediff'],

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
     	"nconstants": 1000,
     	"min":-10.0,
     	"max":10.0,
     	
     },
     "variables":['speed1','distance1','distance2','distancediff',"going1","going2","goingdiff","weight1","weight2","weightdiff"],
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
     'datafileurl':'/Users/adriangordon/Development/GP/GP/flatobservations.json',
     'nelite':20,
     'ngenerations':100,
     "gpnodepath":"../Node/GPNode",
     "sanitycheck":{
     	"going":[
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":1,"going2":-1,"goingdiff":-2,"distance1":1609.344,"distance2":1609.344,"distancediff":0,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":">"		//speed2 should be faster than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":2,"going2":-2,"goingdiff":-4,"distance1":1609.344,"distance2":1609.344,"distancediff":0,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":">"		//speed2 should be faster than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":3,"going2":-3,"goingdiff":-6,"distance1":1609.344,"distance2":1609.344,"distancediff":0,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":">"		//speed2 should be faster than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":1,"goingdiff":2,"distance1":1609.344,"distance2":1609.344,"distancediff":0,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":"<"		//speed2 should be slower than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-2,"going2":2,"goingdiff":4,"distance1":1609.344,"distance2":1609.344,"distancediff":0,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":"<"		//speed2 should be slower than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-3,"going2":3,"goingdiff":6,"distance1":1609.344,"distance2":1609.344,"distancediff":0,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":"<"		//speed2 should be slower than speed 1
	     	}
     	],
     	"distance":[
	     	//DISTANCE
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1750,"distance2":1000,"distancediff":-750,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":">"		//speed2 should be faster than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1750,"distance2":1500,"distancediff":-250,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":">"		//speed2 should be faster than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1750,"distance2":2000,"distancediff":250,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":"<"		//speed2 should be slower than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1750,"distance2":2500,"distancediff":750,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":"<"		//speed2 should be slower than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1750,"distance2":3000,"distancediff":1250,"weight1":121,"weight2":121,"weightdiff":0,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":"<"		//speed2 should be slower than speed 1
	     	}
     	],
     	"weight":[
	     	//DISTANCE
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1750,"distance2":1750,"distancediff":0,"weight1":130,"weight2":100,"weightdiff":-30,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":">"		//speed2 should be faster than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1750,"distance2":1750,"distancediff":0,"weight1":130,"weight2":120,"weightdiff":-10,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":">"		//speed2 should be faster than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1750,"distance2":1750,"distancediff":0,"weight1":130,"weight2":140,"weightdiff":10,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":"<"		//speed2 should be slower than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1750,"distance2":1750,"distancediff":0,"weight1":130,"weight2":160,"weightdiff":30,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":"<"		//speed2 should be slower than speed 1
	     	},
	     	{"observation":{"speed1":15.340234486702888,"speed2":16.084249000571102,"datediff":475,"going1":-1,"going2":-1,"goingdiff":0,"distance1":1750,"distance2":1750,"distancediff":0,"weight1":130,"weight2":180,"weightdiff":50,"_id":"56d964ef9c96d60c22fbf32a"},
	     	 "rel":"<"		//speed2 should be slower than speed 1
	     	}
     	]

     }

     


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

//end logging config

var gpnode=require(nconf.get("gpnodepath"));

var population;
var observations;


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




function generateNode(depth,strategy){

	var f=nconf.get('proportions').functions;

	var c=nconf.get('proportions').constants;

	var v=nconf.get('proportions').variables;



	if(depth==0){ //randomly generate a terminal
			var r=Math.random();

			if(r > (c /(c + v))){
				//generate a constant

				var rc=cSet[Math.floor(Math.random() * cSet.length)];

				var newNode = new gpnode({'type':'constant','value': rc});
				return(newNode);
			}
			else{
				//generate a variable
				var va=nconf.get('variables');
				var rv=va[Math.floor(Math.random() * va.length)];
				var newNode=new gpnode({'type':'variable','variablename': rv});
				return(newNode);
			}

	}
	else{
		var r=Math.random();
		//logger.info("r: " + r + "f: " + f + " c: " + c + "v: " + v);

		if(strategy=='grow'){ //select terminal or function
			if(r>((c+f)/(c+f+v))){//generate a variable
				var va=nconf.get('variables');
				var rv=va[Math.floor(Math.random() * va.length)];
				var newNode=new gpnode({'type':'variable','variablename': rv});
				return(newNode);
			}
			else if(r>(c/(c+f+v))){//generate a constant
				var rc=cSet[Math.floor(Math.random() * cSet.length)];

				var newNode = new gpnode({'type':'constant','value': rc});
				return(newNode);
			}
			else{				//generate a function
				//var fa=nconf.get('functionSet');
				//var rf=fa[Math.floor(Math.random() * fa.length)];

				//var newNode=new node({'type':'function','functionname':rf});
				//return(newNode);
				return(generateFunctionNode(depth,strategy));

			}

		}
		else if(strategy=='full'){ //generate a function
			//var fa=nconf.get('functionSet');
			//var rf=fa[Math.floor(Math.random() * fa.length)];

			//var newNode=new node({'type':'function','functionname':rf});

			//return(newNode);
			return(generateFunctionNode(depth,strategy))
		}
	}



}

function generateFunctionNode(depth, strategy){
	var fa=nconf.get('functionSet');
	var rf=fa[Math.floor(Math.random() * fa.length)];

	var newNode=new gpnode({'type':'function','functionname':rf});

	var arity=newNode.arity;

	for(var i=0;i<arity;i++){
		if((newNode.functionname=="if<=") && (i==0)){	//always choose a variable as first argument for if<=
			var va=nconf.get('variables');
			var rv=va[Math.floor(Math.random() * va.length)];
			var varNode=new gpnode({'type':'variable','variablename': rv});
			newNode.arguments[i]=varNode;
		}
		else{
			newNode.arguments[i]=generateNode(depth -1,strategy);
		}
	}
		

	return(newNode);


}




function crossover(node1,node2,index1,index2){
	//logger.info("parent1: \n" + node1.printStr(0,true));
	//logger.info("parent2: \n" + node2.printStr(0,true));
	//logger.info("index1: " + index1 + " index2: " + index2);

	node1Copy=node1.copy();
	node2Copy=node2.copy();

	node1Arr=node1Copy.toArray();
	node2Arr=node2Copy.toArray();

	var toReplace=node1Arr[index1];
	var replacement=node2Arr[index2];

	//logger.info("toReplace: \n" + toReplace.printStr(0,true));
	//logger.info("replacement: \n" + replacement.printStr(0,true));

	crossoverReplace(node1Copy,toReplace,replacement);

	return(node1Copy);



}

function crossoverReplace(node,replace,replacement){
	//logger.info("crossoveReplace: " + node.id);

	if(node.type=='function'){
		//logger.info(node.id + " arguments: " + node.arguments);

		for(var i=0;i<node.arguments.length;i++){

			var arg=node.arguments[i];
			//logger.info("crossoveReplace,check : " + arg.id);
			if(arg.id===replace.id){
				node.arguments[i]=replacement;
				//logger.info("found it");
				break;
			}
			else if(arg.type=='function'){
				//logger.info("go call cr: " + arg.id);
				crossoverReplace(arg,replace,replacement);
			}
		}
	}
	return(node);

}

function pointMutate(node){

	if(node.type=='function'){
		var fa=nconf.get('functionSet');
		var functionname=node.functionname;
		if(functionname !='if<='){
			var done=false;
			
			while(!done){
				rf=fa[Math.floor(Math.random() * fa.length)];
				if((rf !== functionname)&&(rf !== 'if<=')){
					done=true;
					node.functionname=rf;
				}

			}
		}
		 
	}
	else if(node.type=='constant'){
		var rc;
		var done=false;
		while(!done){
			rc=cSet[Math.floor(Math.random() * cSet.length)];
			if(rc != node.value){
				done=true;
				node.value=rc;
			}

		}


	}
	else if(node.type=='variable'){

		var va=nconf.get('variables');
		var done=false;

		while(!done){

			var rv=va[Math.floor(Math.random() * va.length)];
			if(rv != node.variablename){
				done=true;
				node.variablename=rv;
			}
		}

	}
	return(node);
}

function subtreeMutate(node1,index,depth){

	//generate a random program

	var node2=generateNode(depth,'full');

	return(crossover(node1,node2,index,0));
	


}
//Ramped half and half
function generatePopulation(size){
	var count=0;
	var mind=nconf.get('mind');
	var maxd=nconf.get('maxd');
	var diff=maxd-mind;
	var incrEvery=size/diff;
	var incrCounter=0;
	var depth=mind;
	var strategy='full';
	population = new Array(size)
	while(count < size){
		
		var node;
		if(strategy=='grow'){
			node=generateFunctionNode(depth,'grow'); //prevent nodes which are just one terminal -first term must be a function
		}
		else{
			node=generateNode(depth,strategy);
		}

		var obj={
			rule:node,
			stats:{
				cumulativeError:0,
				nobservations:0,
				fitness:Number.MAX_VALUE
			}
		}
		//logger.info(strategy + " " + depth + ": " + obj.rule.toStrArr());
		//var pass=sanityCheck(obj);
		//logger.info("pass: " + pass);
		//if(pass){
		if(true){
			incrCounter++;
			if(incrCounter>incrEvery){
				incrCounter=0;
				depth++;
				//logger.info(i + ' depth: ' + depth);
			};
			//logger.info(JSON.stringify(obj));
			population[count++]=obj;
			//console.log(count + " (" + depth + ")");
			if(strategy=='full')
				strategy='grow';
			else strategy='full';
		}
		
		

		

	}
	//logger.info(JSON.stringify(population));

}

function sanityCheck(pm){
	var pass=true;
	var rule=pm.rule;
	if(typeof rule.stats == 'undefined'){
		rule.stats={
			cumulativeError:0,
			nobservations:0,
			fitness:Number.MAX_VALUE
		}
	}
	else{
		rule.stats.cumulativeError=0;
		rule.stats.nobservations=0;
		rule.stats.fitness=Number.MAX_VALUE
	}

	//Once through, to get min and max values of the function
	var min=0.0;
	var max=0.0;
	for(var i=0;i<observations.length;i++){
		var obs=observations[i];
		if(obs.speed1!== null && obs.speed2 !== null){
	
		//for(var i=0;i<1000;i++){
			obs.val=rule.eval(obs);
			//console.log(JSON.stringify(obs));
			if(obs.val > max)max=obs.val;
			if(obs.val < min)min=obs.val;
		}

	}
	//logger.info('rule min: ' + min);
	//logger.info('rule max: ' + max);

	rule.minfofx=min;
	rule.maxfofx=max;

	//logger.info(JSON.stringify(rule));

	//which sanity Checks to perform?

	var distanceSt=false;
	var goingSt=false;
	var weightSt=false;

	var strArr= new Array();
	rule.toArrStr(strArr);
	//logger.info('stArr: ' + strArr);

	for (var i=0;i<strArr.length;i++){
		var s=strArr[i];
		//logger.info("s: " + s);
		if (s.indexOf("distance")!=-1){
			distanceSt=true;
			break;
		}
	}

	for (var i=0;i<strArr.length;i++){
		var s=strArr[i];
		//logger.info("s: " + s);
		if (s.indexOf("going")!=-1){
			goingSt=true;
			break;
		}
	}

	for (var i=0;i<strArr.length;i++){
		var s=strArr[i];
		//logger.info("s: " + s);
		if (s.indexOf("weight")!=-1){
			weightSt=true;
			break;
		}
	}

	//logger.info(strArr + " " + distanceSt);


	//if necessary, iterate over distance Sanitycheck observations

	var sanityChecks=nconf.get('sanitycheck').distance;

	//logger.info("Rule: " + rule.toStrArr());
	if(distanceSt){
		for(var i=0;i<sanityChecks.length;i++){
			//logger.info("sanity check number: " + i);
			var sanityCheck=sanityChecks[i];
			var scObservation=sanityCheck.observation;
			var scRel=sanityCheck.rel;
			if(scObservation.speed1!== null && scObservation.speed2 !== null){
				//logger.info("EVAL: rule" + JSON.stringify(rule) );
				//logger.info("EVAL: obs" + JSON.stringify(scObservation));
				scObservation.val=rule.eval(scObservation);
				//logger.info("val = " + scObservation.val);
				scObservation.val=rule.eval(scObservation);
				scObservation.predictedProportion=(scObservation.val -rule.minfofx)/(rule.maxfofx -rule.minfofx);
				scObservation.predictedChange=observationsStats.minSpeedDif.dif +(scObservation.predictedProportion *(observationsStats.maxSpeedDif.dif - observationsStats.minSpeedDif.dif));
				//logger.info("rel: " + scRel + " predictedChange: " + scObservation.predictedChange);
				//scObservation.actualChange=((scObservation.speed2 - scObservation.speed1)/scObservation.speed1);
				//obs.absError=Math.abs(obs.actualChange - obs.predictedChange);
				//console.log(JSON.stringify(obs));
				//pm.stats.cumulativeError=pm.stats.cumulativeError + obs.absError;
				//pm.stats.nobservations=pm.stats.nobservations+1;
				//logger.info(JSON.stringify(scObservation));
				
				if(scRel=='>'){
					if(scObservation.predictedChange >= 0){
						//pass=true;
					}
					else{
						pass=false;
						break;
						//return(pass);
					}

				}
				else if(scRel=='<'){
					if(scObservation.predictedChange <=0){
						//pass=true;
					}
					else{
						pass=false;
						break;
					}

				}
				
			}
			//process.exit(1);

		}
	}
	sanityChecks=nconf.get('sanitycheck').going;
	if(pass && goingSt){
		for(var i=0;i<sanityChecks.length;i++){
			//logger.info("sanity check number: " + i);
			var sanityCheck=sanityChecks[i];
			var scObservation=sanityCheck.observation;
			var scRel=sanityCheck.rel;
			if(scObservation.speed1!== null && scObservation.speed2 !== null){
				//logger.info("EVAL: rule" + JSON.stringify(rule) );
				//logger.info("EVAL: obs" + JSON.stringify(scObservation));
				scObservation.val=rule.eval(scObservation);
				//logger.info("val = " + scObservation.val);
				scObservation.val=rule.eval(scObservation);
				scObservation.predictedProportion=(scObservation.val -rule.minfofx)/(rule.maxfofx -rule.minfofx);
				scObservation.predictedChange=observationsStats.minSpeedDif.dif +(scObservation.predictedProportion *(observationsStats.maxSpeedDif.dif - observationsStats.minSpeedDif.dif));
				//logger.info("rel: " + scRel + " predictedChange: " + scObservation.predictedChange);
				//scObservation.actualChange=((scObservation.speed2 - scObservation.speed1)/scObservation.speed1);
				//obs.absError=Math.abs(obs.actualChange - obs.predictedChange);
				//console.log(JSON.stringify(obs));
				//pm.stats.cumulativeError=pm.stats.cumulativeError + obs.absError;
				//pm.stats.nobservations=pm.stats.nobservations+1;
				//logger.info(JSON.stringify(scObservation));
				
				if(scRel=='>'){
					if(scObservation.predictedChange >= 0){
						//pass=true;
					}
					else{
						pass=false;
						break;
						//return(pass);
					}

				}
				else if(scRel=='<'){
					if(scObservation.predictedChange <=0){
						//pass=true;
					}
					else{
						pass=false;
						break;
					}

				}
				
			}
			//process.exit(1);

		}
	}
	sanityChecks=nconf.get('sanitycheck').weight;
	if(pass && weightSt){
		for(var i=0;i<sanityChecks.length;i++){
			//logger.info("sanity check number: " + i);
			var sanityCheck=sanityChecks[i];
			var scObservation=sanityCheck.observation;
			var scRel=sanityCheck.rel;
			if(scObservation.weight1!== null && scObservation.weight2 !== null){
				//logger.info("EVAL: rule" + JSON.stringify(rule) );
				//logger.info("EVAL: obs" + JSON.stringify(scObservation));
				scObservation.val=rule.eval(scObservation);
				//logger.info("val = " + scObservation.val);
				scObservation.val=rule.eval(scObservation);
				scObservation.predictedProportion=(scObservation.val -rule.minfofx)/(rule.maxfofx -rule.minfofx);
				scObservation.predictedChange=observationsStats.minSpeedDif.dif +(scObservation.predictedProportion *(observationsStats.maxSpeedDif.dif - observationsStats.minSpeedDif.dif));
				//logger.info("rel: " + scRel + " predictedChange: " + scObservation.predictedChange);
				//scObservation.actualChange=((scObservation.speed2 - scObservation.speed1)/scObservation.speed1);
				//obs.absError=Math.abs(obs.actualChange - obs.predictedChange);
				//console.log(JSON.stringify(obs));
				//pm.stats.cumulativeError=pm.stats.cumulativeError + obs.absError;
				//pm.stats.nobservations=pm.stats.nobservations+1;
				//logger.info(JSON.stringify(scObservation));
				
				if(scRel=='>'){
					if(scObservation.predictedChange >= 0){
						//pass=true;
					}
					else{
						pass=false;
						break;
						//return(pass);
					}

				}
				else if(scRel=='<'){
					if(scObservation.predictedChange <=0){
						//pass=true;
					}
					else{
						pass=false;
						break;
					}

				}
				
			}
			//process.exit(1);

		}
	}

	//if(pass)logger.info(rule.toStrArr() + " distanceSt: " + distanceSt +  " goingSt: " + goingSt +  " weightSt: " + weightSt +  " pass: " + pass);

	return(pass);


}

function evaluatePopulation(all){
	//console.log("\n");
	var start;
	if(all){
		start=0;
	}
	else {
		start=nconf.get('nelite');
	}
	for(var i=start;i<population.length;i++){
	
	//for(var i=0;i<1;i++){
			//console.log(i + " ");
			process.stdout.write(".");
			var populationMember=population[i];
			if(typeof populationMember == 'undefined'){
				logger.info("i: " + i + " " + JSON.stringify(population));
			}
			evaluatePopulationMember(populationMember);
	}
	console.log("");
	//logger.info(JSON.stringify(population));
	

}


function evaluatePopulationMember(pm){
	var rule=pm.rule;
	if(typeof rule.stats == 'undefined'){
		rule.stats={
			cumulativeError:0,
			nobservations:0,
			fitness:Number.MAX_VALUE
		}
	}
	else{
		rule.stats.cumulativeError=0;
		rule.stats.nobservations=0;
		rule.stats.fitness=Number.MAX_VALUE
	}

	//Once through, to get min and max values of the function
	var min=0.0;
	var max=0.0;
	for(var i=0;i<observations.length;i++){
		var obs=observations[i];
		if(obs.speed1!== null && obs.speed2 !== null){
	
		//for(var i=0;i<1000;i++){
		
			obs.val=rule.eval(obs);
			//console.log(JSON.stringify(obs));
			if(obs.val > max)max=obs.val;
			if(obs.val < min)min=obs.val;
		}

	}
	//logger.info('rule min: ' + min);
	//logger.info('rule max: ' + max);

	rule.minfofx=min;
	rule.maxfofx=max;

	//Sanity check here, set fitness to zero if fail, and don't test against observations

	for(var i=0;i<observations.length;i++){
	//	for(var i=0;i<10;i++){
		var obs=observations[i];
		if(obs.speed1!== null && obs.speed2 !== null){
			
			obs.predictedProportion=(obs.val -rule.minfofx)/(rule.maxfofx -rule.minfofx);
			obs.predictedChange=observationsStats.minSpeedDif.dif +(obs.predictedProportion *(observationsStats.maxSpeedDif.dif - observationsStats.minSpeedDif.dif));
			obs.actualChange=((obs.speed2 - obs.speed1)/obs.speed1);
			obs.absError=Math.abs(obs.actualChange - obs.predictedChange);
			//console.log(JSON.stringify(obs));
			pm.stats.cumulativeError=pm.stats.cumulativeError + obs.absError;
			pm.stats.nobservations=pm.stats.nobservations+1;
		}
	}
	pm.stats.fitness=pm.stats.cumulativeError/pm.stats.nobservations;
	//logger.info("Fitness: " + pm.stats.fitness);
	if(pm.stats.fitness==Infinity){
		//logger.info("FITNESS INFINITY");
		pm.stats.fitness=Number.MAX_VALUE;
	}
	if(pm.stats.fitness==null){
		//logger.info("FITNESS NULL");
		pm.stats.fitness=Number.MAX_VALUE;
	}
	if( isNaN(pm.stats.fitness)){
		//logger.info("FITNESS NAN");
		pm.stats.fitness=Number.MAX_VALUE;
	}




}


function sortPopulation(){
	population.sort(function(a,b){
		if(a.stats.fitness < b.stats.fitness)return(-1);
		else if(a.stats.fitness > b.stats.fitness)return(1);
		else return(0);
	})
}

function tournament(){

	var index1=Math.floor(Math.random() * population.length);
	var index2=Math.floor(Math.random() * population.length);

	var node1=population[index1];
	var node2=population[index2];

	//logger.info("node1: " + JSON.stringify(node1));
	//logger.info("node2: " + JSON.stringify(node2));

	//logger.info(node1.rule.toStrArr() + " node1 stats: " + JSON.stringify(node1.stats));
	//logger.info(node1.rule.toStrArr() +"node2 stats: " + JSON.stringify(node2.stats));

	if(node1.stats.fitness < node2.stats.fitness){
		//logger.info("node 1 wins")
		return(node1);
	}
	else{
		//logger.info("node 2 wins")
		return(node2)
	}


}

function evolve(){
	for(var generation=0;generation < nconf.get('ngenerations');generation++){

	//for(var generation=0;generation < 1;generation++){
		logger.info("GENERATION: " + generation);
		//logger.info(population[0].rule.toStrArr() + " " + JSON.stringify(population[0].stats));
		var newPopulation = new Array(nconf.get('populationsize'));

		//copy elite rules
		for(var i=0;i<nconf.get('nelite');i++){
			newPopulation[i]=population[i];
			//logger.info('elite ' + i);

		}

		for(var i=nconf.get('nelite');i<nconf.get('populationsize');i++){
			//logger.info('other ' + i);

			//do we do crossover?
			if(Math.random() < nconf.get('crossoverrate')){ //crossover
				var parent1=tournament();
				//logger.info("parent1:\n " + parent1.rule.printStr(0,true));

				var parent2=tournament();
				//logger.info("parent2:\n " + parent2.rule.printStr(0,true));

				var index1=parent1.rule.selectIndex();
				var index2=parent2.rule.selectIndex();
				//logger.info('index1: ' + index1 + " index2: " + index2);

				var offspring=crossover(parent1.rule,parent2.rule,index1,index2);

				var newPopMember={
					rule:offspring,
					stats:{
						cumulativeError:0,
						nobservations:0,
						fitness:Number.MAX_VALUE
					}
				}

				newPopulation[i]=newPopMember;

				//logger.info("offspring:\n " + offspring.printStr(0,true));


			}
			else{		//mutate
				var tournamentWinner=tournament();
				//console.log("Tournament Winner: " + tournamentWinner.rule.toStrArr());
				var crossoverMutateIndex=tournamentWinner.rule.selectIndex();
				//console.log("crossoverMutateIndex: " + crossoverMutateIndex);
				var cmDepth=nconf.get('mind') +Math.floor(Math.random() * (nconf.get('maxd')-nconf.get('mind')));
				//console.log("cmdepth: " + cmDepth);
				var mutated=subtreeMutate(tournamentWinner.rule,crossoverMutateIndex,cmDepth);
				//console.log("Tournament Winner mutated: " + mutated.toStrArr());
				var mutatedArray=mutated.toArray();
				//console.log(mutatedArray);
				for(var j=0;j<mutatedArray.length;j++){

					var nodeToMutate=mutatedArray[j];
					var rnd=Math.random();
					//console.log("rnd: "+ rnd)
					if(rnd > nconf.get('pointmutationrate')){
						//logger.info(i + 'point mutate it');
						pointMutate(nodeToMutate)
					}
					else{
						//logger.info(i + 'do not point mutate it');
					}
				}
				var newPopMember={
					rule:mutated,
					stats:{
						cumulativeError:0,
						nobservations:0,
						fitness:Number.MAX_VALUE
					}
				}

				newPopulation[i]=newPopMember;

			}

		}
		//logger.info('done with the pop')

		population=newPopulation;
		evaluatePopulation(false);
		sortPopulation();
		logger.info(population[0].rule.toStrArr() + " " + JSON.stringify(population[0].stats));


	}

}

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






//var nConstants=100;
var cSet=new Array(nconf.get('constants').nconstants);


for(var i=0;i<nconf.get('constants').nconstants;i++){
	cSet[i]=(Math.random()*(nconf.get('constants').max - nconf.get('constants').min) + nconf.get('constants').min).toFixed(4);
	//console.log(cSet[i] + " ");
}
/*
var obs1={
    "speed1" : 15.67431823011357,
    "speed2" : 15.79735247924613,
    "datediff" : 30,
    "going1" : 0,
    "going2" : -1,
    "goingdiff" : -1,
    "distance1" : 1207.008,
    "distance2" : 1408.176,
    "distancediff" : 201.1679999999999,
    "weight1" : 126,
    "weight2" : 131,
    "weightdiff" : 5,
}

var obs2={
    "speed1" : 15.67431823011357,
    "speed2" : 14.66318489158312,
    "datediff" : 226,
    "going1" : 0,
    "going2" : -2,
    "goingdiff" : -2,
    "distance1" : 1207.008,
    "distance2" : 2830.068,
    "distancediff" : 1623.06,
    "weight1" : 126,
    "weight2" : 115,
    "weightdiff" : -11,
   
}



observations=[obs1,obs2];

*/

//logger.info("go get observations");
observations= JSON.parse(fs.readFileSync(nconf.get('datafileurl'), 'utf8'));
getObservationsStats();
logger.info("observationStats: " +JSON.stringify(observationsStats));
/*
var rule=["*",-1.0,"goingdiff"];
var testNode=new gpnode().parseNode(rule,nconf.get('variables'),nconf.get('functionSet'));
var populationMember={
			rule:testNode,
			stats:{
				cumulativeError:0,
				nobservations:0,
				fitness:Number.MAX_VALUE
			}
		}
logger.info(JSON.stringify(populationMember));
var pass=sanityCheck(populationMember);
logger.info("PASS: " + pass);
*/

generatePopulation(nconf.get('populationsize'));
//generatePopulation(1);


evaluatePopulation(true);//evaluate all

sortPopulation();
logger.info(population[0].rule.toStrArr() + " " + JSON.stringify(population[0].stats));

evolve();







