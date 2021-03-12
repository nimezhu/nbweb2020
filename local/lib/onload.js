(function(){
 if (typeof PanelManager != "undefined") {
  PanelManager.dispatch().on("input", function(d) {
    PanelManager.layout().eventHub.emit("update", snow.toolsParseRegions(d)) //for coding message from socket.io.
  })
 }
}())
