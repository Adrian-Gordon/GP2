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

//end logging config

var population;
var observations;
var nodeid=0;

//type:function|variable|constant
//name: if type==function: +,-,*,/,^,if<=, if type==variablename
//value: numeric value of this constant

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

function generateNode(depth,strategy){

	var f=nconf.get('proportions').functions;

	var c=nconf.get('proportions').constants;

	var v=nconf.get('proportions').variables;



	if(depth==0){ //randomly generate a terminal
			var r=Math.random();

			if(r > (c /(c + v))){
				//generate a constant

				var rc=cSet[Math.floor(Math.random() * cSet.length)];

				var newNode = new node({'type':'constant','value': rc});
				return(newNode);
			}
			else{
				//generate a variable
				var va=nconf.get('variables');
				var rv=va[Math.floor(Math.random() * va.length)];
				var newNode=new node({'type':'variable','variablename': rv});
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
				var newNode=new node({'type':'variable','variablename': rv});
				return(newNode);
			}
			else if(r>(c/(c+f+v))){//generate a constant
				var rc=cSet[Math.floor(Math.random() * cSet.length)];

				var newNode = new node({'type':'constant','value': rc});
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

	var newNode=new node({'type':'function','functionname':rf});

	var arity=newNode.arity;

	for(var i=0;i<arity;i++){
		newNode.arguments[i]=generateNode(depth -1,strategy);
	}

	return(newNode);


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
	var mind=nconf.get('mind');
	var maxd=nconf.get('maxd');
	var diff=maxd-mind;
	var incrEvery=size/diff;
	var incrCounter=0;
	var depth=mind;
	var strategy='full';
	population = new Array(size)
	for(var i=0;i<size;i++){
		incrCounter++;
		if(incrCounter>incrEvery){
			incrCounter=0;
			depth++;
			//logger.info(i + ' depth: ' + depth);
		};
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
				fitness:0
			}
		}
		//logger.info(strategy + " " + depth + ": " + obj.rule.toStrArr());
		population[i]=obj;
		if(strategy=='full')
			strategy='grow'
		else strategy='full'

	}

}

function evaluatePopulation(){
	for(var i=0;i<population.length;i++){
		var populationMember=population[i];
		if(typeof populationMember == 'undefined'){
			logger.info("i: " + i + " " + JSON.stringify(population));
		}
		evaluatePopulationMember(populationMember);
	}
	//logger.info(JSON.stringify(population));

}

function evaluatePopulationMember(pm){
	var rule=pm.rule;

	for(var i=0;i<observations.length;i++){
		var obs=observations[i];

		var err=rule.getAbsError(obs);
		pm.stats.cumulativeError=pm.stats.cumulativeError + err;
		pm.stats.nobservations=pm.stats.nobservations+1;
	}

	pm.stats.fitness=pm.stats.cumulativeError/pm.stats.nobservations;
	if(pm.stats.fitness==null)pm.stats.fitness=Number.MAX_VALUE;

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
						fitness:0
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
						fitness:0
					}
				}

				newPopulation[i]=newPopMember;

			}

		}
		//logger.info('done with the pop')

		population=newPopulation;
		evaluatePopulation();
		sortPopulation();
		logger.info(population[0].rule.toStrArr() + " " + JSON.stringify(population[0].stats));


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

observations= JSON.parse(fs.readFileSync(nconf.get('datafileurl'), 'utf8'));

generatePopulation(nconf.get('populationsize'));
evaluatePopulation();
sortPopulation();

evolve();


//for(var i=0;i<population.length;i++)
//	logger.info(JSON.stringify(population[i].stats));

/*
console.log(population[0].rule.toStrArr() + " " + JSON.stringify(population[0].stats));

var parent1=tournament();
logger.info("parent1:\n " + parent1.rule.printStr(0,true));

var parent2=tournament();
logger.info("parent2:\n " + parent2.rule.printStr(0,true));

var index1=parent1.rule.selectIndex();
var index2=parent2.rule.selectIndex();
logger.info('index1: ' + index1 + " index2: " + index2);

var offspring=crossover(parent1.rule,parent2.rule,index1,index2);

logger.info("offspring:\n " + offspring.printStr(0,true));

*/




/*
var tournamentWinner=tournament();
console.log("Tournament Winner: " + tournamentWinner.rule.toStrArr());
var crossoverMutateIndex=tournamentWinner.rule.selectIndex();
console.log("crossoverMutateIndex: " + crossoverMutateIndex);
var cmDepth=nconf.get('mind') +Math.floor(Math.random() * (nconf.get('maxd')-nconf.get('mind')));
console.log("cmdepth: " + cmDepth);
var mutated=subtreeMutate(tournamentWinner.rule,crossoverMutateIndex,cmDepth);
console.log("Tournament Winner mutated: " + mutated.toStrArr());
var mutatedArray=mutated.toArray();
console.log(mutatedArray);
for(var i=0;i<mutatedArray.length;i++){

	var nodeToMutate=mutatedArray[i];
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

console.log("Tournament Winner point mutated: " + mutated.toStrArr());*/







/*
//TEST HERE
var  rule1=["*","+","/","goingdiff","weightdiff","^",-4.7995,4.3063,"if<=","^",-6.0770, "weight1","*","weight2",-5.7391,"/","distancediff","speed1","+","weight2",4.1091];
var n1=parseNode(rule1);

var obs1={"speed1":14.906854390515006,"speed2":16.172686162194754,"datediff":21,"going1":1,"going2":-1,"goingdiff":-2,"distance1":1609.344,"distance2":1609.344,"distancediff":0,"weight1":133,"weight2":133,"weightdiff":0,"_id":"5682b5dadaeeac24032e5986"}

logger.info("evals to: " + n1.eval(obs1));
*/






//logger.info("evals to: " + n1.eval(obs2));
/*var thisNode = generateNode(3,'full');

var copy=thisNode.copy();

var ar=copy.toArray();

var selectedIndex1=copy.selectIndex(true);
var selectedIndex2=copy.selectIndex(false);
*/



//logger.info("node: " + JSON.stringify(thisNode));
/*logger.info("node: \n" + thisNode.printStr(0));

logger.info("copy: \n" + copy.printStr(0));

logger.info("copy toArray(): " +  ar);

logger.info("selectedIndex1 " + selectedIndex1);

logger.info("selected function:\n " + ar[selectedIndex1].printStr(0));

logger.info("selectedIndex2 " + selectedIndex2);
logger.info("selected terminal:\n " + ar[selectedIndex2].printStr(0));
*/

/*var parent1=generateNode(3,'full');



var parent2=generateNode(3,'full');



var index1=parent1.selectIndex(true); //function

var index2=parent2.selectIndex(false);//terminal

var offspring=crossover(parent1,parent2,index1,index2);

logger.info("offspring:\n " + offspring.printStr(0,true));*/






/*
var rule1=[
	'if<=',
		'goingdiff',
		0,
		'*',
			'speed1',
			2.0,
		'/',
			'speed1',
			3.0

]
*/



//logger.info("error node1: " + node1.getAbsError(obs1));


/* parsePos=0;
//var parent1=parseNode(["if<=",-7.0755,"distancedif","speed","distancedif"]);

var parent1=parseNode(rule1);

logger.info("parent1:\n" + parent1.printStr(0,true));

parsePos=0;

var parent2=parseNode(rule2);

logger.info("parent2:\n" + parent2.printStr(0,true));

//var offspring=crossover(parent1,parent2,10,0);
//var offspring=pointMutate(parent1.arguments[0].arguments[0].arguments[1]);

var mutated=subtreeMutate(parent1,1,4);

logger.info("mutated:\n" + mutated.printStr(0,true));

*/

/*parent1 index 17
if<=
 -
  if<=
   -7.0755
   distancedif
   speed
   distancedif
  -
   -5.5980
   weightdif
 ^
  /
   goingdif
   distancedif
  ^
   -2.2314
   2.1337
 ^
  /
   weight
   0.8634
  ^
   weightdif
   9.4572
 +
  ^
   weight
   8.5429
  -
   distancedif
   8.8923


parent2: index 13
+
 -
  +
   distancedif
   distance
  -
   speed
   9.4747
 -
  if<=
   0.8850
   -6.2010
   -0.1258
   distance
  /
   4.0559
   distancedif



*/

/*
var pln13=new node({'type':'variable','variablename':'weightdif'})
var pln12=new node({'type':'constant','value':-5.5980});
var pln7=new node({'type':'function','functionname':'-',arguments:[p1n12,p1n13]});

var pln11=new node({'type':'variable','variablename':'distancedif'})
var pln10=new node({'type':'variable','variablename':'speed'});
var pln9=new node({'type':'variable','variablename':'distancedif'});
var pln8=new node({'type':'constant','value':-7.0755});

var p1n6=new node({'type':'function','functionname': 'if<=','arguments':[p1n8,p1n9,p1n10,p1n11]});

var p1n2=new node({'type':'function','functionname':'-',arguments:[p1n6,p1n7]});

var p1n1=new node({'type':'function','functionname': 'if<=','arguments':[p1n2,p1n3,p1n4,p1n5]})





var p1n1=new node({'type':'constant','value':8.8923});
var p1n2=new node({'type':'variable','variablename':'distancedif'});
var p1n3=new node({'type':'function','functionname': '-','arguments':[p1n2,p1n1]}); //- distancedif 8.8923

var p1n4=new node({'type':'constant','value':8.5429});
var p1n5=new node({'type':'variable','variablename':'weight'});
var p1n6=new node({'type':'function','functionname': '^','arguments':[p1n5,p1n4]}); //^ weight 8.8923 8.5429

var p1n7=new node({'type':'function','functionname': '+','arguments':[p1n6,p1n3]});

var p1n8=new node({'type':'constant','value':0.8634});
var p1n9=new node({'type':'variable','variablename':'weight'});
var p1n10=new node({'type':'function','functionname': '/','arguments':[p1n9,p1n8]});// /weight 0.8634

var p1n11=new node({'type':'constant','value':9.4572});
var p1n12=new node({'type':'variable','variablename':'weightdif'});
var p1n13=new node({'type':'function','functionname': '^','arguments':[p1n12,p1n11]});//^ weightdif 9.4572

var p1n14=new node({'type':'function','functionname': '^','arguments':[p1n13,p1n10]});

*/


/*
var node1data={'type':'constant','value':1.056};

var node1=new node(node1data);

logger.info("eval node1: " + node1.eval({}));

var node2data={'type':'variable','variablename':'x'};

var node2=new node(node2data);

logger.info("eval node2: " + node2.eval({'x':2.17}));

var node3data={'type':'function','functionname': '+','arguments':[node1,node2]};

var node3=new node(node3data);

logger.info("eval node3: " + node3.eval({'x':2.17}));

logger.info("eval node3: " + node3.eval({'x':4.27}));

var node4data={'type':'function','functionname': '-','arguments':[node1,node2]};

var node4=new node(node4data);

logger.info("eval node4: " + node4.eval({'x':2.17}));

logger.info("eval node4: " + node4.eval({'x':4.27}));

var node5data={'type':'function','functionname': '*','arguments':[node1,node2]};

var node5=new node(node5data);

logger.info("eval node5: " + node5.eval({'x':2.17}));

logger.info("eval node5: " + node5.eval({'x':4.27}));

var node6data={'type':'function','functionname': '/','arguments':[node1,node2]};

var node6=new node(node6data);

logger.info("eval node6: " + node6.eval({'x':2.17}));

logger.info("eval node6: " + node6.eval({'x':4.27}));

var node7data={'type':'function','functionname': '^','arguments':[node1,node2]};

var node7=new node(node7data);

logger.info("eval node7: " + node7.eval({'x':2.17}));

logger.info("eval node7: " + node6.eval({'x':4.27}));


var node8data={'type':'constant','value':1.0};

var node8=new node(node8data);


var node9data={'type':'variable','variablename':'z'};

var node9=new node(node9data);



//if z <= 1 return node1 (1.056) else return node2 (value of x)
var node10data={'type':'function', 'functionname':'if<=','arguments':[node9,node8,node1,node2]}

var node10=new node(node10data);

logger.info("eval node10: " + node10.eval({'x':2.0,'z':4.0}));



*/


