/* -------------------- PreProcess -------------------- */

//Global constants
const MANIFEST = browser.runtime.getManifest();
const PORT_SETTINGS = "settings";
const URL_THEME = {1: "/themes/light.css", 2: "/themes/dark.css"};
const CSP_CUSTOM=0, CSP_ENABLE=1, CSP_RESTRICT_EXTERNAL=2, CSP_RESTRICT_UNSAFE=3, CSP_DISABLE=4;
const REG_DOMAINURL = /^[\.\*\?a-z0-9_-]+$/;
const CSP_RULES = ["all","img","media","style","script","popup","frame","connect"];
const CSP_COLORS = ["","green","orange","orange","red"];
const IMPORT_FILEACCEPT = [".txt",".csv","text/plain","text/csv"];
const EXPORT_FILENAME = {1: "scriptfilter_export.txt", 2: "scriptfilter_export.csv"};
const EXPORT_FILETYPE = {1: "text/plain", 2: "text/csv"};

//Operating system
var PLATFORM_OS = "";
browser.runtime.getPlatformInfo(info => (PLATFORM_OS = info.os));

/* -------------------- Functions -------------------- */

//Shows sections
function showsection(target){
	hideElementAll(document.querySelectorAll("section, .msgbox, #clear_confirm"));
	showElementAll(document.querySelectorAll("#clear_text, #"+target));
	removeClass(document.querySelector("nav a.link.active"),"active");
	addClass(document.querySelector("nav a.link[href='#"+target+"']"),"active");
	document.getElementById("nbadd").textContent = 0;
	document.getElementById("nbdel").textContent = 0;
	window.scrollTo(0,0);
	port.postMessage({status: "ui", uistate: {section: target}});
}

//Sets navbar and external links
function setlinks(){
	document.querySelectorAll("a.link.ext[href]").forEach(function(link){
		link.onclick = function(event){
			event.preventDefault();
			opentab({url: this.href, index: "next", active: true});
		};
	});
	document.querySelectorAll("nav a.link[href], a.link.nav[href]").forEach(function(link){
		link.onclick = function(event){
			event.preventDefault();
			showsection(this.href.split("#").last());
		};
	});
}

//Sets navbar action menu
function setactionmenu(){
	document.getElementById("toggle_action").onclick = function(){
		toggleElement(document.getElementById("action_menu"));
	};
	document.getElementById("toggle_action").onblur = function(){
		setTimeout(function(){ hideElement(document.getElementById("action_menu")) },200);
	};
	document.getElementById("untrustall").onclick = function(){ port.postMessage({status: "untrustall"}) };
	document.getElementById("trustall").onclick = function(){ port.postMessage({status: "trustall"}) };
	document.getElementById("blacklistall").onclick = function(){ port.postMessage({status: "blacklistall"}) };
	document.getElementById("reload").onclick = function(){ port.postMessage({status: "reload"}) };
	document.getElementById("close").onclick = function(){ browser.tabs.getCurrent(closetab) };
}

//Plays slideshow animation
function playslideshow(){
	document.querySelectorAll("ul.slideshow").forEach(function(slideshow){
		var shownextslide = function(){
			var item = slideshow.querySelector("li.active");
			var next = item.nextElementSibling || slideshow.querySelector("li");
			toggleClassAll([item,next],"active");
		};
		var timer = new Timer({
			func: shownextslide,
			delay: 10000,
			repeat: true,
			autostart: true
		});
		slideshow.onmouseover = function(){ timer.pause() };
		slideshow.onmouseout = function(){ timer.resume() };
		slideshow.querySelector(".arrow-next").onclick = function(){
			timer.restart();
			shownextslide();
		};
	});
}

//Sets Mode & Options radio boxes
//Note: No Firefox Android support for contextMenus
function setradioboxes(){
	document.getElementsByName("mode").forEach(function(radiobox){
		radiobox.onchange = function(){ port.postMessage({status: "mode", mode: parseInt(this.value)}) };
	});
	document.getElementsByName("autoaddurl").forEach(function(radiobox){
		radiobox.onchange = function(){ port.postMessage({status: "options", options: {autoaddurl: (this.value=="true")}}) };
	});
	document.getElementsByName("autodelurl").forEach(function(radiobox){
		radiobox.onchange = function(){ port.postMessage({status: "options", options: {autodelurl: (this.value=="true")}}) };
	});
	document.getElementsByName("contextmenu").forEach(function(radiobox){
		if(!ANDROID) radiobox.onchange = function(){ port.postMessage({status: "options", options: {contextmenu: (this.value=="true")}}) };
		else radiobox.disabled = true;
	});
	document.getElementsByName("uitheme").forEach(function(radiobox){
		radiobox.onchange = function(){
			document.getElementById("include_theme").href = URL_THEME[this.value];
			port.postMessage({status: "ui", uitheme: parseInt(this.value)});
		};
	});
}

//Imports urls from file data
function importurls(data){
	const END_OF_LINE = (data.contains("\r\n"))? "\r\n" : (data.contains("\r"))? "\r" : "\n";
	var urls = data.split(END_OF_LINE).map(val => val.toLowerCase().trim());
	var index = urls.findIndex(val => (val && !val.match(REG_DOMAINURL)))+1;
	if(index){
		showElement(document.getElementById("msg_invalid_filecontent"));
		document.getElementById("fileline").textContent = index;}
	else port.postMessage({status: "import", urls: urls});
}

//Sets File Import/Export forms
function setimportexportforms(){
	document.getElementById("file_import").onsubmit = function(event){
		event.preventDefault();
		hideElementAll(document.querySelectorAll(".msgbox"));
		importfile({
			files: this.querySelector("input").files,
			accept: IMPORT_FILEACCEPT,
			success: importurls,
			error: function(){ showElement(document.getElementById("msg_invalid_fileext")) }
		});
		this.reset();
	};
	document.getElementById("file_export").onsubmit = function(event){
		const END_OF_LINE = (PLATFORM_OS=="win")? "\r\n" : (PLATFORM_OS=="mac")? "\r" : "\n";
		var val = this.elements["export_type"].value;
		event.preventDefault();
		exportfile({
			filename: EXPORT_FILENAME[val],
			filetype: EXPORT_FILETYPE[val],
			data: blacklist.join(END_OF_LINE)
		});
		port.postMessage({status: "ui", uistate: {exporttype: val}});
	};
}

//Sets Clear Blacklist form
function setclearblacklistform(){
	document.querySelector("#clear_text .button").onclick =
	document.querySelector("#clear_confirm .btn-no").onclick = function(){
		toggleElementAll(document.querySelectorAll("#clear_confirm, #clear_text"));
	};
	document.querySelector("#clear_confirm .btn-yes").onclick = function(){
		toggleElementAll(document.querySelectorAll("#clear_confirm, #clear_text"));
		port.postMessage({status: "clear"});
	};
}

//Gets CSP value according to key
function getcspvalue(key,value){
	return (key=="popup" && value!=CSP_ENABLE)? CSP_DISABLE : value;
}

//Sets CSP value
function setcspvalue(key,value){
	if(key=="all")
		CSP_RULES.forEach(function(key){
			var menu = document.getElementById("csp_"+key);
			var circle = menu.parentElement.querySelector(".icon-circle");
			var val = getcspvalue(key,value);
			menu.value = val;
			csp[key] = val;
			circle.className = "icon-circle "+CSP_COLORS[val];
		});
	else{
		var menu = document.getElementById("csp_all");
		var circle = menu.parentElement.querySelector(".icon-circle");
		menu.value = CSP_CUSTOM;
		csp["all"] = CSP_CUSTOM;
		csp[key] = value;
		circle.className = "icon-circle";}
}

//Adds domain url to blacklist
function addurl(form){
	var url = form.elements["url"].value.toLowerCase().trim();
	hideElementAll(document.querySelectorAll(".msgbox"));
	document.getElementById("nbdel").textContent = 0;
	if(!url) form.reset();
	else if(!url.match(REG_DOMAINURL)) showElement(document.getElementById("msg_invalid_chars"));
	else if(blacklist.contains(url)) showElement(document.getElementById("msg_already_exists"));
	else{
		showElement(document.getElementById("msg_addurl"));
		document.getElementById("nbadd").textContent++;
		port.postMessage({status: "addurl", url: url});
		form.reset();}
}

//Removes domain url from blacklist
function delurl(url){
	hideElementAll(document.querySelectorAll(".msgbox"));
	showElement(document.getElementById("msg_delurl"));
	document.getElementById("nbadd").textContent = 0;
	document.getElementById("nbdel").textContent++;
	port.postMessage({status: "delurl", url: url});
}

//Converts url list to html into table
function urlstohtml(urls){
	var table = document.querySelector("#blacklist table.list-urls");
	table.textContent = "";
	urls.forEach(function(url){
		var template = getTemplateById("tpl_blacklist");
		var col = template.querySelector("td:first-child");
		col.title = url;
		col.textContent = url;
		template.querySelector(".icon-false").onclick = function(){ delurl(url) };
		table.appendChild(template);
	});
}

//Sets settings data received from port message
function setsettingsdata(msg){
	switch(msg.status){
	case "ui" :
		document.getElementById("include_theme").href = URL_THEME[msg.uitheme];
		document.getElementById("uitheme"+msg.uitheme).checked = true;
		if(msg.uistate.section) showsection(msg.uistate.section);
		if(msg.uistate.exporttype) document.getElementById("export_type").value = msg.uistate.exporttype;
	break;
	case "settings" :
		csp = msg.csp;
		blacklist = msg.urls;
		CSP_RULES.forEach(function(key){
			var menu = document.getElementById("csp_"+key);
			var circle = menu.parentElement.querySelector(".icon-circle");
			menu.value = getcspvalue(key,csp[key]);
			circle.className = "icon-circle "+CSP_COLORS[menu.value];
		});
		document.getElementById("mode"+msg.mode).checked = true;
		document.getElementById("contextmenu"+(!msg.options.contextmenu+1)).checked = true;
		document.getElementById("autoaddurl"+(!msg.options.autoaddurl+1)).checked = true;
		document.getElementById("autodelurl"+(!msg.options.autodelurl+1)).checked = true;
		document.getElementById("nburls").textContent = blacklist.length;
		urlstohtml(blacklist);
	break;
	case "clear" :
		hideElementAll(document.querySelectorAll(".msgbox"));
		showElement(document.getElementById("msg_delurl"));
		document.getElementById("nbdel").textContent = msg.result;
	break;
	case "import" :
	case "blacklistall" :
		hideElementAll(document.querySelectorAll(".msgbox"));
		showElement(document.getElementById("msg_addurl"));
		document.getElementById("nbadd").textContent = msg.result;
	break;}
}

/* -------------------- Main Process -------------------- */

//Global variables
var port = browser.runtime.Port;
var csp = {};
var blacklist = [];

window.onload = function(){
	//Connects port with background script
	port = browser.runtime.connect({name: PORT_SETTINGS});
	
	//Retrieves data from port
	port.onMessage.addListener(setsettingsdata);
	
	//Links
	setlinks();
	
	//Action menu
	setactionmenu();
	
	//About
	document.getElementById("version").textContent = MANIFEST["version"];
	document.getElementById("author").textContent = MANIFEST["author"];
	document.getElementById("description").textContent = MANIFEST["description"];
	playslideshow();
	
	//Content Security Policy
	CSP_RULES.forEach(function(key){
		document.getElementById("csp_"+key).onchange = function(){
			setcspvalue(key,parseInt(this.value));
			port.postMessage({status: "csp", csp: csp});
		};
	});
	
	//Mode & Options
	setradioboxes();
	
	//Blocked domains
	document.getElementById("addurl").onsubmit = function(event){
		event.preventDefault();
		addurl(this);
	};
	
	//File
	setimportexportforms();
	setclearblacklistform();
	
	//Footer
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

/* -------------------- PostProcess -------------------- */

window.onunload = function(){
	//Disconnects port
	port.disconnect();
};
