/* -------------------- Functions -------------------- */

//Shows sections
function showsection(target){
	hideElementAll(document.querySelectorAll("section, .msgbox, #clear-confirm"));
	showElementAll(document.querySelectorAll("#clear-text, #"+target));
	removeClass(document.querySelector("nav a.link.active"),"active");
	addClass(document.querySelector("nav a.link[href='#"+target+"']"),"active");
	document.getElementById("nbadd").textContent = 0;
	document.getElementById("nbdel").textContent = 0;
	window.scrollTo(0,0);
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
			var circle = menu.parentElement.querySelector(".icon-circle");
			var val = (item=="popup" && csp["all"]!=1)?2:csp["all"];
			menu.value = val;
			csp[item] = val;
			circle.className = "icon-circle "+getcspcolor(item,val);
		});}
	else{
		var menu = document.getElementById("csp-all");
		var circle = menu.parentElement.querySelector(".icon-circle");
		menu.value = 0;
		csp["all"] = 0;
		circle.className = "icon-circle";}
}

//Adds domain url to blacklist
function addurl(url){
	url = url.toLowerCase().trim();
	hideElementAll(document.querySelectorAll(".msgbox"));
	document.getElementById("nbdel").textContent = 0;
	if(!url) return false;
	if(!url.match(REG_DOMAINURL)){
		showElement(document.getElementById("msg-chars"));
		return false;}
	if(urls.contains(url)){
		showElement(document.getElementById("msg-exists"));
		return false;}
	showElement(document.getElementById("msg-add"));
	document.getElementById("nbadd").textContent++;
	port.postMessage({status: "addurl", url: url});
	return true;
};

//Removes domain url from blacklist
function delurl(url){
	hideElementAll(document.querySelectorAll(".msgbox"));
	showElement(document.getElementById("msg-del"));
	document.getElementById("nbadd").textContent = 0;
	document.getElementById("nbdel").textContent++;
	port.postMessage({status: "delurl", url: url});
};

//Action buttons
function getclosebtn(url){
	var col = document.createElement("td");
	var button = document.createElement("span");
	button.className = "icon-false";
	button.title = geti18ndata("Delete");
	button.onclick = function(){delurl(url)};
	col.appendChild(button);
	return col;
};

//Converts url list to html into table
function urlstohtml(target,urls){
	var table = document.getElementById(target);
	table.textContent = "";
	urls.forEach(function(url){
		var row = document.createElement("tr");
		var col = document.createElement("td");
		col.title = url;
		col.textContent = url;
		row.appendChild(col);
		row.appendChild(getclosebtn(url));
		table.appendChild(row);
	});
}

//Imports urls from file data
function importurls(data){
	var END_OF_LINE = data.contains("\r\n")? "\r\n" : data.contains("\r")? "\r" : "\n";
	var list = data.split(END_OF_LINE)
		.map(val => val.toLowerCase().trim())
		.filter(val => (val && !urls.contains(val)));
	hideElementAll(document.querySelectorAll(".msgbox"));
	if(!list.find(val => !val.match(REG_DOMAINURL))){
		showElement(document.getElementById("msg-add"));
		document.getElementById("nbadd").textContent = list.length;
		port.postMessage({status: "import", urls: list});}
	else showElement(document.getElementById("msg-file"));
}

/* -------------------- Main Process -------------------- */

//Global variables
var REG_DOMAINURL = /^[\.\*\?a-z0-9_-]+$/;
var port = browser.runtime.Port;
var csplist = ["all","img","media","popup","script","style","frame","connect"];
var csp = {};
var urls = [];

//Operating System
var PLATFORM_OS = "unknown";
browser.runtime.getPlatformInfo(function(info){PLATFORM_OS = info.os;});

window.onload = function(){
	//Connects port with background script
	port = browser.runtime.connect({name: "settings"});
	
	//Retrieves data from port
	port.onMessage.addListener(function(msg){
		csp = msg.csp;
		urls = msg.urls;
		csplist.forEach(function(item){
			var menu = document.getElementById("csp-"+item);
			var circle = menu.parentElement.querySelector(".icon-circle");
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
	
	//Links
	document.querySelectorAll("a.link[href]").forEach(function(link){
		link.onclick = function(event){
			event.preventDefault();
			opentab({url: this.href, index: "next", active: true});
		};
	});
	document.querySelectorAll("nav a.link, a.link.nav").forEach(function(link){
		link.onclick = function(event){
			event.preventDefault();
			showsection(this.href.substring(this.href.indexOf("#")+1));
		};
	});
	
	//About
	var manifest = browser.runtime.getManifest();
	document.getElementById("version").textContent = manifest.version;
	document.getElementById("author").textContent = manifest.author;
	document.getElementById("description").textContent = manifest.description;
	
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
	
	//Options
	//Note: No Firefox Android support for browser.contextMenus
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
	document.getElementsByName("contextmenu").forEach(function(radiobox){
		if(!ANDROID)
			radiobox.onchange = function(){
				port.postMessage({status: "options", options: {contextmenu: (this.value=="true")}});
			};
		else radiobox.disabled = true;
	});
	
	//Blocked domains
	document.getElementById("addurl").onsubmit = function(event){
		event.preventDefault();
		if(addurl(this.elements[0].value)) this.reset();
	};
	
	//File
	document.getElementById("file-import").onsubmit = function(event){
		event.preventDefault();
		importfile({
			files: [this.querySelector("input").files[0]],
			accept: [".csv",".txt","text/csv","text/plain"],
			success: importurls,
			error: function(){
				hideElementAll(document.querySelectorAll(".msgbox"));
				showElement(document.getElementById("msg-import"));
			}
		});
		this.reset();
	};
	document.getElementById("file-export").onsubmit = function(event){
		var END_OF_LINE = (PLATFORM_OS=="win")? "\r\n" : (PLATFORM_OS=="mac")? "\r" : "\n";
		event.preventDefault();
		exportfile({
			filename: "ScriptFilter Export.txt",
			filetype: "text/plain",
			data: urls.join(END_OF_LINE)
		});
		this.reset();
	};
	document.querySelector("#clear-text .button").onclick = function(){
		toggleElementAll(document.querySelectorAll("#clear-confirm, #clear-text"));
	};
	document.querySelector("#clear-confirm .btn-yes").onclick = function(){
		toggleElementAll(document.querySelectorAll("#clear-confirm, #clear-text, #msg-del"));
		document.getElementById("nbdel").textContent = urls.length;
		port.postMessage({status: "clear"});
	};
	document.querySelector("#clear-confirm .btn-no").onclick = function(){
		toggleElementAll(document.querySelectorAll("#clear-confirm, #clear-text"));
	};
	
	//Footer
	document.getElementById("reload").onclick = function(){
		port.postMessage({status: "reload"});
	};
	document.getElementById("close").onclick = function(){
		browser.tabs.getCurrent(function(tab){closetab(tab)});
	};
	document.querySelectorAll(".msgbox").forEach(function(msgbox,index,self){
		msgbox.onclick = function(){
			hideElementAll(self);
			document.getElementById("nbadd").textContent = 0;
			document.getElementById("nbdel").textContent = 0;
		};
	});
	
	
	//Internationalization
	document.querySelectorAll("i18n, [data-i18n]").forEach(seti18ndata);
};

//Disconnects port
window.onunload = function(){
	port.disconnect();
};
