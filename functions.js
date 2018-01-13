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

//Inserts value into array at specified index
Array.prototype.insert = function(index,val){
	this.splice(index,0,val);
};

//Returns number of elements that fulfill condition
Array.prototype.count = function(callback){
	var count=0;
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) count++;}
	return count;
};

//Removes first element that fulfills condition
Array.prototype.remove = function(callback){
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) return this.splice(i,1)[0];}
	return null;
};

//Removes all elements that fulfill condition
Array.prototype.removeAll = function(callback){
	var list = [];
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) list.push(this.splice(i--,1)[0]);}
	return list;
};

/* -------------------- Polyfills -------------------- */

//ForEach support for DOM element list
if(window.HTMLCollection && !HTMLCollection.prototype.forEach)
    HTMLCollection.prototype.forEach = Array.prototype.forEach;

//ForEach support for DOM node list
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

//Adds class name of DOM element
function addClass(element,str){
	if(!element.className.contains(str)) element.className = (element.className+" "+str).trim();
}

//Adds class name of all DOM elements from list
function addClassAll(list,str){
	list.forEach(function(element){addClass(element,str)});
}

//Removes class name of DOM element
function removeClass(element,str){
	element.className = element.className.removeAll(str).trim();
}

//Removes class name of all DOM elements from list
function removeClassAll(list,str){
	list.forEach(function(element){removeClass(element,str)});
}

//Toggles class name of DOM element
function toggleClass(element,str){
	if(!element.className.contains(str)) element.className = (element.className+" "+str).trim();
	else element.className = element.className.removeAll(str).trim();
}

//Toggles class name of all DOM elements from list
function toggleClassAll(list,str){
	list.forEach(function(element){toggleClass(element,str)});
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
function importfile(obj){
	Array.prototype.forEach.call(obj.files,function(file){
		var fileext = file.name.substring(file.name.lastIndexOf("."));
		if(!obj.accept || obj.accept.contains(file.type) || obj.accept.contains(fileext)){
			var reader = new FileReader();
			if(obj.success) reader.onload = function(){obj.success(this.result)};
			if(obj.error) reader.onerror = function(event){obj.error(event.target.error)};
			reader.readAsText(file);}
		else if(obj.error) obj.error();
	});
}

//Exports UTF-8 BOM text file
function exportfile(obj){
	var link = document.createElement("a");
	link.href = "data:"+obj.filetype+";charset=UTF-8,\uFEFF"+encodeURI(obj.data);
	link.download = obj.filename;
	document.body.appendChild(link);
	link.click();
}
