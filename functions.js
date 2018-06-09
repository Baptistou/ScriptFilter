/* -------------------- Prototypes -------------------- */

//Returns true if string contains str
String.prototype.contains = function(str){
	return (this.indexOf(str)>=0);
};

//Returns number of occurrences of str
String.prototype.count = function(str){
	var count=0, index=0;
	while(index = this.indexOf(str,index)+1) count++;
	return count;
};

//Replaces all occurrences of str1 by str2
String.prototype.replaceAll = function(str1,str2){
	return this.split(str1).join(str2);
};

//Removes the first occurence of str
String.prototype.remove = function(str){
	return this.replace(str,"");
};

//Removes all occurences of str
String.prototype.removeAll = function(str){
	return this.replaceAll(str,"");
};

//Returns first element of array
Array.prototype.first = function(){ return this[0] };

//Returns last element of array
Array.prototype.last = function(){ return this[this.length-1] };

//Returns true if array contains val
Array.prototype.contains = function(val){
	return (this.indexOf(val)>=0);
};

//Returns number of elements that fulfill condition
Array.prototype.count = function(callback){
	var count=0;
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) count++;}
	return count;
};

//Inserts value into array at specified index
Array.prototype.insert = function(index,val){
	this.splice(index,0,val);
};

//Flattens array
Array.prototype.flatten = function(){
	return this.reduce(function(acc,val){ return acc.concat(val) },[]);
};

//Maps and flattens array
Array.prototype.flatMap = function(callback){
	return this.reduce(function(acc,val,index,self){ return acc.concat(callback(val,index,self)) },[]);
};

//Groups array values by key from specified callback
Array.prototype.groupBy = function(callback){
	return this.reduce(function(acc,val){
		var key = callback(val);
		var group = acc.find(function(group){ return (group.key===key) });
		if(group) group.value.push(val);
		else acc.push({key: key, value: [val]});
		return acc;
	},[]);
};

//Removes duplicate values from array
Array.prototype.unique = function(callback){
	return this.reduce(
		(callback)?
		function(acc,val1){
			if(!acc.some(function(val2){ return callback(val1,val2) })) acc.push(val1);
			return acc;
		}:
		function(acc,val){
			if(!acc.contains(val)) acc.push(val);
			return acc;
		},
		[]
	);
};

//Merges two arrays
Array.prototype.merge = function(list,callback){
	return this.concat(list).reduce(
		(callback)?
		function(acc,val1){
			var index = acc.findIndex(function(val2){ return callback(val1,val2) });
			if(index<0) acc.push(val1);
			else acc[index] = val1;
			return acc;
		}:
		function(acc,val){
			var index = acc.indexOf(val);
			if(index<0) acc.push(val);
			else acc[index] = val;
			return acc;
		},
		[]
	);
};

//Intersects two arrays
Array.prototype.intersect = function(list,callback){
	return this.filter(
		(callback)?
		function(val1){
			return list.some(function(val2){ return callback(val1,val2) });
		}:
		function(val){ return list.contains(val) }
	);
};

//Subtracts two arrays
Array.prototype.subtract = function(list,callback){
	return this.filter(
		(callback)?
		function(val1){
			return !list.some(function(val2){ return callback(val1,val2) });
		}:
		function(val){ return !list.contains(val) }
	);
};

//Removes first element that fulfills condition
Array.prototype.remove = function(callback){
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) return this.splice(i,1)[0];}
	return undefined;
};

/* -------------------- Polyfills -------------------- */

//ECMAScript 2015
if(!Array.from)
Array.from = (function(){
	var toStr = Object.prototype.toString;
	var isCallable = function(fn){ return (typeof fn==="function" || toStr.call(fn)==="[object Function]") };
	var toInteger = function(value){
		var number = Number(value);
		if(isNaN(number)) return 0;
		if(number===0 || !isFinite(number)) return number;
		return ((number>0)?1:-1)*Math.floor(Math.abs(number));
	};
	var maxSafeInteger = Math.pow(2,53)-1;
	var toLength = function(value){ return Math.min(Math.max(toInteger(value),0),maxSafeInteger) };

	return function from(arrayLike/*,mapFn,thisArg*/){
		var C = this;
		var items = Object(arrayLike);
		if(arrayLike==null) throw new TypeError("Array.from doit utiliser un objet semblable à un tableau");
		var mapFn = (arguments.length>1) ? arguments[1] : void undefined;
		var T;
		if(typeof mapFn!=='undefined'){
			if(!isCallable(mapFn))
				throw new TypeError("Array.from: lorsqu'il est utilisé le deuxième argument doit être une fonction");
			if(arguments.length>2) T = arguments[2];
		}
		var len = toLength(items.length);
		var A = (isCallable(C))? Object(new C(len)) : new Array(len);
		for(var k=0, kValue; k<len; k++){
			kValue = items[k];
			if(mapFn) A[k] = (typeof T==="undefined")? mapFn(kValue,k) : mapFn.call(T,kValue,k);
			else A[k] = kValue;
		}
		A.length = len;
		return A;
	};
}());

//ECMAScript 2015
if(!Array.prototype.find)
Array.prototype.find = function(callback){
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) return this[i];}
	return undefined;
};

//ECMAScript 2015
if(!Array.prototype.findIndex)
Array.prototype.findIndex = function(callback){
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) return i;}
	return -1;
};

//DOM Level 3 2017
if(window.HTMLCollection && !HTMLCollection.prototype.forEach)
HTMLCollection.prototype.forEach = Array.prototype.forEach;

//DOM Level 3 2017
if(window.NodeList && !NodeList.prototype.forEach)
NodeList.prototype.forEach = Array.prototype.forEach;

/* -------------------- Functions -------------------- */

//Returns true if string contains only whitespaces
function isempty(str){ return (!str || !str.trim()) }

//Returns true if DOM element is hidden
function ishidden(element){
	//return (window.getComputedStyle(element).display=="none");
	return element.className.split(" ").contains("hidden");
}

//Gets DOM template element
function getTemplateById(id){
	var template = document.getElementById(id);
	return document.importNode(template.content || template,true);
}

//Returns true if DOM element has class name
function hasClass(element,str){
	return element.className && element.className.split(" ").contains(str);
}

//Adds class name to DOM element
function addClass(element,str){
	var classes = (element.className)? element.className.split(" ") : [];
	if(!classes.contains(str)) element.className = classes.concat(str).join(" ");
}

//Adds class name to all DOM elements
function addClassAll(list,str){
	list.forEach(function(element){ addClass(element,str) });
}

//Removes class name from DOM element
function removeClass(element,str){
	var classes = (element.className)? element.className.split(" ") : [];
	if(classes.contains(str)) element.className = classes.filter(function(val){ return (val!=str) }).join(" ");
}

//Removes class name from all DOM elements
function removeClassAll(list,str){
	list.forEach(function(element){ removeClass(element,str) });
}

//Toggles class name of DOM element
function toggleClass(element,str){
	var classes = (element.className)? element.className.split(" ") : [];
	if(!classes.contains(str)) element.className = classes.concat(str).join(" ");
	else element.className = classes.filter(function(val){ return (val!=str) }).join(" ");
}

//Toggles class name of all DOM elements from list
function toggleClassAll(list,str){
	list.forEach(function(element){ toggleClass(element,str) });
}

//Shows DOM element
function showElement(element){
	if(element) removeClass(element,"hidden");
}

//Shows all DOM elements
function showElementAll(list){
	list.forEach(showElement);
}

//Hides DOM element
function hideElement(element){
	if(element) addClass(element,"hidden");
}

//Hides all DOM elements
function hideElementAll(list){
	list.forEach(hideElement);
}

//Toggles DOM element
function toggleElement(element){
	if(element) toggleClass(element,"hidden");
}

//Toggles all DOM elements
function toggleElementAll(list){
	list.forEach(toggleElement);
}

//Removes DOM element
function removeElement(element){
	if(element) element.parentElement.removeChild(element);
}

//Removes all DOM elements
function removeElementAll(list){
	list.forEach(removeElement);
}

//Imports text file
//args = {(mandatory) files [array], (optional) accept [array], success [function], error [function]}
function importfile(args){
	Array.prototype.forEach.call(args.files,function(file){
		var fileext = file.name.substring(file.name.lastIndexOf("."));
		if(!args.accept || args.accept.contains(file.type) || args.accept.contains(fileext)){
			var reader = new FileReader();
			if(args.success) reader.onload = function(){ args.success(this.result) };
			if(args.error) reader.onerror = function(event){ args.error(event.target.error) };
			reader.readAsText(file);}
		else if(args.error) args.error();
	});
}

//Exports UTF-8 BOM text file
//args = {(mandatory) filename [string], filetype [string], data [string]}
function exportfile(args){
	var link = document.createElement("a");
	link.download = args.filename;
	link.href = "data:"+args.filetype+";charset=UTF-8,\uFEFF"+encodeURI(args.data);
	document.body.appendChild(link);
	link.click();
}

/* -------------------- Classes -------------------- */

//Manages Timeout and Interval
//args = {(mandatory) func [function], delay [int], (optional) repeat [bool], autostart [bool], runonstart [bool]}
function Timer(args){
//#	Variables
	var self = this;
	var timeout = null;
	var interval = null;
	var lasttime = null;
	var difftime = null;
	var active = false;
	
//#	Public methods
	this.start = function(){
		if(!active){
			lasttime = (new Date()).getTime();
			active = true;
			timeoutinterval(args.runonstart);}
	};
	
	this.stop = function(){
		if(active){
			if(timeout) timeout = clearTimeout(timeout);
			if(interval) interval = clearInterval(interval);
			difftime = null;
			active = false;}
	};
	
	this.restart = function(){
		this.stop();
		this.start();
	};
	
	this.resume = function(){
		if(active && difftime!=null){
			if(difftime<args.delay){
				lasttime = (new Date()).getTime()-difftime;
				timeout = setTimeout(function(){ timeoutinterval(true) },args.delay-difftime);}
			else timeoutinterval(true);
			difftime = null;}
	};
	
	this.pause = function(){
		if(active && difftime==null){
			this.stop();
			difftime = (new Date()).getTime()-lasttime;
			active = true;}
	};
	
//#	Private methods
	var timeoutcallback = function(){
		active = false;
		args.func();
	};
	
	var intervalcallback = function(){
		lasttime = (new Date()).getTime();
		args.func();
	};
	
	var timeoutinterval = function(runonstart){
		if(args.repeat){
			if(runonstart) intervalcallback();
			interval = setInterval(intervalcallback,args.delay);}
		else if(runonstart) timeoutcallback();
		else timeout = setTimeout(timeoutcallback,args.delay);
	};
	
//#	Constructors
	if(args.autostart) this.start();
}
