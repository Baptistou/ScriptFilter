/* -------------------- Classes -------------------- */

function PortConnect(){
	//Variables
	this.data = [];
	var self = this;
	
	//Public methods
	this.connect = function(obj){
		this.data.push({
			port: obj.port,
			msgpost: obj.msgpost
		});
		obj.port.onMessage.addListener(obj.msgget);
		obj.port.onDisconnect.addListener(function(){
			self.data.remove(val => (val.port.name==obj.port.name));
		});
	};
	
	this.send = function(list){
		this.data.removeAll(function(val){
			try{
				if(list.contains(val.port.name)) val.port.postMessage(val.msgpost());
				return false;}
			catch(error){
				return true;}
		});
	};
}

function JSBlocker(){
	this.csp = {};
	this.options = {};
	this.urls = [];
	this.current = null;
	this.trust = true;
	var untrusts = [];
	var self = this;
	
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
		self.options = storage.options || {};
		self.options = {
			cspapply: self.options.cspapply || 2,
			urlsadd: (self.options.urlsadd!=false),
			urlsdel: (self.options.urlsdel!=false)
		};
		self.urls = storage.urls || [];
		self.trust = (self.options.cspapply!=1 || storage.trust!=false);
		untrusts = (self.options.cspapply==3)?self.urls.slice(0):[];
		self.updateicon();
	});
	
	//Gets current url from focused tab
	browser.tabs.query({currentWindow: true, active: true},function(tabs){
		if(tabs.length) self.setcurrent(tabs[0]);
	});
	
	//Tab close
	browser.tabs.onRemoved.addListener(function(tabid,info){
		untrusts.remove(val => (val==tabid));
	});
	
	//Private methods
	var urltodomain = function(url){
		return (url.match(/:\/\/(.[^/]+)/) || [])[1] || url;
	};
	
	var urlsmatch = function(val1,val2){
		if(/[\*\?]/.test(val1)){
			var regex = val1.replaceAll(".","\\.").replaceAll("*",".*").replaceAll("?",".");
			return val2.match(regex);}
		else return (val1==val2);
	};
	
	//Public methods
	this.getcsp = function(){
		switch(this.csp.all){
		case 1 : return "";
		case 2 : return "default-src 'self';";
		case 3 : return "default-src 'none';";
		default :
			var str = "";
			if(this.csp.img!=1) str += "img-src "+((this.csp.img==2)?"'self'":"'none'")+";";
			if(this.csp.media!=1) str += "media-src "+((this.csp.media==2)?"'self'":"'none'")+";";
			if(this.csp.popup!=1) str += "sandbox allow-forms allow-same-origin allow-scripts;";
			if(this.csp.script!=1) str += "script-src "+((this.csp.script==2)?"'self'":"'none'")+";";
			if(this.csp.style!=1) str += "style-src "+((this.csp.style==2)?"'self'":"'none'")+";";
			if(this.csp.frame!=1){
				str += "child-src "+((this.csp.frame==2)?"'self'":"'none'")+";";
				str += "object-src "+((this.csp.frame==2)?"'self'":"'none'")+";";}
			if(this.csp.connect!=1) str += "connect-src "+((this.csp.connect==2)?"'self'":"'none'")+";";
			return str;
		break;}
	};
	
	this.setcsp = function(obj){
		for(var prop in obj) this.csp[prop] = obj[prop];
		browser.storage.local.set({csp: this.csp});
	};
	
	this.setoptions = function(obj){
		for(var prop in obj) this.options[prop] = obj[prop];
		if(obj.cspapply){
			if(obj.cspapply==3) untrusts = untrusts.concat(this.urls.slice(0));
			else untrusts.removeAll(val => !Number.isInteger(val));}
		this.trust = true;
		this.updateicon();
		browser.storage.local.set({options: this.options, trust: this.trust});
	};
	
	//Adds url to blacklist
	this.addurl = function(url){
		url = url.remove(/[+^=!:${}()|\[\]\/\\]/g);
		if(!isempty(url) && !this.urls.contains(url)){
			this.urls.push(url);
			if(this.options.cspapply==3) untrusts.push(url);
			browser.storage.local.set({urls: this.urls});}
	};
	
	//Deletes url from blacklist
	this.delurl = function(url){
		this.urls.remove(val => (val==url)) && browser.storage.local.set({urls: this.urls});
		if(this.options.cspapply==3) untrusts.remove(val => (val==url));
	};
	
	//Reloads all untrusted tabs
	this.reload = function(){
		untrusts.forEach(function(val){
			if(Number.isInteger(val)) browser.tabs.reload(val,{bypassCache: true});
		});
	};
	
	//Returns true if tabid is current focused tab
	this.iscurrent = function(tabid){
		return (this.current && this.current.id==tabid);
	};
	
	//Returns true if tab is trusted
	this.istrusted = function(tab){
		switch(this.options.cspapply){
		default :
		case 1 : return this.trust;
		case 2 : return !untrusts.find(val => (val==tab.id));
		case 3 : return !untrusts.find(val => urlsmatch(val,urltodomain(tab.url)));}
	};
	
	//Sets current focused tab
	this.setcurrent = function(tab){
		var domain = urltodomain(tab.url);
		this.current = {id: tab.id, url: domain};
		switch(this.options.cspapply){
		case 2 :
			this.trust = !untrusts.find(val => (val==tab.id));
			this.updateicon();
		break;
		case 3 :
			this.trust = !untrusts.find(val => urlsmatch(val,domain));
			this.updateicon();
		case 1 :
			var cspactive = !untrusts.find(val => (val==tab.id));
			if(!this.trust && cspactive && this.current.id!=settingsid){
				untrusts.push(this.current.id);
				browser.tabs.reload({bypassCache: true});}
			if(this.trust && !cspactive && this.current.id!=settingsid){
				untrusts.remove(val => (val==this.current.id));
				browser.tabs.reload({bypassCache: true});}
		break;}
	};
	
	//Switches Content Security Policy ON/OFF
	this.toggletrust = function(){
		this.trust = !this.trust;
		if(this.current.id!=settingsid){
			switch(this.options.cspapply){
			case 1 : browser.storage.local.set({trust: this.trust});
			break;
			case 2 :
				if(!this.trust) untrusts.push(this.current.id);
				else untrusts.remove(val => (val==this.current.id));
			break;
			case 3 :
				if(!this.trust){
					var val = this.urls.find(val => urlsmatch(val,this.current.url));
					if(this.options.urlsadd && !val) this.urls.push(this.current.url);
					untrusts.push(this.current.id);
					untrusts.push(val || this.current.url);}
				else{
					if(this.options.urlsdel) this.urls.remove(val => (val==this.current.url));
					untrusts.remove(val => (val==this.current.id));
					untrusts.remove(val => urlsmatch(val,this.current.url));}
				browser.storage.local.set({urls: this.urls});
			break;}
			browser.tabs.reload({bypassCache: true});}
		this.updateicon();
	};
	
	//Updates browserAction icon
	//Note: No Firefox Android support
	this.updateicon = function(){
		var actionbtn = {
			true: {title: "CSP OFF", icon: "icon-cspoff.png"},
			false: {title: "CSP ON", icon: "icon-cspon.png"}
		};
		browser.browserAction.setTitle({title: "ScriptFilter ("+actionbtn[this.trust].title+")"});
		if(!ANDROID) browser.browserAction.setIcon({path: "/images/"+actionbtn[this.trust].icon});
	};
}

/* -------------------- Main Process -------------------- */

//Global variables
var portcon = new PortConnect();
var jsblocker = new JSBlocker();
var settingsid = null;

//Browser action button click
browser.browserAction.onClicked.addListener(function(tab){
	jsblocker.toggletrust();
	portcon.send(["settings"]);
});

//Window focus
if(!ANDROID)
	browser.windows.onFocusChanged.addListener(function(winid){
		browser.tabs.query({windowId: winid, active: true},function(tabs){
			if(tabs.length) jsblocker.setcurrent(tabs[0]);
		});
	});

//Tab focus
browser.tabs.onActivated.addListener(function(info){
	browser.tabs.get(info.tabId,function(tab){
		jsblocker.setcurrent(tab);
	});
});

//Tab update
browser.tabs.onUpdated.addListener(function(tabid,info,tab){
	if(jsblocker.iscurrent(tabid)) jsblocker.setcurrent(tab);
});

//Blocking web requests with Content Security Policy
browser.webRequest.onHeadersReceived.addListener(
	function(info){
		if(info.tabId!=settingsid && !jsblocker.istrusted({id: info.tabId, url: info.url})){
			var CSP = {
				name: "Content-Security-Policy",
				value: jsblocker.getcsp()
			};
			if(CSP.value) info.responseHeaders.push(CSP);}
		return {responseHeaders: info.responseHeaders};
	},
	{urls: ["<all_urls>"], types: ["main_frame"]},
	["blocking","responseHeaders"]
);

//Script communication with content scripts
//Note: Port.onDisconnect not triggered on window close on Firefox
browser.runtime.onConnect.addListener(function(port){
	settingsid = port.sender.tab.id;
	portcon.connect({
		port: port,
		msgpost: function(){return {
			csp: jsblocker.csp,
			options: jsblocker.options,
			urls: jsblocker.urls.sort()
		}},
		msgget: function(msg){
			switch(msg.status){
			case "CSP" : jsblocker.setcsp(msg.csp);
			break;
			case "options" : jsblocker.setoptions(msg.options);
			break;
			case "add" : jsblocker.addurl(msg.url);
			break;
			case "delete" : jsblocker.delurl(msg.url);
			break
			case "reload" : jsblocker.reload();
			break;;}
			portcon.send(["settings"]);
		}
	});
	portcon.send(["settings"]);
});
