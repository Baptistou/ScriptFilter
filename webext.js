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
	//args = {(mandatory) port [object], (optional) msgget [function], msgpost [function], disconnect [function]}
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
	//args = {(mandatory) port [object|array], (optional) tabid [int], msg [object]} || ports [array]
	this.send = function(args){
		var ports = [].concat(args.port || args);
		this.data = this.data.filter(function(val){
			try{
				if(ports.contains(val.port.name) && (!args.tabid || args.tabid==val.port.sender.tab.id)){
					if(args.msg) val.port.postMessage(args.msg);
					else if(val.msgpost) val.port.postMessage(val.msgpost());
					else val.port.postMessage();}
				return true;}
			catch(error){
				if(val.disconnect) val.disconnect();
				return false;}
		});
	};
}

/* -------------------- Functions -------------------- */

//Opens a new tab
//args = {(optional) url [string], windowId [int], index [int], active [bool], pinned [bool]}
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
//args = {(mandatory) id [int], windowId [int]}
function focustab(args){
	if(!ANDROID) browser.windows.update(args.windowId,{focused: true});
	browser.tabs.update(args.id,{active: true});
}

//Closes specified tab and its window
//Note: about:config --> browser.tabs.closeWindowWithLastTab
//args = {(mandatory) id [int], windowId [int]}
function closetab(args){
	if(!ANDROID)
		browser.tabs.query({windowId: args.windowId},function(tabs){
			if(tabs.length==1 && tabs[0].id==args.id) browser.windows.remove(args.windowId);
			else browser.tabs.remove(args.id);
		});
	else browser.tabs.remove(args.id);
}

//Merges other windows into current window
//Note: No Firefox Android support
//Note: Private and normal windows can't merge
function mergewindows(){
	browser.windows.getCurrent(function(current){
		browser.tabs.query({},tabs => tabs.groupBy(tab => tab.incognito).forEach(function(group){
			browser.tabs.move(
				group.value.map(tab => tab.id),
				{windowId: (current.incognito!=group.key)? group.value[0].windowId : current.id, index: -1}
			);
		}));
	});
}

//Closes other windows
//Note: No Firefox Android support
function closewindows(){
	browser.windows.getCurrent(function(current){
		browser.windows.getAll(function(windows){
			windows.filter(win => (win.id!=current.id)).forEach(win => browser.windows.remove(win.id));
		});
	});
}

//Gets i18n message from internationalized files
//args = {(mandatory) msg [string], (optional) key [string]} || msg [string]
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
