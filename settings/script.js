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
	return CSP_COLORS[(item=="popup" && val!=1)? 3 : val];
}

//Sets CSP value
function setcspvalue(csp,item){
	if(item=="all"){
		CSP_RULES.forEach(function(item){
			var menu = document.getElementById("csp-"+item);
			var circle = menu.parentElement.querySelector(".icon-circle");
			var val = (item=="popup" && csp["all"]!=1)? 2 : csp["all"];
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
function addurl(blacklist,url){
	url = url.toLowerCase().trim();
	hideElementAll(document.querySelectorAll(".msgbox"));
	document.getElementById("nbdel").textContent = 0;
	if(!url) return false;
	if(!url.match(REG_DOMAINURL)){
		showElement(document.getElementById("msg-chars"));
		return false;}
	if(blacklist.contains(url)){
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

//Converts url list to html into table
function urlstohtml(urls){
	var table = document.querySelector("#blacklist table.list-urls");
	table.textContent = "";
	urls.forEach(function(url){
		var template = getTemplateById("tpl-blacklist");
		var col = template.querySelector("td:first-child");
		col.title = url;
		col.textContent = url;
		template.querySelector(".icon-false").onclick = function(){ delurl(url) };
		table.appendChild(template);
	});
}

//Imports urls from file data
function importurls(blacklist,data){
	const END_OF_LINE = (data.contains("\r\n"))? "\r\n" : (data.contains("\r"))? "\r" : "\n";
	var urls = data
		.split(END_OF_LINE)
		.map(val => val.toLowerCase().trim())
		.filter(val => (val && !blacklist.contains(val)));
	hideElementAll(document.querySelectorAll(".msgbox"));
	if(urls.every(val => val.match(REG_DOMAINURL))){
		showElement(document.getElementById("msg-add"));
		document.getElementById("nbadd").textContent = urls.length;
		port.postMessage({status: "import", urls: urls});}
	else showElement(document.getElementById("msg-file"));
}

/* -------------------- Main Process -------------------- */

//Global variables
const REG_DOMAINURL = /^[\.\*\?a-z0-9_-]+$/;
const CSP_RULES = ["all","img","media","popup","script","style","frame","connect"];
const CSP_COLORS = ["","green","orange","red"];
var port = browser.runtime.Port;

//Operating System
var PLATFORM_OS = "unknown";
browser.runtime.getPlatformInfo(function(info){ PLATFORM_OS = info.os });

window.onload = function(){
	var csp = {};
	var blacklist = [];
	
	//Connects port with background script
	port = browser.runtime.connect({name: "settings"});
	
	//Retrieves data from port
	port.onMessage.addListener(function(msg){
		csp = msg.csp;
		blacklist = msg.urls;
		CSP_RULES.forEach(function(item){
			var menu = document.getElementById("csp-"+item);
			var circle = menu.parentElement.querySelector(".icon-circle");
			menu.value = csp[item];
			circle.className = "icon-circle "+getcspcolor(item,csp[item]);
		});
		document.getElementById("mode"+msg.mode).checked = true;
		document.getElementById("contextmenu"+(!msg.options.contextmenu+1)).checked = true;
		document.getElementById("urlsadd"+(!msg.options.urlsadd+1)).checked = true;
		document.getElementById("urlsdel"+(!msg.options.urlsdel+1)).checked = true;
		document.getElementById("nburls").textContent = blacklist.length;
		urlstohtml(blacklist);
	});
	
	//Links
	document.querySelectorAll("a.link[href]").forEach(function(link){
		link.onclick = function(event){
			event.preventDefault();
			opentab({url: this.href, index: "next", active: true});
		};
	});
	document.querySelectorAll("nav a.link[href], a.navlink[href]").forEach(function(link){
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
	CSP_RULES.forEach(function(item){
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
		if(addurl(blacklist,this.elements[0].value)) this.reset();
	};
	
	//File
	document.getElementById("file-import").onsubmit = function(event){
		event.preventDefault();
		importfile({
			files: this.querySelector("input").files,
			accept: [".csv",".txt","text/csv","text/plain"],
			success: function(data){ importurls(blacklist,data) },
			error: function(){
				hideElementAll(document.querySelectorAll(".msgbox"));
				showElement(document.getElementById("msg-import"));
			}
		});
		this.reset();
	};
	document.getElementById("file-export").onsubmit = function(event){
		const END_OF_LINE = (PLATFORM_OS=="win")? "\r\n" : (PLATFORM_OS=="mac")? "\r" : "\n";
		event.preventDefault();
		exportfile({
			filename: "ScriptFilter Export.txt",
			filetype: "text/plain",
			data: blacklist.join(END_OF_LINE)
		});
		this.reset();
	};
	document.querySelector("#clear-text .button").onclick = function(){
		toggleElementAll(document.querySelectorAll("#clear-confirm, #clear-text"));
	};
	document.querySelector("#clear-confirm .btn-yes").onclick = function(){
		toggleElementAll(document.querySelectorAll("#clear-confirm, #clear-text, #msg-del"));
		document.getElementById("nbdel").textContent = blacklist.length;
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
		browser.tabs.getCurrent(function(tab){ closetab(tab) });
	};
	document.querySelectorAll(".msgbox").forEach(function(msgbox,index,list){
		msgbox.onclick = function(){
			hideElementAll(list);
			document.getElementById("nbadd").textContent = 0;
			document.getElementById("nbdel").textContent = 0;
		};
	});
	
	//Internationalization
	document.querySelectorAll("i18n, [data-i18n]").forEach(seti18ndata);
	document.querySelectorAll("template").forEach(function(template){
		template.content.querySelectorAll("i18n, [data-i18n]").forEach(seti18ndata);
	});
};

//Disconnects port
window.onunload = function(){
	port.disconnect();
};
