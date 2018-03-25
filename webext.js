/* -------------------- WebExtensions -------------------- */

//Browser compatibility
const CHROMIUM = !browser;
const FIREFOX = !!browser;
var browser = browser || chrome;
const ANDROID = !browser.windows;

/* -------------------- Classes -------------------- */

//Port communication between scripts
//Note: Firefox not firing Port.onDisconnect on window close
function PortConnect(){
//#	Variables
	this.data = [];
	var self = this;
	var count = 1;
	
//#	Public methods
	//Adds a connected port
	//args = {(mandatory) port, (optional) msgget, msgpost, disconnect}
	this.connect = function(args){
		var id = count++;
		this.data.push({
			id: id,
			port: args.port,
			msgpost: args.msgpost,
			disconnect: args.disconnect
		});
		if(args.msgget) args.port.onMessage.addListener(args.msgget);
		args.port.onDisconnect.addListener(function(){
			if(args.disconnect) args.disconnect();
			self.data.remove(val => (val.id==id));
		});
	};
	
	//Sends message to specified ports
	//args = {(mandatory) ports, (optional) tabid, msg} || ports
	this.send = function(args){
		var portmatch = (
			(args.ports && args.tabid)?
			port => (args.ports.contains(port.name) && args.tabid==port.sender.tab.id):
			(args.tabid)?
			port => (args.tabid==port.sender.tab.id):
			(args.ports)?
			port => args.ports.contains(port.name):
			port => args.contains(port.name)
		);
		this.data.removeAll(function(val){
			try{
				if(portmatch(val.port)){
					if(args.msg) val.port.postMessage(args.msg);
					else if(val.msgpost) val.port.postMessage(val.msgpost());
					else val.port.postMessage();}
				return false;}
			catch(error){
				if(val.disconnect) val.disconnect();
				return true;}
		});
	};
}

/* -------------------- Functions -------------------- */

//Opens a new tab
function opentab(tab,callback){
	switch(tab.index){
	case "next" :
		var winid = !ANDROID && (tab.windowId || browser.windows.WINDOW_ID_CURRENT);
		var currenttab = (winid)? {active: true, windowId: winid} : {active: true};
		browser.tabs.query(currenttab,function(tabs){
			tab.index = tabs[0].index+1;
			browser.tabs.create(tab,callback);
		});
	break;
	case "begin" :
		tab.index = 0;
		browser.tabs.create(tab,callback);
	break;
	case "end" :
		tab.index = 1000000;
		browser.tabs.create(tab,callback);
	break;
	default : browser.tabs.create(tab,callback);
	break;}
}

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

//Gets i18n message from internationalized files
//args = {(mandatory) msg, (optional) key} || msg
function geti18ndata(args){
	return browser.i18n.getMessage(
		(args.key)? "@"+args.key:
		(args.msg)? args.msg.replace(/\W/g,"_"):
		args.replace(/\W/g,"_")
	) || args.msg || args;
}

//Sets i18n message to specified DOM element
function seti18ndata(element){
	var data = element.getAttribute("data-i18n") || element.getAttribute("data");
	if(element.placeholder) element.placeholder = geti18ndata({key: data, msg: element.placeholder});
	if(element.textContent) element.textContent = geti18ndata({key: data, msg: element.textContent});
	if(element.title) element.title = geti18ndata({key: data, msg: element.title});
}
