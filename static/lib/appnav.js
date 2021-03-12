(function() {
    d3.selectAll(".icon")
        .on("mouseover", function() {
            var oldColor = d3.select(this).style("color")
            d3.select(this).style("color", "#83bdea")
            d3.select(this).on("mouseout", function() {
                d3.select(this).style("color",
                    oldColor)
            })
        })
    d3.select("#entry").on("click", function() {
        window.location.href = "./"
    })
    var pages = ["intro","gallery","world","flask","contact"]
    pages.forEach(function(d){
        d3.select("#"+d).on("click", function() {
            window.location.href = d + ".html"
        })
    })
 })()
