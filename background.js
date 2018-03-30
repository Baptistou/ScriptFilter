/* -------------------- PreProcess -------------------- */

//Global constants
const PORT_SETTINGS = "settings";
const MODE_ALL=1, MODE_TAB=2, MODE_URL=3;
const CSP_ENABLE=1, CSP_RESTRICT=2, CSP_DISABLE=3;
const BROWSERACTION_TITLE = {true: "ScriptFilter (OFF)", false: "ScriptFilter (ON)"};
const BROWSERACTION_ICON = {true: "/images/icon-cspoff.png", false: "/images/icon-cspon.png"};
const CONTEXTMENU_OPTION = "option", CONTEXTMENU_PAGE = "page", CONTEXTMENU_LINK = "link";
const CONTEXTMENU_PAGE_TITLE = {
	true: geti18ndata({key: "contextmenu_page1", msg: "Enable CSP"}),
	false: geti18ndata({key: "contextmenu_page2", msg: "Disable CSP"})
};
const CONTEXTMENU_LINK_TITLE = geti18ndata({key: "contextmenu_link", msg: "Open link in new tab with CSP"});
const REG_DOMAINURL = /^[\.\*\?a-z0-9_-]+$/;
const CSP_SANDBOX_NOPOPUPS = "sandbox allow-forms allow-orientation-lock allow-pointer-lock"
	+" allow-presentation allow-same-origin allow-scripts allow-top-navigation;";

/* -------------------- Classes -------------------- */

function CSPManager(){
//#	Variables
	this.csp = {};
	this.mode = MODE_TAB;
	this.options = {};
	this.urls = [];
	this.trust = true;
	this.currentid = null;
	this.settingsid = null;
	var self = this;
	var untrusts = [];
	
//#	Constructors
	//Retrieves data from local storage and from sync storage if available
	browser.storage.local.get(function(storage){
		self.csp = storage.csp || {
			all: 0,
			img: CSP_ENABLE,
			media: CSP_ENABLE,
			popup: CSP_DISABLE,
			script: CSP_DISABLE,
			style: CSP_ENABLE,
			frame: CSP_DISABLE,
			connect: CSP_DISABLE
		};
		self.mode = storage.mode || MODE_TAB;
		self.options = storage.options || {};
		self.options = {
			contextmenu: (!ANDROID && self.options.contextmenu!=false),
			urlsadd: (self.options.urlsadd!=false),
			urlsdel: (self.options.urlsdel!=false)
		};
		self.urls = storage.urls || [];
		self.trust = (self.mode!=MODE_ALL || storage.trust!=false);
		untrusts = (self.mode==MODE_URL)? self.urls.slice(0) : [];
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
	
//#	Public methods
	//Getters & Setters
	this.getcsp = function(){
		if(!this.csp.all)
			return csptostr("img-src",this.csp.img)
			+ csptostr("media-src",this.csp.media)
			+ ((this.csp.popup!=CSP_ENABLE)? CSP_SANDBOX_NOPOPUPS : "")
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
		if(this.mode==MODE_URL) untrusts = untrusts.concat(this.urls.slice(0));
		else untrusts.removeAll(val => !Number.isInteger(val));
		if(this.options.contextmenu) updatecontextmenu(CONTEXTMENU_LINK);
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
		if(url.match(REG_DOMAINURL) && !this.urls.contains(url)){
			this.urls.push(url);
			if(this.mode==MODE_URL) untrusts.push(url);
			browser.storage.local.set({urls: this.urls});}
	};
	
	//Removes url from blacklist
	this.delurl = function(url){
		this.urls.remove(val => (val==url));
		if(this.mode==MODE_URL) untrusts.removeAll(val => (val==url));
		browser.storage.local.set({urls: this.urls});
	};
	
	//Imports blacklist
	this.importurls = function(urls){
		urls.removeAll(val => (!val.match(REG_DOMAINURL) || this.urls.contains(val)));
		this.urls = this.urls.concat(urls);
		if(this.mode==MODE_URL) untrusts = untrusts.concat(urls);
		browser.storage.local.set({urls: this.urls});
	};
	
	//Clears blacklist
	this.clear = function(){
		this.urls = [];
		if(this.mode==MODE_URL) untrusts.removeAll(val => !Number.isInteger(val));
		browser.storage.local.set({urls: this.urls});
	};
	
	//Reloads all untrusted tabs
	this.reload = function(){
		untrusts
			.filter(val => Number.isInteger(val))
			.forEach(val => browser.tabs.reload(val,{bypassCache: true}));
	};
	
	//Returns true if tab is trusted
	this.istrusted = function(tab){
		if(this.settingsid==tab.id) return true;
		switch(this.mode){
		case MODE_ALL : return this.trust;
		case MODE_TAB : return !untrusts.find(val => (val==tab.id));
		case MODE_URL : return !untrusts.find(val => urlmatch(val,urltodomain(tab.url)));}
	};
	
	//Sets current focused tab
	this.setcurrent = function(tab){
		this.currentid = tab.id;
		switch(this.mode){
		case MODE_TAB :
			this.trust = !untrusts.find(val => (val==tab.id));
			this.updatebutton();
		break;
		case MODE_URL :
			var domainurl = urltodomain(tab.url);
			if(!domainurl) break;
			this.trust = !untrusts.find(val => urlmatch(val,domainurl));
			this.updatebutton();
		case MODE_ALL :
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
		if(this.settingsid!=tab.id || this.mode==MODE_ALL){
			this.trust = true;
			switch(this.mode){
			case MODE_ALL : browser.storage.local.set({trust: this.trust});
			break;
			case MODE_TAB : untrusts.remove(val => (val==tab.id));
			break;
			case MODE_URL :
				var domainurl = urltodomain(tab.url);
				if(this.options.urlsdel) this.urls.remove(val => (val==domainurl));
				untrusts.removeAll(val => (val==tab.id || urlmatch(val,domainurl)));
				browser.storage.local.set({urls: this.urls});
			break;}
			this.updatebutton();}
	};
	
	//Sets untrust to browser/tab/domain
	this.setuntrust = function(tab){
		if(this.settingsid!=tab.id || this.mode==MODE_ALL){
			this.trust = false;
			switch(this.mode){
			case MODE_ALL : browser.storage.local.set({trust: this.trust});
			break;
			case MODE_TAB : untrusts.push(tab.id);
			break;
			case MODE_URL :
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
	//Note: No Firefox Android support for setIcon()
	this.updatebutton = function(){
		browser.browserAction.setTitle({title: BROWSERACTION_TITLE[this.trust]});
		if(!ANDROID) browser.browserAction.setIcon({path: BROWSERACTION_ICON[this.trust]});
		if(this.options.contextmenu) updatecontextmenu(CONTEXTMENU_PAGE);
	};
	
//#	Private methods
	var csptostr = function(key,val){
		switch(val){
		case CSP_ENABLE : return "";
		case CSP_RESTRICT : return key+" 'self';";
		case CSP_DISABLE : return key+" 'none';";}
	};
	
	var urltodomain = function(url){
		return (url.match(/:\/\/(.[^/]+)/) || [])[1];
	};
	
	var urlmatch = function(val1,val2){
		return (/[\*\?]/.test(val1) && val2)?
			val2.match(val1.replaceAll(".","\\.").replaceAll("*",".*").replaceAll("?",".")):
			(val1==val2);
	};
}

/* -------------------- Functions -------------------- */

//Creates context menu items
function createcontextmenu(){
	browser.contextMenus.create({
		id: CONTEXTMENU_PAGE,
		title: CONTEXTMENU_PAGE_TITLE[cspman.trust],
		contexts: ["page"]
	});
	browser.contextMenus.create({
		id: CONTEXTMENU_LINK,
		title: CONTEXTMENU_LINK_TITLE,
		contexts: ["link"],
		enabled: (cspman.mode!=MODE_ALL)
	});
};

//Updates context menu item
function updatecontextmenu(menuid){
	switch(menuid){
	case CONTEXTMENU_PAGE :
		browser.contextMenus.update(CONTEXTMENU_PAGE,{title: CONTEXTMENU_PAGE_TITLE[cspman.trust]});
	break;
	case CONTEXTMENU_LINK :
		browser.contextMenus.update(CONTEXTMENU_LINK,{enabled: (cspman.mode!=MODE_ALL)});
	break;}
};

//Removes context menu items
function removecontextmenu(){
	browser.contextMenus.remove(CONTEXTMENU_PAGE);
	browser.contextMenus.remove(CONTEXTMENU_LINK);
};

//Returns true if HTTP request is opened by Chromium PDF Viewer
function ischromiumpdf(info){
	return (CHROMIUM && info.responseHeaders.find(val => (val.name=="Content-Type" && val.value=="application/pdf")));
}

/* -------------------- Main Process -------------------- */

//Global variables
var portcon = new PortConnect();
var cspman = new CSPManager();

//Browser action button click
browser.browserAction.onClicked.addListener(function(tab){
	cspman.toggletrust(tab);
	portcon.send([PORT_SETTINGS]);
});

//OptionsPage browserAction context menu
//Note: Firefox doesn't have browserAction context menu to open OptionsPage
//Note: No Firefox 52- support for ContextType.BROWSER_ACTION
//Note: No Firefox Android 56- support + Firefox and Opera issue with openOptionsPage()
if(FIREFOX && !ANDROID && browser.contextMenus.ContextType.BROWSER_ACTION)
browser.contextMenus.create({
	id: CONTEXTMENU_OPTION,
	title: geti18ndata("Settings"),
	contexts: ["browser_action"]
});

//Context menu click
//Note: No Firefox Android support
//Note: Firefox creates new tab with url "about:blank"
if(!ANDROID)
browser.contextMenus.onClicked.addListener(function(info,tab){
	switch(info.menuItemId){
	case CONTEXTMENU_OPTION : browser.runtime.openOptionsPage();
	break;
	case CONTEXTMENU_PAGE :
		cspman.toggletrust(tab);
		portcon.send([PORT_SETTINGS]);
	break;
	case CONTEXTMENU_LINK :
		opentab({url: info.linkUrl, index: "next"},function(tab){
			tab.url = info.linkUrl;
			if(cspman.istrusted(tab)) cspman.setuntrust(tab);
			portcon.send([PORT_SETTINGS]);
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
	browser.tabs.get(info.tabId,tab => cspman.setcurrent(tab));
});

//Tab update
browser.tabs.onUpdated.addListener(function(tabid,info,tab){
	if(cspman.currentid==tabid) cspman.setcurrent(tab);
});

//Blocking web requests with Content Security Policy
//Note: Chromium PDF Viewer Plugin issue with CSP sandbox
browser.webRequest.onHeadersReceived.addListener(
	function(info){
		if(!cspman.istrusted({id: info.tabId, url: info.url})){
			var csp = cspman.getcsp();
			if(csp.contains(CSP_SANDBOX_NOPOPUPS) && ischromiumpdf(info)) csp = csp.remove(CSP_SANDBOX_NOPOPUPS);
			if(csp) info.responseHeaders.push({name: "Content-Security-Policy", value: csp});}
		return {responseHeaders: info.responseHeaders};
	},
	{urls: ["<all_urls>"], types: ["main_frame"]},
	["blocking","responseHeaders"]
);

//Port communication between scripts
browser.runtime.onConnect.addListener(function(port){
	cspman.settingsid = port.sender.tab.id;
	portcon.connect({
		port: port,
		msgpost: function(){ return {
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
			case "import" : cspman.importurls(msg.urls);
			break
			case "clear" : cspman.clear();
			break
			case "reload" : cspman.reload();
			break;}
			portcon.send([PORT_SETTINGS]);
		},
		disconnect: function(){ cspman.settingsid = null }
	});
	portcon.send([PORT_SETTINGS]);
});
