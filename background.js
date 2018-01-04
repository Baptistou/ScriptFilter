/* -------------------- Classes -------------------- */

function PortConnect(){
	//Variables
	this.data = [];
	var self = this;
	var count = 1;
	
	//Public methods
	this.connect = function(obj){
		var id = count++;
		this.data.push({
			id: id,
			port: obj.port,
			msgpost: obj.msgpost,
			disconnect: obj.disconnect
		});
		if(obj.msgget) obj.port.onMessage.addListener(obj.msgget);
		obj.port.onDisconnect.addListener(function(){
			if(obj.disconnect) obj.disconnect();
			self.data.remove(val => (val.id==id));
		});
	};
	
	this.send = function(list,message = null){
		this.data.removeAll(function(val){
			try{
				if(list.contains(val.port.name)){
					if(message) val.port.postMessage(message);
					else if(val.msgpost) val.port.postMessage(val.msgpost());
					else val.port.postMessage();}
				return false;}
			catch(error){
				if(val.disconnect) val.disconnect();
				return true;}
		});
	};
}

function CSPManager(){
	this.csp = {};
	this.mode = 1;
	this.options = {};
	this.urls = [];
	this.trust = true;
	this.currentid = null;
	this.settingsid = null;
	var self = this;
	var untrusts = [];
	
	//Retrieves data from local storage and from sync storage if available
	browser.storage.local.get(function(storage){
		self.csp = storage.csp || {
			all: 0,
			img: 1,
			media: 1,
			popup: 2,
			script: 3,
			style: 1,
			frame: 3,
			connect: 3
		};
		self.mode = storage.mode || 2;
		self.options = storage.options || {};
		self.options = {
			contextmenu: (!ANDROID && self.options.contextmenu!=false),
			urlsadd: (self.options.urlsadd!=false),
			urlsdel: (self.options.urlsdel!=false)
		};
		self.urls = storage.urls || [];
		self.trust = (self.mode!=1 || storage.trust!=false);
		untrusts = (self.mode==3)?self.urls.slice(0):[];
		if(self.options.contextmenu) createcontextmenu();
		self.updatebutton();
	});
	
	//Gets current url from focused tab
	browser.tabs.query({currentWindow: true, active: true},function(tabs){
		if(tabs.length) self.setcurrent(tabs.first());
	});
	
	//Tab close
	browser.tabs.onRemoved.addListener(function(tabid,info){
		untrusts.remove(val => (val==tabid));
	});
	
	//Private methods
	var csptostr = function(key,val){
		switch(val){
		case 1 : return "";
		case 2 : return key+" 'self';";
		case 3 : return key+" 'none';";}
	};
	
	var urltodomain = function(url){
		return (url.match(/:\/\/(.[^/]+)/) || [])[1];
	};
	
	var urlmatch = function(val1,val2){
		if(!(/[\*\?]/.test(val1)) || !val2) return (val1==val2);
		else return val2.match(val1.replaceAll(".","\\.").replaceAll("*",".*").replaceAll("?","."));
		
	};
	
	//Public methods
	this.getcsp = function(){
		if(!this.csp.all)
			return csptostr("img-src",this.csp.img)
			+ csptostr("media-src",this.csp.media)
			+ ((this.csp.popup==1)?"":CSP_SANDBOX_NOPOPUPS)
			+ csptostr("script-src",this.csp.script)
			+ csptostr("style-src",this.csp.style)
			+ csptostr("child-src",this.csp.frame)	//CSP 2-
			+ csptostr("frame-src",this.csp.frame)	//CSP 1+
			+ csptostr("worker-src",this.csp.frame)	//CSP 3+
			+ csptostr("object-src",this.csp.frame)
			+ csptostr("connect-src",this.csp.connect);
		else return csptostr("default-src",this.csp.all);
	};
	
	this.setcsp = function(obj){
		for(var prop in obj) this.csp[prop] = obj[prop];
		browser.storage.local.set({csp: this.csp});
	};
	
	this.setmode = function(val){
		this.mode = parseInt(val);
		if(this.mode==3) untrusts = untrusts.concat(this.urls.slice(0));
		else untrusts.removeAll(val => !Number.isInteger(val));
		if(this.options.contextmenu) updatecontextmenu("link");
		this.trust = true;
		this.updatebutton();
		browser.storage.local.set({mode: this.mode, trust: this.trust});
	};
	
	this.setoptions = function(obj){
		for(var prop in obj) this.options[prop] = obj[prop];
		if(obj.contextmenu==true) createcontextmenu();
		if(obj.contextmenu==false) removecontextmenu();
		browser.storage.local.set({options: this.options});
	};
	
	//Adds url to blacklist
	this.addurl = function(url){
		if(!url.match(/[\s+^=!:${}()|\[\]\/\\]/) && !this.urls.contains(url)){
			this.urls.push(url);
			if(this.mode==3) untrusts.push(url);
			browser.storage.local.set({urls: this.urls});}
	};
	
	//Deletes url from blacklist
	this.delurl = function(url){
		this.urls.remove(val => (val==url));
		if(this.mode==3) untrusts.removeAll(val => (val==url));
		browser.storage.local.set({urls: this.urls});
	};
	
	//Reloads all untrusted tabs
	this.reload = function(){
		untrusts.forEach(function(val){
			if(Number.isInteger(val)) browser.tabs.reload(val,{bypassCache: true});
		});
	};
	
	//Returns true if tab is trusted
	this.istrusted = function(tab){
		if(this.settingsid==tab.id) return true;
		switch(this.mode){
		case 1 : return this.trust;
		case 2 : return !untrusts.find(val => (val==tab.id));
		case 3 : return !untrusts.find(val => urlmatch(val,urltodomain(tab.url)));}
	};
	
	//Sets current focused tab
	this.setcurrent = function(tab){
		this.currentid = tab.id;
		switch(this.mode){
		case 2 :
			this.trust = !untrusts.find(val => (val==tab.id));
			this.updatebutton();
		break;
		case 3 :
			var domainurl = urltodomain(tab.url);
			if(!domainurl) break;
			this.trust = !untrusts.find(val => urlmatch(val,domainurl));
			this.updatebutton();
		case 1 :
			var cspoff = !untrusts.find(val => (val==tab.id));
			if(!this.trust && cspoff && this.settingsid!=tab.id){
				untrusts.push(tab.id);
				browser.tabs.reload(tab.id,{bypassCache: true});}
			if(this.trust && !cspoff && this.settingsid!=tab.id){
				untrusts.remove(val => (val==tab.id));
				browser.tabs.reload(tab.id,{bypassCache: true});}
		break;}
	};
	
	//Sets trust to browser/tab/domain
	this.settrust = function(tab){
		if(this.settingsid!=tab.id || this.mode==1){
			this.trust = true;
			switch(this.mode){
			case 1 : browser.storage.local.set({trust: this.trust});
			break;
			case 2 : untrusts.remove(val => (val==tab.id));
			break;
			case 3 :
				var domainurl = urltodomain(tab.url);
				if(this.options.urlsdel) this.urls.remove(val => (val==domainurl));
				untrusts.remove(val => (val==tab.id));
				untrusts.removeAll(val => urlmatch(val,domainurl));
				browser.storage.local.set({urls: this.urls});
			break;}
			this.updatebutton();}
	};
	
	//Sets untrust to browser/tab/domain
	this.setuntrust = function(tab){
		if(this.settingsid!=tab.id || this.mode==1){
			this.trust = false;
			switch(this.mode){
			case 1 : browser.storage.local.set({trust: this.trust});
			break;
			case 2 : untrusts.push(tab.id);
			break;
			case 3 :
				var domainurl = urltodomain(tab.url);
				if(!domainurl) break;
				var val = this.urls.find(val => urlmatch(val,domainurl));
				if(!val && this.options.urlsadd) this.urls.push(domainurl);
				untrusts.push(tab.id);
				untrusts.push(val || domainurl);
				browser.storage.local.set({urls: this.urls});
			break;}
			this.updatebutton();}
	};
	
	//Switches Content Security Policy ON/OFF
	this.toggletrust = function(tab){
		if(this.trust) this.setuntrust(tab);
		else this.settrust(tab);
		if(this.settingsid!=tab.id) browser.tabs.reload(tab.id,{bypassCache: true});
	};
	
	//Updates browserAction button
	//Note: No Firefox Android support for setIcon and setBadge
	this.updatebutton = function(){
		var actionbtn = {
			true: {title: "CSP OFF", icon: "icon-cspoff.png"},
			false: {title: "CSP ON", icon: "icon-cspon.png"}
		};
		browser.browserAction.setTitle({title: "ScriptFilter ("+actionbtn[this.trust].title+")"});
		if(!ANDROID) browser.browserAction.setIcon({path: "/images/"+actionbtn[this.trust].icon});
		if(this.options.contextmenu) updatecontextmenu("page");
	};
}

/* -------------------- Main Process -------------------- */

//Global variables
var portcon = new PortConnect();
var cspman = new CSPManager();

//Browser action button click
browser.browserAction.onClicked.addListener(function(tab){
	cspman.toggletrust(tab);
	portcon.send(["settings"]);
});

//OptionsPage browserAction context menu
//Note: Firefox doesn't have context menu to OptionsPage.
//Note: No Firefox 52- support for ContextType.BROWSER_ACTION.
//Note: openOptionsPage() issue on Firefox and Opera + no Firefox Android support.
if(FIREFOX && !ANDROID && browser.contextMenus.ContextType.BROWSER_ACTION)
	browser.contextMenus.create({
		id: "option",
		title: geti18ndata("Settings"),
		contexts: ["browser_action"]
	});

//Context menu click
//Note: No Firefox Android support for browser.contextMenus
//Note: Firefox creates new tab with url "about:blank"
if(!ANDROID)
	browser.contextMenus.onClicked.addListener(function(info,tab){
		switch(info.menuItemId){
		case "option" : browser.runtime.openOptionsPage();
		break;
		case "page" :
			cspman.toggletrust(tab);
			portcon.send(["settings"]);
		break;
		case "link" :
			opentab({url: info.linkUrl, index: "next"},function(tab){
				tab.url = info.linkUrl;
				if(cspman.istrusted(tab)) cspman.setuntrust(tab);
				portcon.send(["settings"]);
			});
		break;}
	});

//Window focus
if(!ANDROID)
	browser.windows.onFocusChanged.addListener(function(winid){
		browser.tabs.query({windowId: winid, active: true},function(tabs){
			if(tabs.length) cspman.setcurrent(tabs.first());
		});
	});

//Tab focus
browser.tabs.onActivated.addListener(function(info){
	browser.tabs.get(info.tabId,function(tab){
		cspman.setcurrent(tab);
	});
});

//Tab update
browser.tabs.onUpdated.addListener(function(tabid,info,tab){
	if(cspman.currentid==tabid) cspman.setcurrent(tab);
});

//Blocking web requests with Content Security Policy
//Note: Chromium PDF Viewer Plugin not working with CSP sandbox
var CSP_SANDBOX_NOPOPUPS = "sandbox allow-forms allow-orientation-lock allow-pointer-lock"
	+ "allow-presentation allow-same-origin allow-scripts allow-top-navigation;";
browser.webRequest.onHeadersReceived.addListener(
	function(info){
		if(!cspman.istrusted({id: info.tabId, url: info.url})){
			var CSP = cspman.getcsp();
			if(CHROMIUM && CSP.contains("sandbox") && info.responseHeaders.find(
					val => (val.name=="Content-Type" && val.value=="application/pdf")
				)) CSP = CSP.remove(CSP_SANDBOX_NOPOPUPS);
			if(CSP) info.responseHeaders.push({name: "Content-Security-Policy", value: CSP});}
		return {responseHeaders: info.responseHeaders};
	},
	{urls: ["<all_urls>"], types: ["main_frame"]},
	["blocking","responseHeaders"]
);

//Script communication with content scripts
//Note: Port.onDisconnect not triggered on window close on Firefox
browser.runtime.onConnect.addListener(function(port){
	cspman.settingsid = port.sender.tab.id;
	portcon.connect({
		port: port,
		msgpost: function(){return {
			csp: cspman.csp,
			mode: cspman.mode,
			options: cspman.options,
			urls: cspman.urls.sort()
		}},
		msgget: function(msg){
			switch(msg.status){
			case "CSP" : cspman.setcsp(msg.csp);
			break;
			case "mode" : cspman.setmode(msg.mode);
			break;
			case "options" : cspman.setoptions(msg.options);
			break;
			case "addurl" : cspman.addurl(msg.url);
			break;
			case "delurl" : cspman.delurl(msg.url);
			break
			case "reload" : cspman.reload();
			break;;}
			portcon.send(["settings"]);
		},
		disconnect: function(){cspman.settingsid = null;}
	});
	portcon.send(["settings"]);
});

/* -------------------- Functions -------------------- */

//Internationalization
var i18ncontextmenu = {
	page: {
		true: geti18ndata({key: "contextmenu_page1", msg: "Switch CSP ON"}),
		false: geti18ndata({key: "contextmenu_page2", msg: "Switch CSP OFF"})
	},
	link: geti18ndata({key: "contextmenu_link", msg: "Open link in new tab with CSP ON"})
};

//Creates context menu items
function createcontextmenu(){
	browser.contextMenus.create({
		id: "page",
		title: i18ncontextmenu["page"][cspman.trust],
		contexts: ["page"]
	});
	browser.contextMenus.create({
		id: "link",
		title: i18ncontextmenu["link"],
		contexts: ["link"],
		enabled: (cspman.mode!=1)
	});
};

//Updates context menu item
function updatecontextmenu(menuid){
	switch(menuid){
	case "page" : browser.contextMenus.update("page",{title: i18ncontextmenu["page"][cspman.trust]});
	break;
	case "link" : browser.contextMenus.update("link",{enabled: (cspman.mode!=1)});
	break;}
};

//Removes context menu items
function removecontextmenu(){
	browser.contextMenus.remove("page");
	browser.contextMenus.remove("link");
};
