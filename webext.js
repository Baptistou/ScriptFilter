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
		var portmatch = (args.ports && args.tabid)?
			port => (args.ports.contains(port.name) && args.tabid==port.sender.tab.id):
			(args.tabid)? port => (args.tabid==port.sender.tab.id):
			(args.ports)? port => args.ports.contains(port.name):
			port => args.contains(port.name);
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
//args = {(optional) url, windowId, index, active, pinned}
function opentab(args,callback){
	switch(args && args.index){
	case "next" :
		var currenttab = (!ANDROID)?
			{active: true, windowId: args.windowId || browser.windows.WINDOW_ID_CURRENT}:
			{active: true};
		browser.tabs.query(currenttab,function(tabs){
			args.index = tabs[0].index+1;
			browser.tabs.create(args,callback);
		});
	break;
	case "begin" :
		args.index = 0;
		browser.tabs.create(args,callback);
	break;
	case "end" :
		args.index = 1000000;
		browser.tabs.create(args,callback);
	break;
	default : browser.tabs.create(args,callback);
	break;}
}

//Focuses specified tab
//args = {(mandatory) id, windowId}
function focustab(args){
	if(!ANDROID) browser.windows.update(args.windowId,{focused: true});
	browser.tabs.update(args.id,{active: true});
}

//Closes specified tab and its window
//Note: about:config --> browser.tabs.closeWindowWithLastTab
//args = {(mandatory) id, windowId}
function closetab(args){
	if(!ANDROID)
		browser.tabs.query({windowId: args.windowId},function(tabs){
			if(tabs.length==1 && tabs[0].id==args.id) browser.windows.remove(args.windowId);
			else browser.tabs.remove(args.id);
		});
	else browser.tabs.remove(args.id);
}

//Merges all windows into one window
//Note: No Firefox Android support
//args = {(optional) windowId, index}
function mergewindows(args){
	var movetabs = ((tabs,winid,index) => browser.tabs.move(
		tabs.filter(tab => (tab.windowId!=winid)).map(tab => tab.id),
		{windowId: winid, index: (index==0 || index=="begin")? 0 : (!index || index=="end")? -1 : index}
	));
	browser.tabs.query({},function(tabs){
		if(args && args.windowId!=undefined) browser.windows.get(args.windowId,win => movetabs(tabs,win.id,args.index));
		else if(args && args.index=="next") browser.tabs.getCurrent(tab => movetabs(tabs,tab.windowId,tab.index));
		else if(args && args.index!=undefined) browser.tabs.getCurrent(tab => movetabs(tabs,tab.windowId,args.index));
		else browser.tabs.move(tabs.map(tab => tab.id),{windowId: browser.windows.WINDOW_ID_CURRENT, index: -1});
	});
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
