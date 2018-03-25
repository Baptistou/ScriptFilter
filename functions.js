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
Array.prototype.first = function(){
	return this[0];
};

//Returns last element of array
Array.prototype.last = function(){
	return this[this.length-1];
};

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
	return this
		.reduce(function(acc,val){
			var key = callback(val);
			var group = acc.find(function(val){ return (callback(val[0])===key) });
			if(group===undefined) acc.push([val]);
			else group.push(val);
			return acc;
		},[])
		.map(function(val){ 
			return (val.length>1)? val : val[0];
		});
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
		function(val){
			return list.contains(val);
		}
	);
};

//Subtracts two arrays
Array.prototype.subtract = function(list,callback){
	return this.filter(
		(callback)?
		function(val1){
			return !list.some(function(val2){ return callback(val1,val2) });
		}:
		function(val){
			return !list.contains(val);
		}
	);
};

//Removes first element that fulfills condition
Array.prototype.remove = function(callback){
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) return this.splice(i,1)[0];}
	return undefined;
};

//Removes all elements that fulfill condition
Array.prototype.removeAll = function(callback){
	var list = [];
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) list.push(this.splice(i--,1)[0]);}
	return list;
};

/* -------------------- Polyfills -------------------- */

//Provides find support to Array
if(!Array.prototype.find)
Array.prototype.find = function(callback){
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) return this[i];}
	return undefined;
};

//Provides findIndex support to Array
if(!Array.prototype.findIndex)
Array.prototype.findIndex = function(callback){
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) return i;}
	return -1;
};

//Provides forEach support to DOM HTMLCollection
if(window.HTMLCollection && !HTMLCollection.prototype.forEach)
HTMLCollection.prototype.forEach = Array.prototype.forEach;

//Provides forEach support to DOM NodeList
if(window.NodeList && !NodeList.prototype.forEach)
NodeList.prototype.forEach = Array.prototype.forEach;

/* -------------------- Functions -------------------- */

//Returns true if string contains only whitespaces
function isempty(str){
	return (!str || !(/\S/.test(str)));
}

//Returns true if DOM element is hidden
function ishidden(element){
	//return (window.getComputedStyle(element).display=="none");
	return element.className.contains("hidden");
}

//Gets DOM template element
function getTemplateById(id){
	var template = document.getElementById(id);
	return document.importNode(template.content || template,true);
}

//Adds class name of DOM element
function addClass(element,str){
	if(!element.className.contains(str)) element.className = (element.className+" "+str).trim();
}

//Adds class name of all DOM elements from list
function addClassAll(list,str){
	list.forEach(function(element){ addClass(element,str) });
}

//Removes class name of DOM element
function removeClass(element,str){
	element.className = element.className.removeAll(str).trim();
}

//Removes class name of all DOM elements from list
function removeClassAll(list,str){
	list.forEach(function(element){ removeClass(element,str) });
}

//Toggles class name of DOM element
function toggleClass(element,str){
	if(!element.className.contains(str)) element.className = (element.className+" "+str).trim();
	else element.className = element.className.removeAll(str).trim();
}

//Toggles class name of all DOM elements from list
function toggleClassAll(list,str){
	list.forEach(function(element){ toggleClass(element,str) });
}

//Shows DOM element
function showElement(element){
	if(element) removeClass(element,"hidden");
}

//Shows all DOM elements from list
function showElementAll(list){
	list.forEach(showElement);
}

//Hides DOM element
function hideElement(element){
	if(element) addClass(element,"hidden");
}

//Hides all DOM elements from list
function hideElementAll(list){
	list.forEach(hideElement);
}

//Toggles DOM element
function toggleElement(element){
	if(element) toggleClass(element,"hidden");
}

//Toggles all DOM elements from list
function toggleElementAll(list){
	list.forEach(toggleElement);
}

//Removes DOM element
function removeElement(element){
	if(element) element.parentElement.removeChild(element);
}

//Removes all DOM elements from list
function removeElementAll(list){
	list.forEach(removeElement);
}

//Imports text file
//args = {(mandatory) files, (optional) accept, success, error}
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
//args = {(mandatory) filename, filetype, data}
function exportfile(args){
	var link = document.createElement("a");
	link.download = args.filename;
	link.href = "data:"+args.filetype+";charset=UTF-8,\uFEFF"+encodeURI(args.data);
	document.body.appendChild(link);
	link.click();
}
