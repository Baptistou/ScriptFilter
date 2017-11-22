/* -------------------- WebExtensions -------------------- */

//Browser compatibility
var CHROMIUM = !browser;
var FIREFOX = !!browser;
var browser = browser || chrome;
var ANDROID = !browser.windows;

//Focuses specified tab
function focustab(tab){
	if(!ANDROID) browser.windows.update(tab.windowId,{focused: true});
	browser.tabs.update(tab.id,{active: true});
}

//Closes specified tab and its window
//Note: about:config --> browser.tabs.closeWindowWithLastTab
function closetab(tab){
	if(!ANDROID)
		browser.tabs.query({windowId: tab.windowId},function(tabs){
			if(tabs.length==1 && tabs[0].id==tab.id) browser.windows.remove(tab.windowId);
			else browser.tabs.remove(tab.id);
		});
	else browser.tabs.remove(tab.id);
}

/* -------------------- Prototypes -------------------- */

//Returns true if string contains str
String.prototype.contains = function(str){
	return (this.indexOf(str)>=0);
};

//Returns number of occurrences of str
String.prototype.occurrence = function(str){
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

//Returns true if array contains val
Array.prototype.contains = function(val){
	return (this.indexOf(val)>=0);
};

//Returns number of occurrences of val
Array.prototype.occurrence = function(val){
	var count=0, index=0;
	while(index = this.indexOf(val,index)+1) count++;
	return count;
};

//Inserts value into array at specified index
Array.prototype.insert = function(index,val){
	this.splice(index,0,val);
};

//Removes first element that fulfills condition
Array.prototype.remove = function(callback){
	var index = this.findIndex(callback);
	return (index>=0)?this.splice(index,1)[0]:null;
};

//Removes all elements that fulfill condition
Array.prototype.removeAll = function(callback){
	var list = [];
	for(var i=0; i<this.length; i++){
		if(callback(this[i],i,this)) list.push(this.splice(i--,1)[0]);}
	return list;
};

/* -------------------- Functions -------------------- */

//Returns true if string contains only whitespaces
function isempty(str){
	return (!str || !(/\S/.test(str)));
}

//Adds class name
function addClass(target,str){
	if(!target.className.contains(str)) target.className = (target.className+" "+str).trim();
}

//Removes class name
function removeClass(target,str){
	if(target.className.contains(str)) target.className = target.className.replace(str,"").trim();
}

//Toggles class name
function toggleClass(target,str){
	if(!target.className.contains(str)) addClass(target,str);
	else removeClass(target,str);
}

//Returns true if element is hidden
function isHiddenElement(target){
	return target.className.contains("hidden");
}

//Shows element
function showElement(target){
	removeClass(target,"hidden");
}

//Shows element list
function showElements(list){
	list.forEach(function(val){removeClass(val,"hidden")});
}

//Hides element
function hideElement(target){
	addClass(target,"hidden");
}

//Hides element list
function hideElements(list){
	list.forEach(function(val){addClass(val,"hidden")});
}

//Toggles element
function toggleElement(target){
	toggleClass(target,"hidden");
}

//Toggles element list
function toggleElements(list){
	list.forEach(function(val){toggleClass(val,"hidden")});
}

//Removes element
function removeElement(target){
	if(target) target.parentNode.removeChild(target);
}

//Removes element list
function removeElements(list){
	list.forEach(function(val){val.parentNode.removeChild(val)});
}
