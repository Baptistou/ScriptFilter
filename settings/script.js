/* -------------------- Main Process -------------------- */

//Global variables
var port = browser.runtime.Port;
var csplist = ["all","img","media","popup","script","style","frame","connect"];
var csp = {};
var urls = [];

window.onload = function(){
	//Connects port with background script
	port = browser.runtime.connect({name: "settings"});
	
	//Retrieves data from port
	port.onMessage.addListener(function(msg){
		csp = msg.csp;
		urls = msg.urls;
		csplist.forEach(function(item){
			var menu = document.getElementById("csp-"+item);
			var circle = menu.parentNode.querySelector(".icon-circle");
			menu.value = csp[item];
			circle.className = "icon-circle "+getcspcolor(item,csp[item]);
		});
		document.getElementById("mode"+msg.mode).checked = true;
		document.getElementById("contextmenu"+(!msg.options.contextmenu+1)).checked = true;
		document.getElementById("urlsadd"+(!msg.options.urlsadd+1)).checked = true;
		document.getElementById("urlsdel"+(!msg.options.urlsdel+1)).checked = true;
		document.getElementById("nburls").textContent = urls.length;
		urlstohtml("urllist",urls);
	});
	
	//Sections
	document.getElementById("nav-settings").onclick = function(){showsection("settings")};
	document.getElementById("nav-blacklist").onclick = function(){showsection("blacklist")};
	
	//About
	var manifest = browser.runtime.getManifest();
	document.getElementById("version").textContent = manifest.version;
	document.getElementById("author").textContent = manifest.author;
	document.getElementById("description").textContent = manifest.description;
	document.querySelectorAll("a.link[href]").forEach(function(link){
		link.onclick = function(event){
			event.preventDefault();
			opentab({url: this.href, index: "next", active: true});
		};
	});
	
	//Content Security Policy
	csplist.forEach(function(item){
		document.getElementById("csp-"+item).onchange = function(){
			csp[item] = parseInt(this.value);
			setcspvalue(item);
			port.postMessage({status: "CSP", csp: csp});
		};
	});
	
	//Mode
	document.getElementsByName("mode").forEach(function(radiobox){
		radiobox.onchange = function(){
			port.postMessage({status: "mode", mode: parseInt(this.value)});
		};
	});
	document.getElementById("link-blacklist").onclick = function(){showsection("blacklist")};
	
	//Options
	//Note: No Firefox Android support for browser.contextMenus
	document.getElementsByName("contextmenu").forEach(function(radiobox){
		if(!ANDROID)
			radiobox.onchange = function(){
				port.postMessage({status: "options", options: {contextmenu: (this.value=="true")}});
			};
		else radiobox.disabled = true;
	});
	document.getElementsByName("urlsadd").forEach(function(radiobox){
		radiobox.onchange = function(){
			port.postMessage({status: "options", options: {urlsadd: (this.value=="true")}});
		};
	});
	document.getElementsByName("urlsdel").forEach(function(radiobox){
		radiobox.onchange = function(){
			port.postMessage({status: "options", options: {urlsdel: (this.value=="true")}});
		};
	});
	
	//Blocked domains
	var input = document.getElementById("addurl");
	input.onkeyup = function(event){
		if(event.keyCode==13) addurl(input);
	};
	document.getElementById("addbtn").onclick = function(){addurl(input)};
	document.querySelectorAll(".msgbox").forEach(function(msgbox){
		msgbox.onclick = function(){
			hideElement(this);
			document.getElementById("nbadd").textContent = 0;
			document.getElementById("nbdel").textContent = 0;
		};
	});
	
	//Footer
	document.getElementById("reload").onclick = function(){
		port.postMessage({status: "reload"});
	};
	document.getElementById("close").onclick = function(){
		browser.tabs.getCurrent(function(tab){closetab(tab)});
	};
	
	//Internationalization
	document.querySelectorAll("i18n, [data-i18n]").forEach(seti18ndata);
};

//Disconnects port
window.onunload = function(){
	port.disconnect();
};

/* -------------------- Functions -------------------- */

//Shows sections
function showsection(target){
	hideElements(document.querySelectorAll("section, .msgbox"));
	showElement(document.getElementById(target));
	removeClass(document.querySelector("nav a.active"),"active");
	addClass(document.getElementById("nav-"+target),"active");
	document.getElementById("nbadd").textContent = 0;
	document.getElementById("nbdel").textContent = 0;
	window.scrollTo(0,0);
};

//Adds domain url to blacklist
function addurl(input){
	hideElements(document.querySelectorAll(".msgbox"));
	document.getElementById("nbdel").textContent = 0;
	if(input.value.match(/[\s+^=!:${}()|\[\]\/\\]/))
		showElement(document.getElementById("msg-error"));
	else if(urls.contains(input.value))
		showElement(document.getElementById("msg-exists"));
	else if(input.value){
		showElement(document.getElementById("msg-add"));
		document.getElementById("nbadd").textContent++;
		port.postMessage({status: "addurl", url: input.value});
		input.value = "";}
};

//Gets colors for icon-circle
function getcspcolor(item,val){
	return ["","green","orange","red"][(item=="popup" && val!=1)?3:val];
}

//Sets CSP value
function setcspvalue(item){
	if(item=="all"){
		csplist.forEach(function(item){
			var menu = document.getElementById("csp-"+item);
			var circle = menu.parentNode.querySelector(".icon-circle");
			var val = (item=="popup" && csp["all"]!=1)?2:csp["all"];
			menu.value = val;
			csp[item] = val;
			circle.className = "icon-circle "+getcspcolor(item,val);
		});}
	else{
		var menu = document.getElementById("csp-all");
		var circle = menu.parentNode.querySelector(".icon-circle");
		menu.value = 0;
		csp["all"] = 0;
		circle.className = "icon-circle";}
}

//Action buttons
function getactionsbtns(url){
	var col = document.createElement("td");
	var button = document.createElement("span");
	button.className = "icon-false";
	button.title = geti18ndata("Delete");
	button.onclick = function(){
		hideElements(document.querySelectorAll(".msgbox"));
		showElement(document.getElementById("msg-del"));
		document.getElementById("nbadd").textContent = 0;
		document.getElementById("nbdel").textContent++;
		port.postMessage({status: "delurl", url: url});
	};
	col.appendChild(button);
	return col;
};

//Converts url list to html into table
function urlstohtml(target,urls){
	var table = document.getElementById(target);
	table.innerHTML = "";
	urls.forEach(function(url){
		var row = document.createElement("tr");
		var col = document.createElement("td");
		col.title = url;
		col.textContent = url;
		row.appendChild(col);
		row.appendChild(getactionsbtns(url));
		table.appendChild(row);
	});
}
