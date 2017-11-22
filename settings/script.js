/* -------------------- Main Process -------------------- */

//Global variables
var port = browser.runtime.Port;

window.onload = function(){
	var csplist = ["all","img","media","popup","script","style","frame","connect"];
	var csp = {};
	
	//Connects port with background script
	port = browser.runtime.connect({name: "settings"});
	
	//Retrieves data from port
	port.onMessage.addListener(function(msg){
		csp = msg.csp;
		csplist.forEach(function(item){
			document.getElementById("csp-"+item).value = csp[item];
		});
		document.getElementById("cspapply"+msg.options.cspapply).checked = true;
		document.getElementById("urlsadd"+(!msg.options.urlsadd+1)).checked = true;
		document.getElementById("urlsdel"+(!msg.options.urlsdel+1)).checked = true;
		urlstohtml("urllist",msg.urls);
	});
	
	//About
	var manifest = browser.runtime.getManifest();
	document.getElementById("version").textContent = manifest.version;
	document.getElementById("author").textContent = manifest.author;
	document.querySelectorAll("a.link").forEach(function(link){
		link.onclick = function(event){
			event.preventDefault();
			browser.tabs.create({url: this.href});
		};
	});
		
	//Content Security Policy
	csplist.forEach(function(item){
		document.getElementById("csp-"+item).onchange = function(){
			csp[item] = parseInt(this.value);
			if(item!="all"){
				document.getElementById("csp-all").value = 0;
				csp["all"] = 0;}
			else csplist.forEach(function(item){
					var val = (item=="popup" && csp["all"]!=1)?2:csp["all"];
					document.getElementById("csp-"+item).value = val;
					csp[item] = val;
				});
			port.postMessage({status: "CSP", csp: csp});
		};
	});
	
	//Options
	document.getElementsByName("cspapply").forEach(function(radiobox){
		radiobox.onchange = function(){
			port.postMessage({status: "options", options: {cspapply: parseInt(this.value)}});
		};
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
	document.getElementById("addbtn").onclick = function(){
		var input = document.getElementById("addurl");
		var url = input.value;
		port.postMessage({status: "add", url: url});
		input.value = "";
	};
	
	//Footer
	document.getElementById("reload").onclick = function(){
		port.postMessage({status: "reload"});
	};
	document.getElementById("close").onclick = function(){
		browser.tabs.getCurrent(function(tab){
			browser.tabs.remove(tab.id);
		});
	};
};

//Disconnects port
window.onunload = function(){
	port.disconnect();
};

/* -------------------- Functions -------------------- */

//Action buttons
function getactionsbtns(url){
	var col = document.createElement("td");
	var button = document.createElement("span");
	button.className = "icon-false";
	button.title = "Delete";
	button.onclick = function(){
		port.postMessage({status: "delete", url: url});
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
