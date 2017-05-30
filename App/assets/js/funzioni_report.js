function caricaLog(logs){
	for(var i=logs.length - 1; i>= 0; i--){
		$("#containerLogs").append('<div id="logNum'+ i +'" class="panel panel-primary">');
		$("#logNum" + i).append('<div id="titleNum'+ i +'" class="panel-heading">');
		$("#titleNum" + i).append('<h3 class="panel-title">Report Turno '+ (i + 1) +'</h3>');
		
		$("#logNum" + i).append('<div id="bodyNum'+ i +'" class="panel-body" style="max-height: 500px;overflow-y: scroll;">');
		$("#bodyNum" + i).append('<ul id="logListNum'+ i +'" class="list-group">');
		
		for(var j=0; j<logs[i].length; j++){
			$("#logListNum" + i).append('<li class="list-group-item">'+ logs[i][j] +'</li>');
		}
	}
}
