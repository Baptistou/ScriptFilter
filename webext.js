/* -------------------- WebExtensions -------------------- */

//Browser compatibility
var CHROMIUM = !browser;
var FIREFOX = !!browser;
var browser = browser || chrome;
var ANDROID = !browser.windows;

/* -------------------- Classes -------------------- */

//Port communication between scripts
//Note: Firefox issue with Port.onDisconnect on window close
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

/* -------------------- Functions -------------------- */

//Opens a new tab
function opentab(tab,callback = function(){}){
	switch(tab.index){
	case "next" :
		var winid = !ANDROID && (tab.windowId || browser.windows.WINDOW_ID_CURRENT);
		var currenttab = (winid)?{active: true, windowId: winid}:{active: true};
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

//Internationalization
function geti18ndata(obj){
	return browser.i18n.getMessage(
		(obj.key)?"@"+obj.key:
		(obj.msg)?obj.msg.replace(/\W/g,"_"):
		obj.replace(/\W/g,"_")
	) || obj.msg || obj;
}

function seti18ndata(item){
	var data = item.getAttribute("data-i18n") || item.getAttribute("data");
	if(item.placeholder) item.placeholder = geti18ndata({key: data, msg: item.placeholder});
	if(item.textContent) item.textContent = geti18ndata({key: data, msg: item.textContent});
	if(item.title) item.title = geti18ndata({key: data, msg: item.title});
}
