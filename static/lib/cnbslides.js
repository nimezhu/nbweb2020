window.cnbslides = window.cnbslides || {};
(function(C){
    C.logo = function(selection){
        selection.each(function(d){
            d3.select(this).html(
                "<h3>CMU <span style=\"color:#CE5146\">Nucleome</span> <span style=\"color:#226A98\">Browser</span></h3>"
            )
        })
    }

})(cnbslides)
