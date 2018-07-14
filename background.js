/* -------------------- PreProcess -------------------- */

//Global constants
const PORT_SETTINGS = "settings";
const MODE_ALL=1, MODE_TAB=2, MODE_URL=3;
const CSP_CUSTOM=0, CSP_ENABLE=1, CSP_RESTRICT_EXTERNAL=2, CSP_RESTRICT_UNSAFE=3, CSP_DISABLE=4;
const THEME_LIGHT=1, THEME_DARK=2;
const REG_DOMAINURL = /^[\.\*\?a-z0-9_-]+$/;
const BROWSERACTION_TITLE = {true: "ScriptFilter (OFF)", false: "ScriptFilter (ON)"};
const BROWSERACTION_ICON = {true: "/images/icon-cspoff.png", false: "/images/icon-cspon.png"};
const CONTEXTMENU_OPTION = "option", CONTEXTMENU_PAGE = "page", CONTEXTMENU_LINK = "link";
const CONTEXTMENU_PAGE_TITLE = {
	true: geti18ndata({key: "contextmenu_page1", msg: "Enable CSP"}),
	false: geti18ndata({key: "contextmenu_page2", msg: "Disable CSP"})
};
const CONTEXTMENU_LINK_TITLE = geti18ndata({key: "contextmenu_link", msg: "Open link in new tab with CSP"});
const CSP_SANDBOX_NOPOPUPS = "sandbox allow-forms allow-orientation-lock allow-pointer-lock"
	+" allow-presentation allow-same-origin allow-scripts allow-top-navigation;";

/* -------------------- Classes -------------------- */

function CSPManager(){
//#	Variables
	this.csp = {};
	this.mode = MODE_TAB;
	this.options = {};
	this.ui = {};
	this.urls = [];
	this.trust = true;
	this.settingsid = null;
	var self = this;
	var untrusts = [];
	
//#	Constructors
	//Retrieves data from local storage
	browser.storage.local.get(function(storage){
		self.csp = storage.csp || {
			all: CSP_CUSTOM,
			img: CSP_ENABLE,
			media: CSP_ENABLE,
			style: CSP_ENABLE,
			script: CSP_DISABLE,
			popup: CSP_DISABLE,
			frame: CSP_DISABLE,
			connect: CSP_DISABLE
		};
		self.mode = storage.mode || MODE_TAB;
		self.options = storage.options || {};
		self.options = {
			contextmenu: (!ANDROID && self.options.contextmenu!=false),
			autoaddurl: (self.options.autoaddurl!=false),
			autodelurl: (self.options.autodelurl!=false)
		};
		self.ui = storage.ui || {
			theme: THEME_LIGHT,
			settings: {section: null, exporttype: null}
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
	
//#	Public methods
	//Getters & Setters
	this.getcsp = function(){
		if(!this.csp.all)
			return csptostr("img-src",this.csp.img)
			+ csptostr("media-src",this.csp.media)
			+ csptostr("style-src",this.csp.style)
			+ csptostr("font-src",this.csp.style)
			+ csptostr("script-src",this.csp.script)
			+ ((this.csp.popup!=CSP_ENABLE)? CSP_SANDBOX_NOPOPUPS : "")
			+ csptostr("frame-src",this.csp.frame)
			+ csptostr("worker-src",this.csp.frame)
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
		else untrusts = untrusts.filter(Number.isInteger);
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
	
	this.setui = function(page,obj){
		if(obj.uitheme) this.ui.theme = obj.uitheme;
		else for(var prop in obj.uistate) this.ui[page][prop] = obj.uistate[prop];
		browser.storage.local.set({ui: this.ui});
	};
	
	//Adds url to blacklist
	this.addurl = function(url){
		if(url.match(REG_DOMAINURL) && !this.urls.contains(url)){
			this.urls.push(url);
			if(this.mode==MODE_URL) untrusts.push(url);
			browser.storage.local.set({urls: this.urls});}
	};
	
	//Adds all urls to blacklist
	this.addurlall = function(list){
		var urls = list.unique().filter(url => (url && url.match(REG_DOMAINURL) && !this.urls.find(val => urlmatch(val,url))));
		this.urls = this.urls.concat(urls);
		if(this.mode==MODE_URL) untrusts = untrusts.concat(urls);
		browser.storage.local.set({urls: this.urls});
		return urls.length;
	};
	
	//Removes url from blacklist
	this.delurl = function(url){
		this.urls.remove(val => (val==url));
		if(this.mode==MODE_URL) untrusts = untrusts.filter(val => (val!=url));
		browser.storage.local.set({urls: this.urls});
	};
	
	//Clears blacklist
	this.clear = function(){
		var length = this.urls.length;
		this.urls = [];
		if(this.mode==MODE_URL) untrusts = untrusts.filter(Number.isInteger);
		browser.storage.local.set({urls: this.urls});
		return length;
	};
	
	//Reloads all untrusted tabs
	this.reload = function(){
		browser.tabs.query({},function(tabs){
			untrusts = untrusts.filter(val => (!Number.isInteger(val) || tabs.find(tab => (tab.id==val))));
			tabs.filter(tab => (tab.id!=self.settingsid))
				.forEach(tab => browser.tabs.reload(tab.id,{bypassCache: true}));
		});
	};
	
	//Returns true if tab is trusted
	this.istrusted = function(tab){
		switch(this.mode){
		case MODE_ALL : return this.trust;
		case MODE_TAB : return (this.settingsid==tab.id || !untrusts.find(val => (val==tab.id)));
		case MODE_URL : return (this.settingsid==tab.id || !untrusts.find(val => urlmatch(val,urltodomain(tab.url))));}
	};
	
	//Sets current focused or updated tab
	this.setcurrent = function(tab){
		switch(this.mode){
		case MODE_TAB :
			this.trust = !untrusts.find(val => (val==tab.id));
			this.updatebutton();
		break;
		case MODE_URL :
			var domainurl = urltodomain(tab.url);
			this.trust = !domainurl || !untrusts.find(val => urlmatch(val,domainurl));
			this.updatebutton();
			if(!domainurl) break;
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
		if(this.mode==MODE_ALL || this.settingsid!=tab.id){
			this.trust = true;
			switch(this.mode){
			case MODE_ALL : browser.storage.local.set({trust: this.trust});
			break;
			case MODE_TAB : untrusts.remove(val => (val==tab.id));
			break;
			case MODE_URL :
				var domainurl = urltodomain(tab.url);
				if(this.options.autodelurl) this.urls.remove(val => (val==domainurl));
				untrusts = untrusts.filter(val => (val!=tab.id && !urlmatch(val,domainurl)));
				browser.storage.local.set({urls: this.urls});
			break;}}
	};
	
	//Sets untrust to browser/tab/domain
	this.setuntrust = function(tab){
		if(this.mode==MODE_ALL || this.settingsid!=tab.id){
			this.trust = false;
			switch(this.mode){
			case MODE_ALL : browser.storage.local.set({trust: this.trust});
			break;
			case MODE_TAB : untrusts.push(tab.id);
			break;
			case MODE_URL :
				var domainurl = urltodomain(tab.url);
				if(domainurl){
					var val = this.urls.find(val => urlmatch(val,domainurl));
					if(!val && this.options.autoaddurl) this.urls.push(domainurl);
					untrusts.push(tab.id);
					untrusts.push(val || domainurl);
					browser.storage.local.set({urls: this.urls});}
			break;}}
	};
	
	//Switches Content Security Policy ON/OFF
	this.toggletrust = function(tab){
		if(this.trust) this.setuntrust(tab);
		else this.settrust(tab);
		this.updatebutton();
		if(this.settingsid!=tab.id) browser.tabs.reload(tab.id,{bypassCache: true});
	};
	
	//Updates browserAction button
	//Note: No Firefox Android support for setIcon()
	this.updatebutton = function(){
		browser.browserAction.setTitle({title: BROWSERACTION_TITLE[this.trust]});
		if(!ANDROID) browser.browserAction.setIcon({path: BROWSERACTION_ICON[this.trust]});
		if(this.options.contextmenu) updatecontextmenu(CONTEXTMENU_PAGE);
	};
}

/* -------------------- Functions -------------------- */

//Converts CSP key+value to string
function csptostr(key,val){
	switch(val){
	case CSP_ENABLE : return "";
	case CSP_RESTRICT_EXTERNAL : return key+" 'self' blob: data: 'unsafe-inline' 'unsafe-eval';";
	case CSP_RESTRICT_UNSAFE : return key+" 'self';";
	case CSP_DISABLE : return key+" 'none';";}
}

//Converts URL to domain name
function urltodomain(url){
	var result = url.toLowerCase().match(/https?:\/\/(.[^\/]+)/);
	return (result && result[1] || "");
}

//Returns true if the 2 domain urls matches
function urlmatch(url1,url2){
	return (/[\*\?]/.test(url1) && url2)?
		url2.match("^"+url1.replaceAll(".","\\.").replaceAll("*",".*").replaceAll("?",".")+"$"):
		(url1==url2);
}

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
}

//Updates context menu item
function updatecontextmenu(menuid){
	switch(menuid){
	case CONTEXTMENU_PAGE : browser.contextMenus.update(CONTEXTMENU_PAGE,{title: CONTEXTMENU_PAGE_TITLE[cspman.trust]});
	break;
	case CONTEXTMENU_LINK : browser.contextMenus.update(CONTEXTMENU_LINK,{enabled: (cspman.mode!=MODE_ALL)});
	break;}
}

//Removes context menu items
function removecontextmenu(){
	browser.contextMenus.remove(CONTEXTMENU_PAGE);
	browser.contextMenus.remove(CONTEXTMENU_LINK);
}

//Returns true if HTTP request is opened by Chromium PDF Viewer
function ischromiumpdf(info){
	return (CHROMIUM && info.responseHeaders.find(val => (val.name=="Content-Type" && val.value=="application/pdf")));
}

//Adds all tab urls to blacklist
function blacklistall(){
	browser.tabs.query({},function(tabs){
		var urls = tabs.map(tab => urltodomain(tab.url));
		portcon.send({port: PORT_SETTINGS, msg: {status: "blacklistall", result: cspman.addurlall(urls)}});
		portcon.send(PORT_SETTINGS);
	});
}

//Sets trust to all open tabs
function trustall(){
	if(cspman.mode!=MODE_ALL)
		browser.tabs.query({},function(tabs){
			tabs.filter(tab => !cspman.istrusted(tab))
				.forEach(function(tab){
					cspman.settrust(tab);
					browser.tabs.reload(tab.id,{bypassCache: true});
				});
			portcon.send(PORT_SETTINGS);
		});
	else{
		cspman.settrust();
		cspman.updatebutton()};
}

//Sets untrust to all open tabs
function untrustall(){
	if(cspman.mode!=MODE_ALL)
		browser.tabs.query({},function(tabs){
			tabs.filter(tab => (cspman.settingsid!=tab.id && cspman.istrusted(tab)))
				.forEach(function(tab){
					cspman.setuntrust(tab);
					browser.tabs.reload(tab.id,{bypassCache: true});
				});
			portcon.send(PORT_SETTINGS);
		});
	else{
		cspman.setuntrust();
		cspman.updatebutton();}
}

//Gets settings data received from port message
function getsettingsdata(msg){
	switch(msg.status){
	case "csp" : cspman.setcsp(msg.csp);
	break;
	case "mode" : cspman.setmode(msg.mode);
	break;
	case "options" : cspman.setoptions(msg.options);
	break;
	case "ui" : cspman.setui(PORT_SETTINGS,msg);
	break;
	case "addurl" : cspman.addurl(msg.url);
	break;
	case "delurl" : cspman.delurl(msg.url);
	break;
	case "import" : portcon.send({port: PORT_SETTINGS, msg: {status: "import", result: cspman.addurlall(msg.urls)}});
	break;
	case "clear" : portcon.send({port: PORT_SETTINGS, msg: {status: "clear", result: cspman.clear()}});
	break;
	case "blacklistall" : blacklistall();
	break;
	case "untrustall" : untrustall();
	break;
	case "trustall" : trustall();
	break;
	case "reload" : cspman.reload();
	break;}
	portcon.send(PORT_SETTINGS);
}

/* -------------------- Main Process -------------------- */

//Global variables
var portcon = new PortConnect();
var cspman = new CSPManager();

//Browser action button click
browser.browserAction.onClicked.addListener(function(tab){
	cspman.toggletrust(tab);
	portcon.send(PORT_SETTINGS);
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
		portcon.send(PORT_SETTINGS);
	break;
	case CONTEXTMENU_LINK :
		opentab({url: info.linkUrl, index: "next", active: false},function(tab){
			tab.url = info.linkUrl;
			if(cspman.istrusted(tab)){
				cspman.setuntrust(tab);
				cspman.updatebutton();}
			portcon.send(PORT_SETTINGS);
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
	cspman.setcurrent(tab);
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
			status: "settings",
			csp: cspman.csp,
			mode: cspman.mode,
			options: cspman.options,
			urls: cspman.urls.sort()
		}},
		msgget: getsettingsdata,
		disconnect: function(){ cspman.settingsid = null }
	});
	portcon.send({
		port: PORT_SETTINGS,
		msg: {status: "ui", uitheme: cspman.ui.theme, uistate: cspman.ui[PORT_SETTINGS]}
	});
	portcon.send(PORT_SETTINGS);
});
