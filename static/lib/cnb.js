(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.cnb = {}));
}(this, (function (exports) { 'use strict';

    var getValue = function(r) {
        var v;
        if (r.Valid) {
            v = r.Sum / r.Valid;
        } else {
            v = r.Value || 0.0;
        }
        return v
    };
    function regionToValues(region, xscale, yscale, positive) {
        var values = [{
            "x": xscale.domain()[0],
            "y": 0
        }];
        var domain = xscale.domain();
        var lastPos = domain[0];
        var r = xscale.range();
        for (var i = 0; i < region.length; i++) {
            var v = getValue(region[i]);
            if (v <= 0 && positive) {
                continue
            }
            if (isNaN(region[i].From) || isNaN(region[i].To)) {
                continue; //add handle large width bug
            }
            var from = region[i].From;
            if (from<xscale.domain()[0]) {
                from = xscale.domain()[0];
            }
            var to = region[i].To; 
            if (to > xscale.domain()[1]) {
                to = xscale.domain()[1];
            }
            var lastX = xscale(lastPos);
            var x1 = xscale(from);
            var x2 = xscale(to);

            
            if ((x1 - lastX) > 2) {
                values.push({
                    "x": lastPos,
                    "y": 0
                });
                values.push({
                    "x": from,
                    "y": 0
                });
            }

            if ((x2 - x1) < 2) {
                values.push({
                    "x": (from + to) / 2,
                    "y": v
                });
            } else {
                values.push({
                    "x": from,
                    "y": v
                });
                values.push({
                    "x": to,
                    "y": v
                });
            }
            lastPos = to;
        }
        if ((xscale.domain()[1] - lastX) > 2) {
            values.push({
                "x": lastPos,
                "y": 0
            });
        }
        values.push({
            "x": xscale.domain()[1],
            "y": 0
        });
        return values
    }

    var _renderCtx = function(height, ctx, x, y, data, xscale, yscale, color, positive) {
        var y0 = yscale(0);
        if (y0 < 0) {
            y0 = 0;
        }
        if (y0 > height) {
            y0 = height;
        }
        var area = d3.area()
            .x(function(d) {
                return xscale(d.x) + x
            })
            .y1(function(d) {
                var y1 = height - yscale(d.y);
                if (y1 < 0) {
                    y1 = 0;
                }
                if (y1 > height) {
                    y1 = height;
                }
                return y1 + y
                //return (height - yscale(d.y)) + y
            })
            .y0(
              height - y0 + y 
            )
            .context(ctx);
        var values = regionToValues(data, xscale, yscale, positive);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.moveTo(x, y);
        ctx.beginPath();
        area(values);
        ctx.closePath();
        ctx.fill();
        ctx.moveTo(-x, -y);
    };


    var renderCanvas = function(height, ctx, x, y, data, xscale, yscale, color) {
        _renderCtx(height, ctx, x, y, data, xscale, yscale, color, false);
        _renderCtx(height, ctx, x, y, data, xscale, yscale, color, true);
    };

    var _renderSvg = function(height, svg, x, y, data, xscale, yscale, color, positive) {
        var g = svg.append("g").attr("transform", "translate(" + x + "," + y + ")");
        var y0 = yscale(0);
        console.log(y0);
        if (y0 < 0) {
            y0 = 0; //overflow
        }
        if (y0 > height) {
            y0 = height;
        }
        var area = d3.area()
            .x(function(d) {
                return xscale(d.x)
            })
            .y1(function(d) {
                var y1 = height - yscale(d.y);
                if (y1 < 0) {
                    y1 = 0;
                }

                if (y1 > height) {
                    y1 = height;
                }
                return y1 
            })
            .y0(height - y0);
        var values = regionToValues(data, xscale, yscale, positive);

        g.append("path").datum(values).attr("opacity", "0.5").attr("fill",color).attr("d", area);
    };

    var renderSvg = function(height, svg, x, y, data, xscale, yscale, color) {
        _renderSvg(height, svg, x, y, data, xscale, yscale, color, false);
        _renderSvg(height, svg, x, y, data, xscale, yscale, color, true);
    };
    /* render one region bigwig 
     *
     */
    function bw() {
        var xscale;
        var yscale;
        var x;
        var y;
        var height;
        var chart = {};
        var color;
        chart.canvas = function(selection, data) {
            var ctx = selection.node().getContext("2d");
            renderCanvas(height, ctx, x, y, data, xscale, yscale, color);
        };
        chart.svg = function(selection, data) {
            renderSvg(height, selection, x, y, data, xscale, yscale, color);
        };
        chart.color = function(_) {
            return arguments.length ? (color = _, chart) : color;
        };
        chart.yscale = function(_) {
            return arguments.length ? (yscale = _, chart) : yscale;
        };
        chart.xscale = function(_) {
            return arguments.length ? (xscale = _, chart) : xscale;
        };
        chart.x = function(_) {
            return arguments.length ? (x = _, chart) : x;
        };
        chart.y = function(_) {
            return arguments.length ? (y = _, chart) : y;
        };
        chart.height = function(_) {
            return arguments.length ? (height = _, chart) : height;
        };
        return chart;
    }

    var colorMap = {
        "hic": "red",
        "bigwig": "black",
        "bigbed": "blue"
    };

    var trackIcon = function(selection) {
        selection.each(function(d, i) {
            var el = d3.select(this);
            var bar = el.append("rect")
                .attr("x", 2)
                .attr("y", -10)
                .attr("height", 10)
                .attr("width", 10)
                .attr("fill", function(d) {
                    return colorMap[d.format] || "grey"
                })
                .attr("opacity", 0.5)
                .on("mouseover", function(d) {
                    if (d.metaLink) {
                        d3.select(this).attr("opacity", 1.0);
                    }
                })
                .on("mouseout", function(d) {
                    d3.select(this).attr("opacity", 0.5);

                })
                .on("click", function(d) {
                    if (d.metaLink) {
                        window.open(d.metaLink);
                    }
                })
                .append("svg:title")
                .text(d.longLabel || d.id);

            var txt = el.append("text")
                .attr("x", "15")
                .style("font-size", "10px")
                .style("cursor", "default")
                .text(d.id || d.longLabel)
                .attr("pointer-events", "null");

        });
    };
    var color = {
        "Genome Browser": "#226a98",
        "Google Sheet": "#0f9d58",
        "DNA 3d Structure Viewer": "#ce5146"
    };

    function layout() {
        var layout = function(d, el) {
            d.content.forEach(function(d) {
                r[d.type](d, 0, 0, 100, 100, el);
            });
        };
        var row = function(d, x, y, w, h, el) {
            //wh(d)
            if (d.content) {
                var offset = x;
                d.content.forEach(function(d) {
                    r[d.type](d, offset, y, d.width || 100, h, el);
                    offset += d.width || 100;
                });
            }
        };
        var column = function(d, x, y, w, h, el) {
            if (d.content) {
                var offset = y;
                d.content.forEach(function(d) {
                    r[d.type](d, x, offset, w, d.height || 100, el);
                    offset += d.height || 100;
                });
            }
        };
        var stack = function(d, x, y, w, h, el) {
            if (d.content) {
                d.content.forEach(function(d) {
                    r[d.type](d, x, y, w - 1, h - 1, el); //stack Not change
                });
            }
        };
        var component = function(d, x, y, w, h, el) {
            var e = el.append("g")
                .attr("transform", "translate(" + x * xscale + "," + y * yscale + ")");
            var width = w * xscale;
            var height = h * yscale;
            var rect = e.append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", color[d.title] || "grey")
                .attr("opacity", 0.5);
            var maxrows = Math.floor((h * yscale - 45) / 20);
            e.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("height", 15)
                .attr("width", width)
                .attr("opacity", 0.5);
            e.append("text").attr("x", 5).attr("y", 11).attr("font-size", "10px")
                .attr("fill", "#F3FDD6")
                .text(d.componentState.name)
                .attr("pointer-events", "none");
            //switch between component names
            if (d.componentState.sheetId) {
                var btn = e.append("g")
                    .attr("transform", "translate(5,35)");
                var rBtn = btn.append("rect")
                    .attr("height", 20)
                    .attr("width", 34)
                    .attr("fill", "#123")
                    .on("mouseover", function() {
                        d3.select(this).attr("opacity", 0.9);

                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("opacity", 0.5);
                    })
                    .attr("opacity", 0.5);
                if (d.componentState.isPub) {
                    rBtn.on("click", function() {
                        var uri = "https://docs.google.com/spreadsheets/d/" + d.componentState.sheetId + "/edit?usp=sharing";
                        window.open(uri);
                    });

                } else {
                    rBtn.on("click", function() {
                        var currentId = d.componentState.sheetId;
                        window.open("https://docs.google.com/spreadsheets/d/" + currentId + "/edit");

                    });
                }
                btn.append("rect")
                    .attr("x", 34)
                    .attr("height", 20)
                    .attr("width", 74)
                    .attr("fill", "#123")
                    .attr("opacity", 0.3);

                btn.append("text").attr("y", 12).attr("x", 5)
                    .attr("font-size", "10px")
                    .attr("pointer-events", "none")
                    .text("open")
                    .attr("fill", "#F3FDD6");
                btn.append("text")
                    .attr("x", 40)
                    .attr("y", 12)
                    .attr("font-size", "10px")
                    .text(d.componentState.sheetTitle)
                    .attr("fill", "#F3FDD6")
                    .attr("pointer-events", "none");
            }
            if (d.componentState.genome) {
                e.append("text").attr("x", 5).attr("y", 27).text(d.componentState.genome);
            }
            if (d.componentState.trackViews) {
                //TODO
                var l = d.componentState.trackViews.length;
                if (l > maxrows) {
                    e.append("text").attr("x", 5).attr("y", h * yscale - 20).style("font-size", "10px")
                        .text("... " + (l - maxrows + 1) + " more tracks");
                    l = maxrows - 1;
                }
                e.selectAll("g")
                    .data(d.componentState.trackViews.slice(0, l))
                    .enter()
                    .append("g")
                    .attr("transform", function(d, i) {
                        return "translate( 5," + (i * 20 + 45) + ")"
                    })
                    .call(trackIcon);
            }

        };

        var r = {
            "row": row,
            "column": column,
            "stack": stack,
            "component": component
        };

        var xscale = 9;
        var yscale = 6;
        var chart = function(selection) {
            selection.each(function(d) {
                layout(d, d3.select(this));
            });
        };
        chart.xscale = function(_) {
            return arguments.length ? (xscale = _, chart) : xscale;
        };
        chart.yscale = function(_) {
            return arguments.length ? (yscale = _, chart) : yscale;
        };
        return chart
    }

    function totalLength(regions) {
        var l = 0;
        regions.forEach(function (r, i) {
            l += (+r.end) - (+r.start);
        });
        return l
    }


    function overlap(a, b) {
        var chrA = a.chr.replace("chr","").replace("Chr","");
        var chrB = b.chr.replace("chr","").replace("Chr","");
        if (chrA != chrB) {
            return false
        }
        if (b.end < a.start) {
            return false
        }
        if (a.end < b.start) {
            return false
        }
        return true
    }

    /* coord API

     */
    function _overlap(a,b) {
      var start = Math.max(a[0],b[0]);
      var end = Math.min(a[1],b[1]);
      if (start < end) {
        return [start,end]
      } else {
        return false
      }
    }
    function coords () {
      var regions;
      var width = 500;
      var gap = 10;
      var inited = false;
      var scales, offsets, widths;
      /* x.chr x.start x.end */
      /* TODO add overflow fix */
      var chart = function (e) {
        if (!inited) {
          init();
        }
        var rdata = [];
        regions.forEach(function (r, i) {
          var domain = scales[i].domain();
          if (Object.prototype.toString.call(e) === '[object Array]') {
            e.forEach(function (d, j) {
              if (overlap(r, d)) {
                var start = d.start;
                var end = d.end;
                var full = true;
                var o_e = false;
                var o_s = false;
                if (d.start < domain[0]) {
                  start = domain[0];
                  full = false;
                  o_s = true;
                }
                if (d.end > domain[1]) {
                  end = domain[1];
                  full = false;
                  o_e = true;
                }
                var x = scales[i](start) + offsets[i];
                var full = true;
                var l = scales[i](end) + offsets[i] - x;

                rdata.push({
                  "x": x,
                  "l": l,
                  "f": full,
                  "o_e":o_e,
                  "o_s":o_s,
                });
              }
            });
          } else {
            if (overlap(r, e)) {
              var start = e.start;
              var end = e.end;
              var full = true;
              var o_e = false;
              var o_s = false;
              var l_oe = 0.0;
              var l_os = 0.0;
              if (e.start < domain[0]) {
                start = domain[0];
                full = false;
                o_s = true;
              }
              if (e.end > domain[1]) {
                end = domain[1];
                full = false;
                o_e = true;
              }
              var x = scales[i](start) + offsets[i];
              var l = scales[i](end) + offsets[i] - x;
              if (o_e) {
                l_oe = scales[i](e.end) - scales[i](end);
              }
              if (o_s) {
                l_os = scales[i](start) - scales[i](e.start);
              }
              rdata.push({
                "x": x,
                "l": l,
                "f": full,
                "o_e":o_e,
                "o_s":o_s,
                "l_oe":l_oe,
                "l_os":l_os,
                "fl":l_os+l+l_oe
              });
            }
          }
        });

        return rdata
      };
      var init = function () {
        inited = true;
        scales = [];
        offsets = [];
        widths = [];
        var offset = 0;
        var totalLen = totalLength(regions);
        var effectWidth = width - (regions.length - 1) * gap;
        regions.forEach(function (d) {
          var w = (+(d.end) - (+d.start)) * effectWidth / totalLen;
          var scale = d3.scaleLinear().domain([+(d.start), +(d.end)]).range([0, w]);
          scales.push(scale);
          offsets.push(offset);
          offset += w + gap;
          widths.push(w);
        });
      };
      chart.width = function (_) {
        return arguments.length ? (width = _, inited = false, chart) : width;
      };
      chart.regions = function (_) {
        return arguments.length ? (regions = _, inited = false, chart) : regions;
      };
      chart.gap = function (_) {
        return arguments.length ? (gap = _, inited = false, chart) : gap;
      };
      chart.range = function (i) {
        if (!inited) {
          init();
        }
        if (scales[i]) {
          var x = scales[i].range();
          return [x[0] + offsets[i], x[1] + offsets[i]]
        } else {
          return [null, null]
        }
      };
      chart.init = function(){
        init();
        return chart
      };
      /* invert ： given [x0,x1] , get regions list　*/
      chart.invert  = function(_) {
        var r = [];
        scales.forEach(function(d,i){
          var range = chart.range(i);
          var o = _overlap(range,_);
          if (o) {
            r.push({
              "chr":regions[i].chr,
              "start":Math.round(d.invert(o[0]-offsets[i])),
              "end":Math.round(d.invert(o[1]-offsets[i]))
            });
          }
        });
        return r
      };
      chart.invertHost  = function(_) {
        var r = [];
        scales.forEach(function(d,i){
          var range = chart.range(i);
          var o = _overlap(range,_);
          if (o) {
            r.push(i);
          }
        });
        return r
      };
      return chart
    }

    var sandHeaders = new Headers({});
    var sandInits = {
        credentials: "include"
    };


    var totalLength$1 = function(d) {
        var s = 0;
        d.forEach(function(d) {
            s += d.end - d.start;
        });
        return s
    };

    var _getData = function(URI, id, regions, binsize, callback) {
        var q = [];
        if (binsize != -1) {
            if (binsize == undefined) {
                binsize = 1;
            }
            regions.forEach(function(d) {
                q.push(
                    d3.json(URI + "/" + id + "/getbin/" + d.chr + ":" + d.start + "-" + d.end + "/" + binsize, sandInits)
                );
            });
        } else {
            regions.forEach(function(d) {
                q.push(
                    d3.json(URI + "/" + id + "/get/" + d.chr + ":" + d.start + "-" + d.end, sandInits)
                );
            });
        }
        Promise.all(q).then(function(r) {
            callback(r);
        });
    };

    var fetchData = function(regions, URI, id, width, callback) {
        var length = totalLength$1(regions);
        var url = URI + "/" + id + "/binsize/" + length + "/" + width;
        d3.json(url, {
            credentials: 'include',
            headers: sandHeaders //TODO: global variable sandHeaders 
        }).then(function(d) {
            var binsize = d;
            _getData(URI, id, regions, binsize, callback);
        }).catch(function(e) {
            console.log("catch err bw", id, e);
        });
    };
    /* dataBw 
     * Usage: dataBw.callback() ...
     */
    function dataBw() {
        var callback;
        var agent = function(server, prefix, id, regions, width) {
            var URI = server + "/" + prefix + ".bigwig";
            console.log(URI);
            fetchData(regions, URI, id, width, callback);
        };
        agent.callback = function(_) {
            return arguments.length ? (callback = _, agent) : callback;
        };
        return agent
    }

    function hashCode(str) { // java String#hashCode
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
           hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    function intToRGB(i){
        var c = (i & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();
        return "#"+"00000".substring(0, 6 - c.length) + c;
    }
    function strToColor(str) {
      return intToRGB(hashCode(str))
    }

    //TODO Add Canvas render bw canvas
    var renderBw = function(region, d, svg, x, y, w, h, ymin, ymax, color) {
        var xscale = d3.scaleLinear().range([0, w]).domain([region.start, region.end]);
        var yscale = d3.scaleLinear().range([0, h]).domain([ymin, ymax]);
        var chart = bw().height(h).color(color).x(x).y(y).xscale(xscale).yscale(yscale);
        chart.svg(svg, d);
        //chart.canvas(canvas,d)
    };
    var renderBwToCanvas = function(region, d, canvas, x, y, w, h, ymin, ymax, color) {
        var xscale = d3.scaleLinear().range([0, w]).domain([region.start, region.end]);
        var yscale = d3.scaleLinear().range([0, h]).domain([ymin, ymax]);
        var chart = bw().height(h).color(color).x(x).y(y).xscale(xscale).yscale(yscale);
        chart.canvas(canvas, d);
    };


    var getRange = function(d) {
        var min = Infinity;
        var max = -Infinity;
        d.forEach(function(a) {
            a.forEach(function(v) {
                var u = v.Sum / v.Valid;
                if (max < u) {
                    max = u;
                }
                if (min > u) {
                    min = u;
                }
            });
        });
        return [min, max]
    };
    var fixRange = function(d, cfg) {
        var ymin = d[0];
        var ymax = d[1];
        if (ymin > 0) {
            ymin = 0;
        }
        if (ymax < 0) {
            ymax = 0;
        }
        if ("autoscale" in cfg) {
            if (cfg.autoscale == false) {
                ymin = cfg["min"] || ymin;
                ymax = cfg["max"] || ymax;
            }
        }
        return [ymin, ymax]

    };
    var getCfg = function(config, d) {
        var cfg = config || {};
        if (!cfg.color) {
            cfg.color = strToColor(d.id);
        }
        return cfg

    };
    function trackBw() {
        var regions;
        var width = 500;
        var gap = 10;
        var config;
        var chart = {};
        var x = 0;
        var y = 0;
        var label = true;

        chart.svg = function(selection) {
            var d = selection.datum(); //All regions REsult
            var coord = coords().width(width).gap(gap).regions(regions).init();
            var el = selection;
            var g = el.append("g").attr("transform", "translate(" + x + "," + y + ")");
            var cfg = getCfg(config, d);
            var getBw = dataBw().callback(function(d) {
                var range = fixRange(getRange(d), cfg);
                var h = cfg["height"] || 30;
                d.forEach(function(d, i) {
                    var r = coord(regions[i]);
                    var x = r[0].x; //TODO
                    var y = 0; // TODO
                    var w = r[0].l;
                    renderBw(regions[i], d, g, x, y, w, h, range[0], range[1], cfg["color"]);
                });
                if (label) {
                    var labelG = g.append("g").attr("transform", "translate(" + (width + 10) + ",0)").style("font-size", "14px");
                    labelG.append("line").attr("y1", 0).attr("y2", h).attr("x1", 0).attr("x2", 0).style("stroke-width", 1).style("stroke", "#AAA");
                    labelG.append("line").attr("y1", 0).attr("y2", 0).attr("x1", 0).attr("x2", 5).style("stroke-width", 1).style("stroke", "#000");
                    labelG.append("text").attr("x", 7).attr("y", 5).text(Math.round(range[1] * 100) / 100);
                    labelG.append("line").attr("y1", h).attr("y2", h).attr("x1", 0).attr("x2", 5).style("stroke-width", 1).style("stroke", "#000");
                    labelG.append("text").attr("x", 7).attr("y", h + 5).text(Math.round(range[0] * 100) / 100);
                }
            });
            getBw(d.server, d.prefix, d.id, regions, width);

        };

        chart.canvas = function(selection) {

            var d = selection.datum(); //All regions REsult
            var coord = coords().width(width).gap(gap).regions(regions).init();
            var el = selection;
            var cfg = getCfg(config, d);
            var getBw = dataBw().callback(function(d) {
                var range = fixRange(getRange(d), cfg);
                var h = cfg["height"] || 30;
                d.forEach(function(d, i) {
                    var r = coord(regions[i]);
                    var x0 = r[0].x; //TODO
                    var y0 = 0; // TODO
                    var w = r[0].l;
                    renderBwToCanvas(regions[i], d, el, x + x0, y + y0, w, h, range[0], range[1], cfg["color"]);
                });
            });
            getBw(d.server, d.prefix, d.id, regions, width);

        };
        chart.regions = function(_) {
            return arguments.length ? (regions = _, chart) : regions;
        };
        chart.width = function(_) {
            return arguments.length ? (width = _, chart) : width;
        };
        chart.x = function(_) {
            return arguments.length ? (x = _, chart) : x;
        };
        chart.y = function(_) {
            return arguments.length ? (y = _, chart) : y;
        };
        chart.config = function(_) {
            return arguments.length ? (config = _, chart) : config;
        };
        chart.label = function(_) {
            return arguments.length ? (label = _, chart) : label;
        };
        return chart
    }

    function isInt(value) {
      return !isNaN(value) &&
             parseInt(Number(value)) == value &&
             !isNaN(parseInt(value, 10));
    }

    function parseInts(s) {
      var a = [];
      s.split(",").forEach(function (d) {
        a.push(parseInt(d));
      });
      return a;
    }

    function isRgb(s) {
      if (s == "0" || s == "0,0,0") {
        return true
      } else if (s.match(/\d+,\d+,\d+/)){
        return true
      }
      return false
    }

    function parseBed(_) {
      var t;
      if (typeof _ == "string") {
        t = _.split("\t");
      } else {
        t = _;
      }
      var a = {
        "chr": t[0],
        "start": parseInt(t[1]),
        "end": parseInt(t[2])
      };
      if (t.length == 4) {
        a["name"] = t[3];
        a["score"] = 0.0;
        a["strand"] = ".";
      }
      if (t.length == 5) {
        a["name"] = t[3];
        a["score"] = parseFloat(t[4]);
        a["strand"] = ".";
      }
      if (t.length >= 6) {
        a["name"] = t[3];
        a["score"] = parseFloat(t[4]);
        a["strand"] = t[5];
      }
      if (t.length >= 9) {
        if (isInt(t[6])) {
          a["thickStart"] = parseInt(t[6]);
        }
        if (isInt(t[7])) {
          a["thickEnd"] = parseInt(t[7]);
        }
        if (isRgb(t[8])) {
          a["itemRgb"] = t[8];
        }
      }
      if (t.length >= 12 ) {
        a["blockCount"] = parseInt(t[9]);
        a["blockSizes"] = parseInts(t[10]);
        a["blockStarts"] = parseInts(t[11]);
      }

      return a
    }

    var sandInits$1 = {
        credentials: "include"
    };

    function parseBeds(d) {
        var lines = d.split("\n");
        var beds = [];
        lines.forEach(function(d) {
            var t = d.split("\t");
            var a = parseBed(t);
            beds.push(a);
        });
        return beds
    }

    var fetchData$1 = function(regions, URI, id, callback) {
        var q = [];
        regions.forEach(function(d) {
            q.push(d3.text(URI + "/" + id + "/get/" + d.chr + ":" + d.start + "-" + d.end, sandInits$1));
        });
        Promise.all(q).then(function(d) {
            var retv = [];
            d.forEach(function(text) {
                retv.push(parseBeds(text));
            });
            callback(retv);
        });
    };
    function dataBb() {
        var callback;
        var agent = function(server, prefix, id, regions) {
            var URI = server + "/" + prefix + ".bigbed";
            fetchData$1(regions, URI, id, callback);
        };
        agent.callback = function(_) {
            return arguments.length ? (callback = _, agent) : callback;
        };
        return agent
    }

    /*trackManager:
          bed tile layout manager
     */
    function trackManager () {
      var callback;
      var minSize = 0;
      var coord;
      var labelSize = 110; //TODO.
      //var rectClass = "bed6"
      var trackHeight = 5;
      var trackSize = 1000;
      var trackNumber = 0;
      var trackAvailableArray = Array.apply(null, Array(trackSize)).map(Number.prototype.valueOf, -labelSize - 10);

      var minTrackId = function () {
        var i = 0;
        var x = trackAvailableArray[0];
        trackAvailableArray.forEach(function (d, j) {
          if (d < x) {
            x = d;
            i = j;
          }
        });
        return i;
      };

      var _trackAvailable = function (d) {
        var start_pos = d.x;
        for (var i = 0; i < trackSize; i++) {
          if (trackAvailableArray[i] + labelSize <= start_pos  ) {
            return {"i":i,"c":false};
          }
        }
        return {"i":minTrackId(),"c":true};
      };
      var _putToTrack = function (d, i) {
        d.forEach(function (d) {
          var l = Math.max(d.l,minSize);
          if (trackAvailableArray[i] < d.x + l) {
            trackAvailableArray[i] = d.x + l;
          }
        });
        if (trackNumber < i) {
          trackNumber = i;
        }  };
      var trackAssign = function(d) {
        var r = {i:0,c:false};
        d.forEach(function (d0) {
          var x = _trackAvailable(d0);
          if (r.i <= x.i) {
             r.i = x.i;
             r.c = x.c;
          }
        });
        _putToTrack(d, r.i);
        return r
      };

      var chart = function (selection) {
      
      };
      chart.AssignTrack = function(d) {
        var r = coord(d);
        return trackAssign(r)
      };
      chart.trackSize = function (x) {
        if (!arguments.length == 0) {
          trackSize = x;
          trackAvailableArray = Array.apply(null, Array(trackSize)).map(Number.prototype.valueOf, 0);
          trackNumber = 0; //reset track index;
          return chart
        } else {
          return trackSize;
        }
      };
      chart.trackHeight = function (x) {
        if (!arguments.length == 0) {
          trackHeight = x;
          return chart
        } else {
          return trackHeight;
        }
      };
        chart.trackNumber = function() {
            return trackNumber
        };

      chart.coord = function (_) {
        return arguments.length ? (coord = _, chart) : coord;
      };
      chart.regions = function (_) {
        return arguments.length ? (regions = _, chart) : regions;
      };
      chart.callback = function (_) {
        return arguments.length ? (callback = _, chart) : callback;
      };
      chart.labelSize = function(_) { return arguments.length ? (labelSize= _, chart) : labelSize; };
      chart.minSize = function(_) { return arguments.length ? (minSize= _, chart) : minSize; };
      
      return chart;
    }

    /* results format
     * Array of Bed Array
     * Considering First Names
     *
     */
    function assignTrackLane(results,coord,showName,fontWidth) {
          var trackM = trackManager().coord(coord);//.regions(regions);
          var maxLane = 0;
          var beds = [];
          results.forEach(function (d, i) { // if i == 0 , firstNames;
            d.forEach(function (a) {
              if (a.name && a.name.length > 1 && showName) {
                trackM.labelSize(a.name.length * fontWidth + 25);
              } else {
                trackM.labelSize(0);
              }
              var yi = trackM.AssignTrack(a);
              a.lane = yi;
              beds.push(a);
              if (maxLane < yi.i) maxLane = yi.i; //TODO FirstNames
            });
          });
        return {beds:beds,max:maxLane}
    }

    //canvasHeight = (maxTrack + 1 + 1) * (height + gap)

    function _slice(bed12,start,end,suffix) {
      suffix = suffix || "_sliced";
      var chr = bed12.chr;
      if (start < bed12.start) {
        start = bed12.start;
      }
      if (end > bed12.end) {
        end = bed12.end;
      }
      var blockCount = 0;
      var sliceBlockStarts = [];
      var sliceBlockSizes = [];
      for (var i=0;i<bed12.blockCount;i++) {
        var exonStart = bed12.blockStarts[i]  + bed12.start;
        var exonEnd = exonStart + bed12.blockSizes[i];
        var sliceStart = Math.max(start,exonStart);
        var sliceEnd = Math.min(end,exonEnd);
        if (sliceStart<sliceEnd) {
          blockCount += 1;
          sliceBlockStarts.push(sliceStart - start);
          sliceBlockSizes.push(sliceEnd-sliceStart);
        }
      }
      if (blockCount==0) {
        return undefined
      } else {
        return {
          "chr" : bed12.chr,
          "start" : start,
          "end" : end,
          "id"  : bed12.id+suffix || "noname",
          "strand" : bed12.strand,
          "score"  : bed12.score,
          "thickStart" : Math.max(start,bed12.thickStart),
          "thickEnd" : Math.min(end,bed12.thickEnd),
          "itemRgb" : bed12.itemRgb,
          "blockCount": blockCount,
          "blockSizes": sliceBlockSizes,
          "blockStarts": sliceBlockStarts,
        }
      }

    }
    function getCDS(bed12) {
      if (bed12.thickStart==bed12.thickEnd) {
        return undefined
      }
      return _slice(bed12,bed12.thickStart,bed12.thickEnd,"_cds")
    }

    function parseItemRgb(s) {
        if (s == undefined) {
            return undefined
        }
        if (s == "0" || s == "0,0,0") {
            return undefined
        } else {
            return "rgb(" + s + ")"
        }
    }

    function getColor(a, color) { //color is config.color
        var lcolor;
        if ((color == "#ffffff" || color == "#FFFFFF") && a.name) {
            lcolor = strToColor(a.name);
        } else {
            lcolor = color;
        }
        var itemColor = parseItemRgb(a.itemRgb) || lcolor || "#00F";
        return itemColor
    }

    function trackBb() {
        var regions;
        var width = 500;
        var gap = 10;
        var config;
        var callback = function(d) {
            console.log(d);
        };
        var chart = {};
        chart.svg = function(selection) {
            var d = selection.datum(); //All regions REsult
            var coord = coords().width(width).gap(gap).regions(regions).init();
            var getData = dataBb().callback(function(d) {
                var l = assignTrackLane(d, coord, true, 6);
                var g = selection.append("g");
                g.selectAll("g").data(l.beds).enter().append("g")
                    .attr("transform", function(d, i) {
                        var k = coord(d);
                        console.log(k);
                        var g0 = d3.select(this);
                        var color = getColor(d, config.color);
                        if (k.length > 0) {
                            if (k[0].o_s) ;
                            if (k[0].o_e) ;

                            if (d.blockStarts && k[0].l > 5) {
                                var e = [];
                                d.blockStarts.forEach(function(start, i) {
                                    e.push({
                                        "chr": d.chr,
                                        "start": start + d.start,
                                        "end": start + d.start + d.blockSizes[i]
                                    });
                                });
                                e.forEach(function(e) {
                                    var rE = coord(e);
                                    if (rE.length > 0) {
                                        g0.append("rect").attr("height", 5).attr("x", rE[0].x - k[0].x).attr("y", 3).attr("width", rE[0].l || 1).attr("fill", color); //TODO k multi locations. 
                                    }
                                });
                                g0.append("rect").attr("height", 1).attr("width", k[0].l).attr("y", 5).attr("fill", color);
                            } else {
                                g0.append("rect").attr("height", 5).attr("width", k[0].l).attr("y", 3).attr("fill", color); //TODO k multi locations. 
                            }
                            g0.append("text").style("font-size", "10px").style("font-family", "Courier").attr("x", -6 * d.name.length - 3).attr("y", 9).text(d.name);
                            if (d.blockStarts) {
                                var cds = getCDS(d);
                                var e2 = [];
                                if (cds && cds.blockStarts) {

                                    cds.blockStarts.forEach(function(start, i) {
                                        e2.push({
                                            "chr": cds.chr,
                                            "start": start + cds.start,
                                            "end": start + cds.start + cds.blockSizes[i]
                                        });
                                    });
                                    e2.forEach(function(e) {
                                        var rE = coord(e);
                                        if (rE.length > 0) {
                                            g0.append("rect").attr("height", 2).attr("x", rE[0].x - k[0].x).attr("y", 1).attr("width", rE[0].l || 1).attr("fill", color); //TODO k multi locations. 
                                            g0.append("rect").attr("height", 2).attr("x", rE[0].x - k[0].x).attr("y", 8).attr("width", rE[0].l || 1).attr("fill", color); //TODO k multi locations. 
                                        }
                                    });
                                }
                            }
                            return "translate(" + k[0].x + "," + d.lane.i * 15 + ")"
                        } else {
                            return ""
                        }

                    });

            });
            getData(d.server, d.prefix, d.id, regions);

        };
        chart.config = function(_) {
            return arguments.length ? (config = _, chart) : config;
        };
        chart.width = function(_) {
            return arguments.length ? (width = _, chart) : width;
        };
        chart.regions = function(_) {
            return arguments.length ? (regions = _, chart) : regions;
        };
        chart.callback = function(_) {
            return arguments.length ? (callback = _, chart) : callback;
        };
        return chart
    }

    var niceFormat = d3.format(",");
    function regionNiceText(d) {
        return d.chr + ":" + niceFormat(d.start+1) + "-" + niceFormat(d.end)
    }

    function regionsSmartText(regions) {
        var r = [];
        regions.forEach(function(d) {
            r.push(regionNiceText(d));
        });
        return r.join("; ")
    }

    var sandHeaders$1 = new Headers({});
    var sandInits$2 = {
        credentials: "include"
    };
    var colorBand = {
        "gneg": "#DDD",
        "gpos33": "#999",
        "gpos66": "#555",
        "gpos75": "#333",
        "gpos50": "#777",
        "gpos25": "#BBB",
        "gpos100": "#000",
        "gvar": "#000"
    };
    var colors = function(d) {
        return colorBand[d] || "#000"
    };
    function trackChr() {
        var width = 500;
        var height = 70;
        var gap = 10;
        var color = ["#F00", "#A00"];
        var parse = d3.format(".1s");
        var parse2 = d3.format(",");
        var genome = "hg19";
        var x = 0;
        var y = 0;
        var regionsToChrs = function(d) {
            var chrSet = {};
            var retv = [];
            d.forEach(function(d) {
                if (!chrSet[d.chr]) {
                    chrSet[d.chr] = true;
                    retv.push(d.chr);
                }
            });
            return retv
        };
        var chart = {};
        chart.svg = function(el) {
            var data = el.datum(); //regions;
            var chrs = regionsToChrs(data);
            var svg = el.append("g");
            var plotChromsLabel = function(coord, chromos) {
                chromos.forEach(function(d, i) {
                    var x = coord(d);
                    x.forEach(function(d0) {
                        svg.append("text").attr("x", d0.x).attr("y", 8).style("font-size", "12px").text(d.chr);
                    });

                });
            };
            var plotBands = function(results, coord) {
                results.forEach(function(result, i) {
                    var c = true;
                    result.forEach(function(d0) {
                        var b = coord(d0);
                        if (d0.value == "acen") {
                            //TODO 
                            if (c) {
                                c = false;
                                var d = "M " + b[0].x + " 12";
                                d += "L " + (b[0].x + b[0].l) + " 17";
                                d += "L " + b[0].x + " 22";
                                d += "L " + b[0].x + " 12";
                                svg.append("path").attr("x", b[0].x).attr("y", 0).attr("fill", "#900C3F").attr("d", d);
                            } else {
                                c = true;
                                var d = "M " + b[0].x + " 17";
                                d += "L " + (b[0].x + b[0].l) + " 12";
                                d += "L " + (b[0].x + b[0].l) + " 22";
                                d += "L " + b[0].x + " 17";
                                svg.append("path").attr("x", b[0].x).attr("y", 0).attr("fill", "#900C3F").attr("d", d);
                            }
                        } else {
                            svg.append("rect")
                                .attr("x", b[0].x)
                                .attr("y", 12)
                                .attr("width", b[0].l)
                                .attr("height", 10)
                                .attr("fill", colors(d0.value))
                                .append("svg:title")
                                .text(d0.id);
                        }

                    });
                });

            };
            var plotSelect = function(coord) {
                data.forEach(function(d0, i) {
                    var x = coord(d0);
                    x.forEach(function(x) {
                        var l = x.l;
                        if (l < 1) {
                            l = 1;
                        }
                        var slt = svg.append("g").attr("transform", "translate(" + x.x + ",24)");
                        slt.append("rect")
                            .attr("height", 4)
                            .attr("width", l)
                            .attr("fill", color[i]);
                        slt.datum({
                            "x": x.x,
                            "y": 24,
                            "i": i,
                            "l": x.l
                        });
                    });
                });
                svg.append("text").attr("x", 0).attr("y", 46).style("font-size", "12px").text(regionsSmartText(data));
            };
            var plot = function(results) {
                var chromos = [];
                results.forEach(function(d, i) {
                    chromos.push({
                        "chr": d[0].chr,
                        "start": d[0].start,
                        "end": d[d.length - 1].end
                    });
                });
                var coord = coords().width(width).gap(gap).regions(chromos).init();
                plotBands(results, coord);
                plotChromsLabel(coord, chromos);
                plotSelect(coord);
            };

            //Agent Buffer Here
            var q = [];

            chrs.forEach(function(d, i) {
                q.push(
                    d3.json("/band/" + genome + "/get/" + d, sandInits$2)
                );
            });
            Promise.all(q).then(plot).catch(function() {
            });
        };
        chart.canvas = function(canvas) { //TODO
            var data = canvas.datum(); //regions;
            var chrs = regionsToChrs(data);
            var ctx = canvas.node().getContext("2d");
            ctx.fillStyle = "#F7F7F7";
            ctx.fillRect(x+0, y+0, width, height - 17);
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(x+0, y+height - 17, width, 17);
            var plotChromsLabel = function(chromos,coord) {
                ctx.fillStyle = "#000";
                chromos.forEach(function(d, i) {
                    var x0 = coord(d);
                    x0.forEach(function(d0) {
                        ctx.fillText(d.chr, x + d0.x, y + 8);
                    });

                });
            };
            var plotBands = function(results, coord) {
                results.forEach(function(result, i) {
                    var c = true;
                    result.forEach(function(d0) {
                        var b = coord(d0);
                        if (d0.value == "acen") {
                            if (c) {
                                c = false;
                                ctx.fillStyle = "#900C3F";
                                ctx.moveTo(x+ b[0].x, y+12);
                                ctx.lineTo(x +b[0].x + b[0].l, y+17);
                                ctx.lineTo(x + b[0].x, y+22);
                                ctx.closePath();
                                ctx.fill();
                            } else {
                                c = true;
                                ctx.fillStyle = "#900C3F";
                                ctx.moveTo(x + b[0].x, y + 17);
                                ctx.lineTo(x + b[0].x + b[0].l, y + 12);
                                ctx.lineTo(x + b[0].x + b[0].l, y + 22);
                                ctx.closePath();
                                ctx.fill();
                            }
                        } else {
                            ctx.fillStyle = colors(d0.value);
                            ctx.fillRect(x + b[0].x, y + 12, b[0].l, 10);
                        }
                    });
                });
            };
            var plotSelect = function(coord) {
                console.log("Plot regions in canvas",data,coord);
                data.forEach(function(d0, i) {
                    var x0 = coord(d0);
                    x0.forEach(function(x1) {
                        var l = x1.l;
                        if (l < 1) {
                            l = 1;
                        }
                        /*
                        var slt = svg.append("g").attr("transform", "translate(" + x.x + ",24)")
                        slt.append("rect")
                            .attr("height", 4)
                            .attr("width", l)
                            .attr("fill", color[i])
                        slt.datum({
                            "x": x.x,
                            "y": 24,
                            "i": i,
                            "l": x.l
                        })
                        */
                        ctx.fillStyle=color[i];
                        ctx.fillRect( x + x1.x, y + 24,l,4);
                    });
                });
                //svg.append("text").attr("x", 0).attr("y", 46).style("font-size", "12px").text(regionsSmartText(data))
            };

            var plot = function(results) {
                console.log("Plot Bands in Canvas", results);
                var chromos = [];
                results.forEach(function(d, i) {
                    chromos.push({
                        "chr": d[0].chr,
                        "start": d[0].start,
                        "end": d[d.length - 1].end
                    });
                });
                var coord = coords().width(width).gap(gap).regions(chromos).init();

                plotBands(results, coord);
                plotChromsLabel(chromos,coord);
                plotSelect(coord);
            };
            var q = [];

            chrs.forEach(function(d, i) {
                q.push(
                    d3.json("/band/" + genome + "/get/" + d, sandInits$2)
                );
            });
            Promise.all(q).then(plot).catch(function(e) {
                console.log("error",e);
            });
        };
        chart.width = function(_) {
            return arguments.length ? (width = _, chart) : width;
        };
        chart.height = function(_) {
            return arguments.length ? (height = _, chart) : height;
        };
        chart.gap = function(_) {
            return arguments.length ? (gap = _, chart) : gap;
        };
        chart.genome = function(_) {
            return arguments.length ? (genome = _, chart) : genome;
        };
        chart.x = function(_) {
            return arguments.length ? (x = _, chart) : x;
        };
        chart.y = function(_) {
            return arguments.length ? (y = _, chart) : y;
        };
        return chart
    }

    //TODO merge svg and canvas code
    function measureScale(l) {
        var s = Math.pow(10, 12);
        for (var i = 0; i < 12; i++) {
            if ((s * 5) / l < 1 / 2) {
                return s * 5;
            }
            if ((s * 2) / l < 1 / 2) {
                return s * 2;
            }
            if (s / l < 1 / 2) {
                return s;
            }
            s = s / 10;
        }
        return s;
    }
    function trackScale() {
        var coord;
        var width = 500;
        var height = 30;
        var gap = 10;
        var svg;
        var parse = d3.format(".1s");
        var parse2 = d3.format(",");
        var x = 0;
        var y = 0;
        var chart = {};
        chart.canvas = function(el) {
            var d = el.datum(); //regions;
            var ctx = el.node().getContext("2d");
            ctx.translate(x,y);
            coord = coords().width(width).gap(gap).regions(d).init();
            var w = width - gap;
            var l = 0;
            d.forEach(function(d, i) {
                l += d.end - d.start;
            });
            var s = measureScale(l);
            var sRatio = s / l;
            var scaleWidth = sRatio * w;
            var scaleOffset = (w - scaleWidth) / 2;
            ctx.fillStyle = "#000000";
            ctx.fillRect(scaleOffset, 0, scaleWidth, 1);
            ctx.fillRect(scaleOffset, 0, 1, 5);
            ctx.fillRect(scaleOffset + scaleWidth, 0, 1, 5);
            ctx.fillText(parse(s), scaleOffset + scaleWidth + 10, 10);
            d.forEach(function(d, i) {
                var x = coord(d);
                x.forEach(function(x) {
                    ctx.fillRect(x.x, 12, x.l, 1);
                    ctx.fillText(d.chr, x.x, 10);
                });
            });
            var tickGap = s / 2;
            if (sRatio < 1 / 3 || width < 500) {
                tickGap = s;
            }
            d.forEach(function(d, i) {
                var i0 = Math.floor(d.start / tickGap) + 1;
                var k0 = Math.floor(d.end / tickGap);
                for (var i1 = i0; i1 < k0; i1++) {
                    var l = i1 * tickGap;
                    var e = {
                        "chr": d.chr,
                        "start": l,
                        "end": l + 1
                    };
                    coord(e).forEach(function(d) {
                        /*
                        svg.append("line").attr("x1", d.x).attr("y1", 12).attr("x2", d.x).attr("y2", 17)
                            .attr("style", "stroke-width:1;stroke:#000");
                        svg.append("text").attr("x", (d.x + 3)).attr("y", 25).style("font-size", "12px").text(parse2(l))
                        */
                        ctx.fillStyle = "#000000";
                        ctx.fillRect(d.x, 12, 1, 5);
                        ctx.fillStyle = "#303030";
                        ctx.fillText(parse2(l), d.x + 3, 22);
                    });
                }
            });
            ctx.translate(-x,-y);

        };
        chart.svg = function(el) {
            var d = el.datum(); //regions;
            coord = coords().width(width).gap(gap).regions(d).init();
            svg = el.append("g").attr("transform","translate("+x+","+y+")");
            var w = width - gap;
            var l = 0;
            d.forEach(function(d, i) {
                l += d.end - d.start;
            });
            var s = measureScale(l);
            var sRatio = s / l;
            var scaleWidth = sRatio * w;
            var scaleOffset = (w - scaleWidth) / 2;
            var sEnd = scaleOffset + scaleWidth;
            var d0 = "M " + scaleOffset + " 5 ";
            d0 += "L " + scaleOffset + " 0 ";
            d0 += "L " + sEnd + " 0 ";
            d0 += "L " + sEnd + " 5";
            svg.append("path")
                .attr("d", d0).attr("fill", "none").style("stroke", "#000").style("stroke-width", 1);
            svg.append("text").attr("x", (sEnd + 10)).attr("y", 10).style("font-size", "12px").text(parse(s));


            d.forEach(function(d, i) {
                var x = coord(d);
                x.forEach(function(x) {
                   svg.append("line").attr("x1", x.x).attr("y1", 12).attr("x2", x.x + x.l).attr("y2", 12)
                        .attr("style", "stroke-width:1;stroke:#000");
                    svg.append("text").attr("x", x.x).attr("y", 10).style("font-size", "12px").text(d.chr);
                });
            });
            var tickGap = s / 2;
            if (sRatio < 1 / 3 || width < 500) {
                tickGap = s;
            }
            var lastMark = 0;
            d.forEach(function(d, i) {
                var i0 = Math.floor(d.start / tickGap) + 1;
                var k0 = Math.floor(d.end / tickGap);
                for (var i1 = i0; i1 < k0; i1++) {
                    var l = i1 * tickGap;
                    var e = {
                        "chr": d.chr,
                        "start": l,
                        "end": l + 1
                    };
                    coord(e).forEach(function(d) {
                        svg.append("line").attr("x1", d.x).attr("y1", 12).attr("x2", d.x).attr("y2", 17)
                            .attr("style", "stroke-width:1;stroke:#000");
                        if (d.x-lastMark>200 || lastMark==0) {
                            svg.append("text").attr("x", (d.x + 3)).attr("y", 26).style("font-size", "12px").text(parse2(l));
                            lastMark = d.x;
                        }
                    });
                }
            });
        };
        chart.width = function(_) {
            return arguments.length ? (width = _, chart) : width;
        };
        chart.height = function(_) {
            return arguments.length ? (height = _, chart) : height;
        };
        chart.gap = function(_) {
            return arguments.length ? (gap = _, chart) : gap;
        };
        chart.x=function(_) {return arguments.length ? (x= _, chart) : x; };
        chart.y=function(_) {return arguments.length ? (y= _, chart) : y; };
        return chart

    }

    function regionText(d) {
        return d.chr + ":" + (d.start+1) + "-" + d.end
    }

    var vars = {
        apiKey: "AIzaSyBhECk4C1LpxI1mDJjSTwot-hRP2v3bwEA",
        sandInits: {
            credentials: "include"
        }
    };

    var sandInits$3 = vars.sandInits;

    var loadData = function(server, prefix, id, regions, width, cfg, callback) {
        var URI = server + "/" + prefix + ".hic/" + id; 
        var binsize;
        d3.json(URI+"/bpres").then(function(bpres) {
            var resIdx = regionsToResIdx(regions, width, cfg.min_bp, bpres, 10);
            //TODO res.offsets and cellSize 
            binsize = bpres[resIdx];
            process(resIdx);
        });
        var generateQueryUrl = function(d, resIdx, oe, norm, unit) {
            var cmd = "get2dnorm";
            if (oe) {
                cmd = "get2doe";
            }
            var a = regions[d[0]];
            var b = regions[d[1]];
            var url = "/" + cmd + "/" + regionText(a) + "/" + regionText(b) + "/" + resIdx + "/" + norm + "/" + unit + "/text";
            return url
        };

        var process = function(resIdx) {
            var l = regions.length;
            var pairs = [];
            for (var i = 0; i < l; i++) {
                for (var j = i; j < l; j++) {
                    pairs.push([i, j]);
                }
            }
            var q = [];
            pairs.forEach(function(d, i) {
                var url = generateQueryUrl(d, resIdx, cfg.oe, cfg.norm, 0);
                q.push(
                    d3.text(URI + url, sandInits$3)
                );
            });
            Promise.all(q).then(dataReady);
        };
        var dataReady = function(results) {
            var min = Infinity;
            var max = -Infinity;
            var mats = [];
            results.forEach(function(text, i) {
                var data = d3.tsvParseRows(text).map(function(row) {
                    return row.map(function(value) {
                        var v = +value;
                        if (min > v) {
                            min = v;
                        }
                        if (max < v) {
                            max = v;
                        }
                        return v;
                    });
                });
                mats.push(data);

            });
            callback({
                min: min,
                max: max,
                data: mats,
                binsize: binsize,
                regions: regions
            });
        };

    };

    var regionsToResIdx = function(regions, width, minRes, bpres, gap) {
        var w = width;
        var eW = w - gap * (regions.length - 1);
        var l = totalLength(regions);
        var pixel = l / eW;
        var pixel2 = pixel * Math.SQRT2;
        var resIdx = bpres.length - 1;
        for (var i = 0; i < bpres.length; i++) {
            if (bpres[i] < pixel2) {
                resIdx = i - 2;
                break;
            }
            if (minRes && bpres[i] == minRes) {
                resIdx = i;
                break;
            }
            if (minRes && bpres[i] < minRes) {
                resIdx = i - 2;
                break;
            }
        }
        // correct one step for oe
        while (l / bpres[resIdx] > 4000 && resIdx > 0) { //for blockMatrix limition  
            resIdx -= 1;
        }
        /* TODO resIdx change if value is NaN
        var cellSize = eW / (l / bpres[resIdx])
        var offsets = []
        var offset = 0.0;
        regions.forEach(function(d, i) {
            offsets.push(offset)
            offset += cellSize * ((+d.end - d.start) / bpres[resIdx]) + gap
        })
        return {
            offsets: offsets,
            cellSize: cellSize,
            redIdx: resIdx
        }*/
        if (resIdx<0) {
            resIdx =  0;
        }
        return resIdx
    };

    function dataHic() {
        var callback;
        var agent = function(server, prefix, id, regions, width, cfg) {
            loadData(server, prefix, id, regions, width, cfg, callback);
        };
        agent.callback = function(_) {
            return arguments.length ? (callback = _, agent) : callback;
        };
        return agent

    }

    function logColorScale() {
        var domain;
        var range;
        var color;
        var pseudo = 1;
        var inited = false;
        var scale = function(d) {
            if (!inited) {
                _init_();
            }
            if (isNaN(d)) {
                return "#FFF" //color(0)
            } else {
                return color(d)
            }
        };
        var _init_ = function() {
            var max = domain[1];
            var min = domain[0];
            var color2 = range[1];
            var color1 = range[0];
            var color0;
            if (pseudo < 1) {
                var pcolor = d3.scaleLinear().domain([0, Math.log(max)]).range(["white", color2]);
                var ncolor = d3.scaleLinear().domain([0, Math.log(max)]).range(["white", color1]);
                var color0 = color1;
                if (domain) {
                    pcolor.domain([0, Math.log(domain[1])]);
                    ncolor.domain([0, Math.log(domain[1])]);
                    if (domain[0] >= 1) {
                        color0 = "white";
                        ncolor = function(_) {
                            return "white"
                        };
                        ncolor.range = function() {};
                        pcolor.domain([Math.log(domain[0]), Math.log(domain[1])]);
                    }
                }
                color = function(d) {
                    if (d == 0) {
                        return color0
                    }
                    if (d < 1) {
                        return ncolor(-Math.log(d))
                    } else {
                        return pcolor(Math.log(d))
                    }
                };
                color.range = function(d) {
                    pcolor.range(d);
                    ncolor.range(d);
                };
            } else {
                var pcolor = d3.scaleLog().domain([domain[0] + pseudo, domain[1] + pseudo]).range(["white", color2]); 
                color = function(d) {
                    return pcolor(d + pseudo)
                };
                color.range = function(d) {
                    pcolor.range(d);
                };
            }
            inited = true;
        };
        scale.pseudo = function(_) {
            return arguments.length ? (inited = false, pseudo = _, scale) : pseudo;
        };
        scale.range = function(_) {
            return arguments.length ? (inited = false, range = _, scale) : range;
        };
        scale.domain = function(_) {
            return arguments.length ? (inited = false, domain = _, scale) : domain;
        };
        return scale
    }

    function correctPosition(start, end, binsize) {
        return [Math.floor(start / binsize) * binsize, (Math.floor((end - 1) / binsize) + 1) * binsize]
    }

    function fillRect(g, x, y, w, h, f) {
        g.append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", w)
            .attr("height", h)
            .attr("fill", f);

    }

    function renderTriangle(svg, xoffset, yoffset, mat, cellSize, scale, region, binsize) {
        var se = correctPosition(region.start,region.end,binsize);
        var g = svg.append("g").attr("transform", "translate(" + xoffset + "," + yoffset + ") rotate(" + (-180 / 4) + ")");
        var x0 = (se[0] - region.start) / binsize * cellSize;
        var y0 = (se[0] - region.start) / binsize * cellSize;
        var h0 = cellSize + y0;
        var w0 = cellSize + x0;
        var w1 = cellSize + (region.end - se[1]) / binsize * cellSize;
        var h1 = w1;
        var nx = mat.length;
        var ny = mat[0].length;
        if (nx == 0 || ny == 0) {
            return
        }
        for (var x = 1; x < mat.length - 1; x++) {
            for (var y = x; y < mat[0].length - 1; y++) {
                fillRect(g, y * cellSize + y0, x * cellSize + x0, cellSize, cellSize, scale(mat[x][y]));
            }
        }
        fillRect(g, 0, 0, h0, w0,scale(mat[0][0]));
        fillRect(g,y0 + cellSize * (ny - 1), 0, h1, w0,scale(mat[0][ny - 1]));
        fillRect(g, y0 + cellSize * (ny - 1), x0 + cellSize * (nx - 1), h1, w1,scale(mat[nx - 1][ny - 1]));
        for (var y = 1; y < mat[0].length - 1; y++) {
            var l = nx - 1;
            fillRect(g, y * cellSize + y0, 0, cellSize, w0, scale(mat[0][y]));
        }
        for (var x = 1; x < mat.length - 1; x++) {
            var l = ny - 1;
            fillRect(g, l * cellSize + y0, x * cellSize + x0, h1, cellSize, scale(mat[x][l]));
        }
    }

    function renderMatrix(svg, xoffset, yoffset, mat, cellSize, colorScale, region1, region2, binsize) {
        var se1 = correctPosition(region1.start, region1.end, binsize);
        var se2 = correctPosition(region2.start, region2.end, binsize);
        var g = svg.append("g").attr("transform",
            "rotate(" + (-180 / 4) + ")" + "translate(" + xoffset + "," + yoffset + ")");
        var x0 = (se1[0] - region1.start) / binsize * cellSize;
        var y0 = (se2[0] - region2.start) / binsize * cellSize;
        var h0 = cellSize + y0;
        var w0 = cellSize + x0;
        var w1 = cellSize + (region1.end - se1[1]) / binsize * cellSize;
        var h1 = cellSize + (region2.end - se2[1]) / binsize * cellSize;
        var nx = mat.length;
        var ny = mat[0].length;
        if (nx == 0 || ny == 0) {
            return
        }
        fillRect(g, 0, 0, h0, w0, colorScale(mat[0][0]));

        fillRect(g, y0 + cellSize * (ny - 1), 0, h1, w0, colorScale(mat[0][ny - 1]));

        fillRect(g, 0, x0 + cellSize * (nx - 1), h0, w1, colorScale(mat[nx - 1][0]));

        fillRect(g, y0 + cellSize * (ny - 1), x0 + cellSize * (nx - 1), h1, w1, colorScale(mat[nx - 1][ny - 1]));

        for (var y = 1; y < mat[0].length - 1; y++) {
            var l = nx - 1;
            fillRect(g, y * cellSize + y0, 0, cellSize, w0, colorScale(mat[0][y]));
            fillRect(g, y * cellSize + y0, l * cellSize + x0, cellSize, w1, colorScale(mat[l][y]));
        }
        for (var x = 1; x < mat.length - 1; x++) {
            var l = ny - 1;
            fillRect(g, 0, x * cellSize + x0, h0, cellSize, colorScale(mat[x][0]));
            fillRect(g, l * cellSize + y0, x * cellSize + x0, h1, cellSize, colorScale(mat[x][l]));
        }

        for (var x = 1; x < mat.length - 1; x++) {
            for (var y = 1; y < mat[0].length - 1; y++) {
                fillRect(g, y * cellSize + y0, x * cellSize + x0, cellSize, cellSize, colorScale(mat[x][y]));
            }
        }
    }

    function randomString (length) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

        if (!length) {
            length = Math.floor(Math.random() * chars.length);
        }

        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }

    /* render triangle matrix, with region correct */
    function canvasTriangle (ctx, xoffset, yoffset, mat, cellSize, scale, region, binsize) {
          var se = correctPosition(region.start,region.end,binsize);
          ctx.save();
          ctx.translate(xoffset, yoffset);
          ctx.rotate(-Math.PI / 4);
          var x0 = (se[0] - region.start) / binsize * cellSize;
          var y0 = (se[0] - region.start) / binsize * cellSize;
          var h0 = cellSize + y0;
          var w0 = cellSize + x0;
          var w1 = cellSize + (region.end - se[1]) / binsize * cellSize;
          var h1 = w1;
          var nx = mat.length;
          var ny = mat[0].length;
          if (nx == 0 || ny == 0) {
            return
          }
          for (var x = 1; x < mat.length - 1; x++) {
            for (var y = x; y < mat[0].length - 1; y++) {
              ctx.fillStyle = scale(mat[x][y]); 
              ctx.fillRect(y * cellSize + y0, x * cellSize + x0, cellSize, cellSize);
            }
          }

          ctx.fillStyle = scale(mat[0][0]);
          ctx.fillRect(0, 0, h0, w0);

          ctx.fillStyle = scale(mat[0][ny - 1]);
          ctx.fillRect(y0 + cellSize * (ny - 1), 0, h1, w0);
          
          ctx.fillStyle = scale(mat[nx - 1][ny - 1]);
          ctx.fillRect(y0 + cellSize * (ny - 1), x0 + cellSize * (nx - 1), h1, w1);
          for (var y = 1; y < mat[0].length - 1; y++) {
            var l = nx - 1;
            ctx.fillStyle = scale(mat[0][y]);
            ctx.fillRect(y * cellSize + y0, 0, cellSize, w0); //TODO fix size?
           }
          for (var x = 1; x < mat.length - 1; x++) {
            var l = ny - 1;
            ctx.fillStyle = scale(mat[x][l]);
            ctx.fillRect(l * cellSize + y0, x * cellSize + x0, h1, cellSize);
          }
          ctx.restore();
        }

    function canvasMatrix(ctx, xoffset, yoffset, mat, cellSize, colorScale, region1, region2, binsize) {
        var se1 = correctPosition(region1.start,region1.end,binsize);
        var se2 = correctPosition(region2.start,region2.end,binsize);
        ctx.save();
        ctx.rotate(-Math.PI / 4);
        ctx.translate(xoffset, yoffset);

        var x0 = (se1[0] - region1.start) / binsize * cellSize;
        var y0 = (se2[0] - region2.start) / binsize * cellSize;
        var h0 = cellSize + y0;
        var w0 = cellSize + x0;
        var w1 = cellSize + (region1.end - se1[1]) / binsize * cellSize;
        var h1 = cellSize + (region2.end - se2[1]) / binsize * cellSize;
        var nx = mat.length;
        var ny = mat[0].length;
        if (nx == 0 || ny == 0) {
            return
        }
        ctx.fillStyle = colorScale(mat[0][0]);
        ctx.fillRect(0, 0, h0, w0);

        ctx.fillStyle = colorScale(mat[0][ny - 1]);
        ctx.fillRect(y0 + cellSize * (ny - 1), 0, h1, w0);

        ctx.fillStyle = colorScale(mat[nx - 1][0]);
        ctx.fillRect(0, x0 + cellSize * (nx - 1), h0, w1);

        ctx.fillStyle = colorScale(mat[nx - 1][ny - 1]);
        ctx.fillRect(y0 + cellSize * (ny - 1), x0 + cellSize * (nx - 1), h1, w1);

        for (var y = 1; y < mat[0].length - 1; y++) {
            var l = nx - 1;
            ctx.fillStyle = colorScale(mat[0][y]);
            ctx.fillRect(y * cellSize + y0, 0, cellSize, w0); //TODO fix size?
            ctx.fillStyle = colorScale(mat[l][y]);
            ctx.fillRect(y * cellSize + y0, l * cellSize + x0, cellSize, w1);
        }
        for (var x = 1; x < mat.length - 1; x++) {
            var l = ny - 1;
            ctx.fillStyle = colorScale(mat[x][0]);
            ctx.fillRect(0, x * cellSize + x0, h0, cellSize);
            ctx.fillStyle = colorScale(mat[x][l]);
            ctx.fillRect(l * cellSize + y0, x * cellSize + x0, h1, cellSize);
        }

        for (var x = 1; x < mat.length - 1; x++) {
            for (var y = 1; y < mat[0].length - 1; y++) {
                ctx.fillStyle = colorScale(mat[x][y]);
                ctx.fillRect(y * cellSize + y0, x * cellSize + x0, cellSize, cellSize);
            }
        }
        ctx.restore();
    }

    function toInt(a) {return parseInt(a,16)}
    function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
    function hexToRgb(h){
        var a = cutHex(h);
        return "rgb("+toInt(a.substring(0,2))+","+toInt(a.substring(2,4))+","+toInt(a.substring(4,6))+")"
    }

    var hicvar = {
        norms: [
            "NONE",
            "VC",
            "VC_SQRT",
            "KR",
            "GW_KR",
            "INTER_KR",
            "GW_VC",
            "INTER_VC",
            "LOADED"
        ],
        units: ["BP", "FRAG"]
    };

    function trackHic() {
        var regions;
        var width = 500;
        var gap = 10;
        var config;
        var x = 0;
        var y = 0;
        var chart = {};
        chart.svg = function(selection) {
            var d = selection.datum(); //All regions REsult
            var getData = dataHic().callback(function(d) {
                renderSvg$1(selection.append("g").attr("transform","translate("+x+","+y+")"), d, width, gap, config);
            });
            getData(d.server, d.prefix, d.id, regions, width, config);

        };
        chart.canvas = function(selection){
            var d = selection.datum(); //All regions REsult
            var getData = dataHic().callback(function(d) {
                var ctx = selection.node().getContext("2d");
                ctx.translate(x,y);
                renderCanvas$1(ctx, d, width, gap, config);
                ctx.translate(-x,-y);
            });
            getData(d.server, d.prefix, d.id, regions, width, config);
        };
        chart.config = function(_) {
            return arguments.length ? (config = _, chart) : config;
        };
        chart.width = function(_) {
            return arguments.length ? (width = _, chart) : width;
        };
        chart.regions = function(_) {
            return arguments.length ? (regions = _, chart) : regions;
        };
        chart.gap = function(_) {
            return arguments.length ? (gap = _, chart) : gap;
        };
        chart.x=function(_) {return arguments.length ? (x= _, chart) : x; };
        chart.y=function(_) {return arguments.length ? (y= _, chart) : y; };
        return chart
    }
    var colorBarText = function(g,domain,oe){
        var _max = domain[1]; 
        var  _min = domain[0] || 0;
          if (oe) {
            var _max1 = Math.round(Math.log2(_max) * 100) / 100;
            //ctx.fillText(_max1, grdStart + grdWidth - _font.width * s.length, 55)
            g.append("text").attr("y",80).attr("x",50).text(-_max1);
            g.append("text").attr("y",80).attr("x",150).text(_max1);
          } else {
            var _max2 = Math.round(Math.log10(_max) * 100) / 100;
            var _min2 = _min;
            if (_min > 1) {
              _min2 = Math.round(Math.log10(_min) * 100) / 100;
            }
            //ctx.fillText(_min2, grdStart, 55)
            g.append("text").attr("y",80).attr("x",50).text(_min2);
            g.append("text").attr("y",80).attr("x",150).text(_max2);
            //ctx.fillText(_max2, grdStart + grdWidth - _font.width * s.length, 55)
          }
    };
    /* static */
    var getOffsets = function(width, regions, binsize, gap) {
        var eW = width - gap * (regions.length - 1);
        var l = totalLength(regions);
        var cellSize = eW / (l / binsize);
        var offsets = [];
        var offset = 0.0;
        regions.forEach(function(d, i) {
            offsets.push(offset);
            offset += cellSize * ((+d.end - d.start) / binsize) + gap;
        });
        return {
            offsets: offsets,
            cellSize: cellSize,
        }
    };
    //TODO render canvas
    var renderSvg$1 = function(svg, d, width, gap, config) {
        var regions = d.regions;
        var binsize = d.binsize;
        var mats = d.data;

        var colorScale = logColorScale().range(["#3F4498", "#FF0000"]).domain([d.min, d.max]).pseudo(1); //TODO check config
        if (config.color1 && config.color2) {
            colorScale.range([config.color1, config.color2]);
        }
        var id = randomString(4);
        if ("oe" in config && config.oe == true) {
            colorScale.pseudo(0);
            var cscale = svg.append("defs").append("linearGradient").attr("id", id).attr("x1", "0").attr("y1", "0").attr("y2", "0").attr("x2", "1");
            var cStart = hexToRgb(colorScale.range()[0]);
            var cEnd = hexToRgb(colorScale.range()[1]);
            cscale.append("stop").attr("offset", "0").style("stop-color", cStart).style("stop-opacity", 1);
            cscale.append("stop").attr("offset", "0.5").style("stop-color", "#FFFFFF").style("stop-opacity", 1);
            cscale.append("stop").attr("offset", "1").style("stop-color", cEnd).style("stop-opacity", 1);
            svg.append("text").attr("y", -width / 2 + 40).attr("x", 50).text("log2 scale");

        } else {
            var cscale = svg.append("defs").append("linearGradient").attr("id", id).attr("x1", "0").attr("y1", "0").attr("y2", "0").attr("x2", "1");
            var cEnd = hexToRgb(colorScale.range()[1]);
            cscale.append("stop").attr("offset", "0").style("stop-color", "#FFFFFF").style("stop-opacity", 1);
            cscale.append("stop").attr("offset", "1").style("stop-color", cEnd).style("stop-opacity", 1);
            svg.append("text").attr("y", -width / 2 + 40).attr("x", 50).text("log10 scale");
        }
        colorBarText(svg.append("g").attr("transform","translate(0,"+ (-width/2)+")"),colorScale.domain(),config.oe);
        var l = regions.length;
        var k = 0;
        var v = getOffsets(width, regions, binsize, gap);
        for (var i = 0; i < l; i++) {
            for (var j = i; j < l; j++) {
                var x = v.offsets[i];
                var y = v.offsets[j];
                if (i == j) {
                    renderTriangle(svg, x, 0, mats[k], v.cellSize / Math.SQRT2, colorScale, regions[i], binsize); //correct region and se
                } else {
                    renderMatrix(svg, y / Math.SQRT2, x / Math.SQRT2, mats[k], v.cellSize / Math.SQRT2, colorScale, regions[i], regions[j], binsize);
                }
                k += 1;
            }
        }
        var g = svg.append("g").attr("transform", "translate(" + (width + 20) + "," + (-width / 2) + ")").style("font-size", "14px");
        g.append("text").attr("y", 10).text("Binsize: " + binsize);
        if (config.norm) {
            g.append("text").attr("y", 30).text("Norm : " + hicvar.norms[config.norm]);
        }
        if ("oe" in config && config.oe) {
            g.append("text").attr("y", 50).text("OE");
        }
        g.append("text").attr("y", 70).text("max: " + Math.round(d.max * 100) / 100);
        g.append("text").attr("y", 90).text("min: " + Math.round(d.min * 100) / 100);
        svg.append("rect").attr("y", -width / 2 + 50).attr("height", 10).attr("x", 50).attr("width", 120).attr("fill", "url(#" + id + ")");
    };



    var renderCanvas$1 = function(ctx, d, width, gap, config,x,y) {
        var regions = d.regions;
        var binsize = d.binsize;
        var mats = d.data;

        var colorScale = logColorScale().range(["#3F4498", "#FF0000"]).domain([d.min, d.max]).pseudo(1); //TODO check config
        if (config.color1 && config.color2) {
            colorScale.range([config.color1, config.color2]);
        }
        if ("oe" in config && config.oe == true) {
            colorScale.pseudo(0);
            /*
            var cscale = ctx.append("defs").append("linearGradient").attr("id", id).attr("x1", "0%").attr("y1", "0%").attr("y2", "0%").attr("x2", "100%")
            var cStart = hexToRgb(colorScale.range()[0])
            var cEnd = hexToRgb(colorScale.range()[1])
            cscale.append("stop").attr("offset", "0%").style("stop-color", cStart).style("stop-opacity", 1)
            cscale.append("stop").attr("offset", "50%").style("stop-color", "#FFFFFF").style("stop-opacity", 1)
            cscale.append("stop").attr("offset", "100%").style("stop-color", cEnd).style("stop-opacity", 1)
            ctx.append("text").attr("y", -width / 2 + 40).attr("x", 50).text("log2 scale")
            */
        }
        //colorBarText(ctx.append("g").attr("transform","translate(0,"+ (-width/2)+")"),colorScale.domain(),config.oe)
        var l = regions.length;
        var k = 0;
        var v = getOffsets(width, regions, binsize, gap);
        for (var i = 0; i < l; i++) {
            for (var j = i; j < l; j++) {
                var x = v.offsets[i];
                var y = v.offsets[j];
                if (i == j) {
                    canvasTriangle(ctx, x, 0, mats[k], v.cellSize / Math.SQRT2, colorScale, regions[i], binsize); //correct region and se
                } else {
                    canvasMatrix(ctx, y / Math.SQRT2, x / Math.SQRT2, mats[k], v.cellSize / Math.SQRT2, colorScale, regions[i], regions[j], binsize);
                }
                k += 1;
            }
        }
        /*
        var g = ctx.append("g").attr("transform", "translate(" + (width + 20) + "," + (-width / 2) + ")").style("font-size", "14px")
        g.append("text").attr("y", 10).text("Binsize: " + binsize)
        if (config.norm) {
            g.append("text").attr("y", 30).text("Norm : " + hicvar.norms[config.norm])
        }
        if ("oe" in config && config.oe) {
            g.append("text").attr("y", 50).text("OE")
        }
        g.append("text").attr("y", 70).text("max: " + Math.round(d.max * 100) / 100)
        g.append("text").attr("y", 90).text("min: " + Math.round(d.min * 100) / 100)
        ctx.append("rect").attr("y", -width / 2 + 50).attr("height", 10).attr("x", 50).attr("width", 120).attr("fill", "url(#" + id + ")")
        */
    };

    var color$1 = {
        "Genome Browser": "#EEEEEE",
        "Google Sheet": "#0f9d58",
        "DNA 3d Structure Viewer": "#ce5146"
    };
    function print() {
        var layout = function(d, el) {
            d.content.forEach(function(d) {
                r[d.type](d, 0, 0, 100, 100, el);
            });
        };
        var row = function(d, x, y, w, h, el) {
            //wh(d)
            if (d.content) {
                var offset = x;
                d.content.forEach(function(d) {
                    r[d.type](d, offset, y, d.width || 100, h, el);
                    offset += d.width || 100;
                });
            }
        };
        var column = function(d, x, y, w, h, el) {
            if (d.content) {
                var offset = y;
                d.content.forEach(function(d) {
                    r[d.type](d, x, offset, w, d.height || 100, el);
                    offset += d.height || 100;
                });
            }
        };
        var stack = function(d, x, y, w, h, el) {
            if (d.content) {
                d.content.forEach(function(d) {
                    r[d.type](d, x, y, w - 1, h - 1, el); //stack Not change
                });
            }
        };
        var component = function(d, x, y, w, h, el) {
            var e = el.append("g")
                .attr("transform", "translate(" + x * xscale + "," + y * yscale + ")");
            var width = w * xscale;
            var height = h * yscale;
            var rect = e.append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", color$1[d.title] || "grey")
                .attr("opacity", 0.5);
            var maxrows = Math.floor((h * yscale - 45) / 50);
            e.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("height", 15)
                .attr("width", width)
                .attr("opacity", 0.5);
            e.append("text").attr("x", 5).attr("y", 11).attr("font-size", "10px")
                .attr("fill", "#F3FDD6")
                .text(d.componentState.name)
                .attr("pointer-events", "none");
            //switch between component names
            if (d.componentState.sheetId) {
                var btn = e.append("g")
                    .attr("transform", "translate(5,35)");
                var rBtn = btn.append("rect")
                    .attr("height", 20)
                    .attr("width", 34)
                    .attr("fill", "#123")
                    .on("mouseover", function() {
                        d3.select(this).attr("opacity", 0.9);

                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("opacity", 0.5);
                    })
                    .attr("opacity", 0.5);
                if (d.componentState.isPub) {
                    rBtn.on("click", function() {
                        var uri = "https://docs.google.com/spreadsheets/d/" + d.componentState.sheetId + "/edit?usp=sharing";
                        window.open(uri);
                    });

                } else {
                    rBtn.on("click", function() {
                        var currentId = d.componentState.sheetId;
                        window.open("https://docs.google.com/spreadsheets/d/" + currentId + "/edit");

                    });
                }
                btn.append("rect")
                    .attr("x", 34)
                    .attr("height", 20)
                    .attr("width", 74)
                    .attr("fill", "#123")
                    .attr("opacity", 0.3);

                btn.append("text").attr("y", 12).attr("x", 5)
                    .attr("font-size", "10px")
                    .attr("pointer-events", "none")
                    .text("open")
                    .attr("fill", "#F3FDD6");
                btn.append("text")
                    .attr("x", 40)
                    .attr("y", 12)
                    .attr("font-size", "10px")
                    .text(d.componentState.sheetTitle)
                    .attr("fill", "#F3FDD6")
                    .attr("pointer-events", "none");
            }
            if (d.componentState.genome) {
                e.append("text").attr("x", 5).attr("y", 27).text(d.componentState.genome);
            }
            if (d.componentState.trackViews) { //Genome Browser
                //TODO
                var stateMap = d.componentState.stateMap;
                var l = d.componentState.trackViews.length;
                if (l > maxrows) {
                    e.append("text").attr("x", 5).attr("y", h * yscale - 20).style("font-size", "10px")
                        .text("... " + (l - maxrows + 1) + " more tracks");
                    l = maxrows - 1;
                }
                /*
                e.selectAll("g")
                    .data(d.componentState.trackViews.slice(0, l))
                    .enter()
                    .append("g")
                    .attr("transform", function(d, i) {
                        return "translate( 5," + (i * 50 + 45) + ")"
                    })
                    .call(trackRender().regions(d.componentState.regions).stateMap(stateMap).width(width))
                */
                
                var bw = trackBw().width(300);
                var bb = trackBb().width(300);
                var chr = trackChr().width(300).genome(d.componentState.genome);
                var scale = trackScale().width(300);
                var hic = trackHic().width(300);
                var regions = d.componentState.regions;
                e.append("g").attr("transform","translate(10,50)").datum(regions).call(chr.svg);
                e.append("g").attr("transform","translate(10,100)").datum(regions).call(scale.svg);
                var dy = 150;
                d.componentState.trackViews.forEach(function(d, i) {
                        e.append("g").attr("transform", "translate(10," + (dy-2) + ")").append("text").style("font-size","10px").text(d.longLabel || d.id);
                    if (d.format == "bigwig") {
                        e.append("g").attr("transform", "translate(10," + dy + ")").datum(d).call(bw.regions(regions).svg);
                        dy += 50;
                    }
                    if (d.format=="bigbed") {
                        e.append("g").attr("transform","translate(10,"+ dy +")").datum(d).call(bb.regions(regions).svg);
                        //bb(d.server,d.prefix,d.id,regions)
                        //TODO
                        dy += 50;
                    }
                    if (d.format=="hic") {
                        //hic(d.server,d.prefix,d.id,regions,300, stateMap[d.id])
                        e.append("g").attr("transform","translate(10,"+ (dy+150) +")").datum(d).call(hic.regions(regions).config(stateMap[d.id]).svg);
                        //bb(d.server,d.prefix,d.id,regions)
                        dy += 150 + 10;
                    }

                });
            }

        };

        var r = {
            "row": row,
            "column": column,
            "stack": stack,
            "component": component
        };

        var xscale = 9;
        var yscale = 6;
        var chart = function(selection) {
            selection.each(function(d) {
                layout(d, d3.select(this));
            });
        };
        chart.xscale = function(_) {
            return arguments.length ? (xscale = _, chart) : xscale;
        };
        chart.yscale = function(_) {
            return arguments.length ? (yscale = _, chart) : yscale;
        };
        return chart
    }

    function intToRGB$1(i){
        var c = (i & 0x00FFFFFF)
            .toString(16)
            .toLowerCase();
        return "#"+"00000".substring(0, 6 - c.length) + c;
    }
    function rgbToInt(c){
        var c0 = c.replace("#","0x");
        return parseInt(c0)
    }
    function complementaryColor(color){
        var i = rgbToInt(color);
        var c = i ^ 0xFFFFFF;
        return intToRGB$1(c)
    }

    var getValue$1 = function(r) {
            var v;
            if (r.Valid) {
                v = r.Sum / r.Valid;
            } else {
                v = r.Value || 0.0;
            }
            return v
        };
    var renderSvg$2 = function(height, svg, x, y, data, xscale, yscale, color) {
        var ymax = yscale.domain()[1];
        var ymin = yscale.domain()[0];
        var amax = Math.max(Math.abs(ymax), Math.abs(ymin));
        var opacityScale = d3.scaleLinear().range([0,1]);
        if (ymin > 0) {
            opacityScale.domain([ymin,ymax]);
        } else {
            opacityScale.domain([0,amax]);
        }
        var g = svg.append("g").attr("transform","translate("+x+","+y+")");
        g.selectAll("rect").data(data)
            .enter()
            .append("rect")
            .attr("x",function(d,i){
                return xscale(d.From)
            })
            .attr("y",1)
            .attr("width",function(d,i){
                return xscale(d.To) - xscale(d.From)
            })
            .attr("height",10)
            .attr("fill",function(d,i){
                var v = getValue$1(d);
                if (ymin < 0 && v < 0){
                    return complementaryColor(color);//TODO
                } else {
                    return color
                }
            })
            .attr("opacity",function(d){
                var v = getValue$1(d);
                return opacityScale(Math.abs(v))
            });

     
    };

    function bw$1() {
        var xscale;
        var yscale;
        var x;
        var y;
        var height;
        var chart = {};
        var color;
        chart.canvas = function(selection, data) {
            var ctx = selection.node().getContext("2d");
        };
        chart.svg = function(selection, data) {
            renderSvg$2(height, selection, x, y, data, xscale, yscale, color);
        };
        chart.color = function(_) {
            return arguments.length ? (color = _, chart) : color;
        };
        chart.yscale = function(_) {
            return arguments.length ? (yscale = _, chart) : yscale;
        };
        chart.xscale = function(_) {
            return arguments.length ? (xscale = _, chart) : xscale;
        };
        chart.x = function(_) {
            return arguments.length ? (x = _, chart) : x;
        };
        chart.y = function(_) {
            return arguments.length ? (y = _, chart) : y;
        };
        chart.height = function(_) {
            return arguments.length ? (height = _, chart) : height;
        };
        return chart;
    }

    //TODO Add Canvas render bw canvas
    var renderBw$1 = function(region, d, svg, x, y, w, h, ymin, ymax, color) {
        var xscale = d3.scaleLinear().range([0, w]).domain([region.start, region.end]);
        var yscale = d3.scaleLinear().range([0, h]).domain([ymin, ymax]);
        var chart = bw$1().height(h).color(color).x(x).y(y).xscale(xscale).yscale(yscale);
        chart.svg(svg, d);
    };
    var renderBwToCanvas$1 = function(region, d, canvas, x, y, w, h, ymin, ymax, color) {
        var xscale = d3.scaleLinear().range([0, w]).domain([region.start, region.end]);
        var yscale = d3.scaleLinear().range([0, h]).domain([ymin, ymax]);
        var chart = bw$1().height(h).color(color).x(x).y(y).xscale(xscale).yscale(yscale);
        chart.canvas(canvas, d);
    };


    var getRange$1 = function(d) {
        var min = Infinity;
        var max = -Infinity;
        d.forEach(function(a) {
            a.forEach(function(v) {
                var u = v.Sum / v.Valid;
                if (max < u) {
                    max = u;
                }
                if (min > u) {
                    min = u;
                }
            });
        });
        return [min, max]
    };
    var fixRange$1 = function(d, cfg) {
        var ymin = d[0];
        var ymax = d[1];
        if (ymin > 0) {
            ymin = 0;
        }
        if (ymax < 0) {
            ymax = 0;
        }
        if ("autoscale" in cfg) {
            if (cfg.autoscale == false) {
                ymin = cfg["min"] || ymin;
                ymax = cfg["max"] || ymax;
            }
        }
        return [ymin, ymax]

    };
    var getCfg$1 = function(config, d) {
        var cfg = config || {};
        if (!cfg.color) {
            cfg.color = strToColor(d.id);
        }
        return cfg
    };
    function trackBwDense() {
        var regions;
        var width = 500;
        var gap = 10;
        var config;
        var chart = {};
        var x = 0;
        var y = 0;
        var label = true;

        chart.svg = function(selection) {
            var d = selection.datum(); //All regions REsult
            var coord = coords().width(width).gap(gap).regions(regions).init();
            var el = selection;
            var g = el.append("g").attr("transform", "translate(" + x + "," + y + ")");
            var cfg = getCfg$1(config, d);
            var getBw = dataBw().callback(function(d) {
                var range = fixRange$1(getRange$1(d), cfg);
                var h = cfg["height"] || 30;
                d.forEach(function(d, i) {
                    var r = coord(regions[i]);
                    var x = r[0].x; //TODO
                    var y = 0; // TODO
                    var w = r[0].l;
                    renderBw$1(regions[i], d, g, x, y, w, h, range[0], range[1], cfg["color"]);
                });
                if (label) {
                    var labelG = g.append("g").attr("transform", "translate(" + (width + 10) + ",0)").style("font-size", "12px");
                    labelG.append("text").attr("x", 47).attr("y", 10).attr("fill",cfg["color"]).text(Math.round(range[1] * 100) / 100);
                    labelG.append("text").attr("x", 7).attr("y", 10).text(Math.round(range[0] * 100) / 100);
                }
            });
            getBw(d.server, d.prefix, d.id, regions, width);

        };

        chart.canvas = function(selection) {

            var d = selection.datum(); //All regions REsult
            var coord = coords().width(width).gap(gap).regions(regions).init();
            var el = selection;
            var cfg = getCfg$1(config, d);
            var getBw = dataBw().callback(function(d) {
                var range = fixRange$1(getRange$1(d), cfg);
                var h = cfg["height"] || 30;
                d.forEach(function(d, i) {
                    var r = coord(regions[i]);
                    var x0 = r[0].x; //TODO
                    var y0 = 0; // TODO
                    var w = r[0].l;
                    renderBwToCanvas$1(regions[i], d, el, x + x0, y + y0, w, h, range[0], range[1], cfg["color"]);
                });
            });
            getBw(d.server, d.prefix, d.id, regions, width);

        };
        chart.regions = function(_) {
            return arguments.length ? (regions = _, chart) : regions;
        };
        chart.width = function(_) {
            return arguments.length ? (width = _, chart) : width;
        };
        chart.x = function(_) {
            return arguments.length ? (x = _, chart) : x;
        };
        chart.y = function(_) {
            return arguments.length ? (y = _, chart) : y;
        };
        chart.config = function(_) {
            return arguments.length ? (config = _, chart) : config;
        };
        chart.label = function(_) {
            return arguments.length ? (label = _, chart) : label;
        };
        return chart
    }

    function parseItemRgb$1(s) {
      if (s == undefined) {
        return undefined
      }
      if (s == "0" || s == "0,0,0") {
        return undefined
      } else {
        return "rgb(" + s + ")"
      }
    }

    function getColor$1(a, color) { //color is config.color
        var lcolor;
        if ((color == "#ffffff" || color == "#FFFFFF") && a.name) {
            lcolor = strToColor(a.name);
        } else {
            lcolor = color;
        }
        var itemColor = parseItemRgb$1(a.itemRgb) || lcolor || "#00F";
        return itemColor
    }

    function trackBbDense() {
        var regions;
        var width = 500;
        var gap = 10;
        var config;
        var callback = function(d) {
            console.log(d);
        };
        var chart = {};
        chart.svg = function(selection) {
            var d = selection.datum(); //All regions REsult
            var coord = coords().width(width).gap(gap).regions(regions).init();
            var getData = dataBb().callback(function(d) {
                var beds = d;
                var overlapHeights = Array.apply(null, Array(width)).map(Number.prototype.valueOf, 0);
                beds.forEach(function(a, i) {
                    var xs = coord(a);
                    xs.forEach(function(o, i) {
                        var _width = o.l > 1 ? o.l : 1;
                        for (var j = Math.round(o.x); j < Math.round(o.x + _width); j++) {
                            overlapHeights[j] += 1;
                        }
                    });
                });
                var overlapMax = 1;
                overlapHeights.forEach(function(d) {
                    if (overlapMax < d) {
                        overlapMax = d;
                    }
                });
                console.log("overlapMax", overlapMax);

                var opacity = 1.0 / overlapMax;
                var g = selection.append("g");
                g.selectAll("g").data(beds).enter().append("g")
                    .attr("transform", function(d, i) {
                        var k = coord(d);
                        var g0 = d3.select(this);
                        k.forEach(function(r,j) {
                            var color = getColor$1(beds[i][j],config["color"]);
                            if (d.blockStarts && r.l > 5) {
                                var e = [];
                                d.blockStarts.forEach(function(start, i) {
                                    e.push({
                                        "chr": d.chr,
                                        "start": start + d.start,
                                        "end": start + d.start + d.blockSizes[i]
                                    });
                                });
                                e.forEach(function(e) {
                                    var rE = coord(e);
                                    rE.forEach(function(r2) {
                                        g0.append("rect").attr("height", 10).attr("x", r2.x).attr("width", r2.l).attr("opacity", opacity).attr("fill",color);
                                    });
                                });
                                g0.append("rect").attr("height", 1).attr("x", r.x).attr("width", r.l).attr("y", 4).attr("opacity", opacity).attr("fill",color);
                            } else {
                                g0.append("rect").attr("height", 10).attr("x", r.x).attr("width", r.l).attr("opacity", opacity).attr("fill",color);
                            }
                        });
                        return ""
                    });
            });
            getData(d.server, d.prefix, d.id, regions);
        };
        chart.config = function(_) {
            return arguments.length ? (config = _, chart) : config;
        };
        chart.width = function(_) {
            return arguments.length ? (width = _, chart) : width;
        };
        chart.regions = function(_) {
            return arguments.length ? (regions = _, chart) : regions;
        };
        chart.callback = function(_) {
            return arguments.length ? (callback = _, chart) : callback;
        };
        return chart
    }

    function dataTabix() {
        var callback;
        var _render_ = function(d) {
            //TODO parse d
            callback(d);

        };
        var agent = function(server,prefix,id,regions) {
            //TODO using fetch
            var q = [];
            var URI = server + "/" + prefix; 
            regions.forEach(function(d) {
                q.push(d3.text(URI + "/" + id + "/get/" + d.chr + ":" + d.start + "-" + d.end)); //TODO Remove SandInits
            });
            Promise.all(q).then(_render_);
        };
        agent.callback=function(_) {return arguments.length ? (callback= _, agent) : callback; };
        return agent
    }

    function lineToBed3(l) {
        try {
            var a = l.split("\t");
            var r = {
                chr: a[0],
                start: parseInt(a[1]),
                end: parseInt(a[2])
            };
            return r
        } catch (e) {
            return undefined
        }
    }


    function _svgGlyphORM() {
        var coord;
        var height = 8; 
        var state = {};
        var colorScale = d3.scaleLinear()
            .domain([1, 1000, 2000])
            .range(['#d73027', '#fee08b', '#1a9850'])
            .interpolate(d3.interpolateHcl);
        var chart = function(selection) {
            selection.each(function(d) {
                var r = d.d;
                var yi = d.i;
                var svg = d3.select(this);
                var b = coord(r);
                var H = height + 2;
                b.forEach(function(x) {
                    svg.append("rect")
                        .attr("fill", "black")
                        .attr("opacity", "0.3")
                        .attr("x", x.x)
                        .attr("y", 17 + yi.i * H)
                        .attr("width", function() {
                            return x.l > 1 ? x.l : 1
                        })
                        .attr("height", height);
                });
                r.feats.forEach(function(f) {
                    if (f.type == "N") {
                                           var a0 = coord({
                            chr: r.chr,
                            start: r.start + f.pos,
                            end: r.start + f.pos + 1
                        });
                        a0.forEach(function(x) {


                            svg.append("rect")
                                .attr("x", x.x)
                                .attr("y", 16 + yi.i * H)
                                .attr("width", x.l > 1 ? x.l : 1)
                                .attr("height", height)
                                .attr("opacity", 0.3)
                                .attr("fill", colorScale(f.val));
                        });
                    }
                    if (f.type == "S") {
                                           var a0 = coord({
                            chr: r.chr,
                            start: r.start + f.pos,
                            end: r.start + f.pos + f.val
                        });
                        a0.forEach(function(x) {
                            svg.append("rect")
                                .attr("x", x.x)
                                .attr("y", 16 + yi.i * H + Math.round(height / 2))
                                .attr("width", x.l > 1 ? x.l : 1)
                                .attr("height", 1)
                                .attr("opacity", 0.5)
                                .attr("fill", "rgb(3,3,3)");
                        });

                    }

                });
            });



        };
        chart.height = function(_) {
            return arguments.length ? (height = _, chart) : height;
        };
        chart.state = function(_) {
            if (arguments.length == 0) {
                return state
            } else {
                state = _;
                colorScale.range([state.lower, state.middle, state.higher]);
                return chart
            }
        };
        chart.coord = function(_) {
            return arguments.length ? (coord = _, chart) : coord;
        };
        return chart
    }

    function _svgGlyphBed3() {
        var coord;
        //var ctx
        var height = 8; 
        var state = {};
        var chart = function(selection) {
            selection.each(function(d) {
                var r = d.d;
                var yi = d.i;
                var svg = d3.select(this);
                var b = coord(r);
                var H = height + 2;
                b.forEach(function(x) {
                    svg.append("rect")
                        .attr("fill", "black")
                        .attr("opacity", "0.3")
                        .attr("x", x.x)
                        .attr("y", 17 + yi.i * H)
                        .attr("width", function() {
                            return x.l > 1 ? x.l : 1
                        })
                        .attr("height", height);
                });
            });
        };
        chart.height = function(_) {
            return arguments.length ? (height = _, chart) : height;
        };
        chart.state = function(_) {
            if (arguments.length == 0) {
                return state
            } else {
                state = _;
                colorScale.range([state.lower, state.middle, state.higher]);
                return chart
            }
        };
        chart.coord = function(_) {
            return arguments.length ? (coord = _, chart) : coord;
        };
        return chart
    }



    function lineToORM(d) {
        try {
            var a = d.split("\t");
            var r = {
                chr: a[0],
                start: parseInt(a[1]),
                end: parseInt(a[2]),
                name: a[3],
                score: parseFloat(a[5]),
                strand: a[4],
                featCount: parseInt(a[6])
            };
            var f = a[7].split(",");
            var pos = parseInts(a[8]);
            var val = parseInts(a[9]);
            r.feats = [];
            for (var i = 0; i < r.featCount; i++) {
                r.feats.push({
                    "type": f[i],
                    "pos": pos[i],
                    "val": val[i]
                });
            }
            return r
        } catch (e) {
            console.log(e, a);
            return undefined
        }
    }

    var glyphSVG = {
        "bed3": _svgGlyphBed3,
        "ORM": _svgGlyphORM,
    };

    var parsers = {
        "bed3": lineToBed3,
        "ORM": lineToORM
    };
    function trackTabix() {
        var regions;
        var width;
        var config;
        var callback;
        var track;
        var gap = 10;
        var el;
        var chart = function(selection) {};
        chart.regions = function(_) {
            return arguments.length ? (regions = _, chart) : regions;
        };
        chart.canvas = function(selection) {
            var d = selection.datum();
            track = d;
            //fetch data then _render_
        };
        chart.svg = function(selection) {
            var d = selection.datum();
            track = d;
            el = selection;
            _renderSvg_(d);
        };
        var dataAgent = dataTabix().callback(function(results) {
            var rs = [];
            var coord = coords().width(width).gap(gap).regions(regions).init();
            var trackM = trackManager().trackSize(1000).labelSize(0).coord(coord);
            results.forEach(function(d, rI) {
                var lines = d.trim().split("\n");
                lines.forEach(function(d) {
                    var r = parsers[track.parser](d);
                    if (typeof r == "undefined") {
                        return
                    }
                    var yi = trackM.AssignTrack(r);
                    rs.push({
                        i: yi,
                        d: r
                    });
                });

            });
            console.log(rs);
            var _r = glyphSVG[track.glyph]().coord(coord);
            el.selectAll("g").data(rs)
                .enter()
                .append("g").call(_r);
            //TODO element

        });
        var _renderSvg_ = function(d) {
            dataAgent(d.server, d.prefix, d.id, regions);
        };
        chart.width = function(_) {
            return arguments.length ? (width = _, chart) : width;
        };
        chart.config = function(_) {
            return arguments.length ? (config = _, chart) : config;
        };
        chart.callback = function(_) {
            return arguments.length ? (callback = _, chart) : callback;
        };
        return chart
    }

    function getConfig(config,d) {
        var cfg = {};
        if (config) {
            cfg= JSON.parse(JSON.stringify(config));
        }
        if (!("color" in cfg)) {
            cfg.color = strToColor(d.id);
        }
        return cfg
    }
    function hubs(e, c) {
        var state = c.state;
        var width = c.width - 160; //??
        var trackHeights = c.heights;
        var stateMap = state.stateMap || {}; //TODO CONFIG
        var l = state.trackViews.length;
        //TODO Set Svg Width and Height

        var svg = d3.select(e.node().closest('svg'));
        var h = 220;
        state.trackViews.forEach(function(d, i) {
            if (d.id in stateMap && "mode" in stateMap[d.id] && stateMap[d.id]["mode"] == "dense") {
                h += 12;
            } else {
                h += trackHeights[i] + 10;
                if (d.format == "hic") {
                    h += 20;
                }
            }
        });
        var svgH = h + 100;
        var svgW = c.width + 160;
        svg.attr("height", svgH).attr("width", svgW);
        var chr = trackChr().width(width).genome(state.genome);
        var scale = trackScale().width(width);
        var regions = state.regions;
        e.append("g").attr("transform", "translate(150,50)").datum(regions).call(chr.svg);
        e.append("g").attr("transform", "translate(150,100)").datum(regions).call(scale.svg);
        var dy = 150;
        state.trackViews.forEach(function(d, i) {
            
            if (d.id in stateMap && "mode" in stateMap[d.id] && stateMap[d.id]["mode"] == "dense") {
                    let id = stateMap[d.id]["alias"] || d.id;
                    if (id.length==0) {
                        id = d.id;
                    }
                    var dx = 140 - 6 * id.length;
                    e.append("g").attr("transform", "translate("+dx +"," + (dy + 8) + ")").append("text").style("font-size", "10px").style("font-family","Courier")
                    .text(id);
            }
            else {
                    e.append("g").attr("transform", "translate(150," + (dy + 8) + ")").append("text").style("font-size", "12px").text(d.longLabel || d.id);
            }
            if (d.format == "bigwig") {
                if (d.id in stateMap && "mode" in stateMap[d.id] && stateMap[d.id]["mode"] == "dense") {
                     e.append("g").attr("transform", "translate(150," + (dy - 2) + ")")
                    .datum(d)
                    .call(trackBwDense().width(width).regions(regions).config(getConfig(stateMap[d.id],d)).svg);

                } else {
                    e.append("g").attr("transform", "translate(150," + (dy+10) + ")")
                    .datum(d)
                    .call(trackBw().width(width).regions(regions).config(getConfig(stateMap[d.id],d)).svg);
                }
            }
            if (d.format == "bigbed") {
                
                if (d.id in stateMap && "mode" in stateMap[d.id] && stateMap[d.id]["mode"] == "dense") {
                    e.append("g").attr("transform", "translate(150," + dy + ")").datum(d).call(trackBbDense().width(width).config(getConfig(stateMap[d.id],d)).regions(regions).svg);
                }
                else {
                    e.append("g").attr("transform", "translate(150," + (dy + 10) + ")").datum(d).call(trackBb().width(width).config(getConfig(stateMap[d.id],d)).regions(regions).svg);
                }   
            }
            if (d.format == "hic") {
                e.append("g").attr("transform", "translate(150," + (dy + width / 2 + 10) + ")").datum(d).call(trackHic().width(width).regions(regions).width(width).config(stateMap[d.id] || {}).svg);
                dy += 30;
            }

            if (d.format == "tabix") {
                //TODO 
                e.append("g").attr("transform", "translate(150," + (dy) + ")").datum(d).call(
                    trackTabix().width(width).regions(regions).width(width).config(stateMap[d.id] || {}).svg 
                );
                dy+= 30;
            }
            
            if (d.id in stateMap && "mode" in stateMap[d.id] && stateMap[d.id]["mode"] == "dense") {
                dy+=15;
            }
                else {
                dy += (trackHeights[i] + 18);
                }


        });
    }

    function downloadSvg(svg,fn) {
        var filename = fn || "plot.svg";
        svg.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
        svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
        var svgData = svg.outerHTML;
        var svgBlob = new Blob([svgData], {
            type: "image/svg+xml;charset=utf-8"
        });
        var svgUrl = URL.createObjectURL(svgBlob);
        var downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    function svgTabPrint(t) {
        var selection = t.selectAll("tr");
        var heights = [];
        var widths = [];
        var h = 0;
        var w = 0;
        var xoffsets = [];
        var yoffsets = [];
        selection.each(function(d, i) {
            var tr = d3.select(this);
            var height = 0;
            tr.selectAll("td").each(function(d, j) {
                var td = d3.select(this);
                var svgs = td.selectAll("svg");
                svgs.each(function(d) {
                    var svg = d3.select(this);
                    if (height < +svg.attr("height")) {
                        height = +svg.attr("height");
                    }
                    if (widths.length < j + 1) {
                        widths.push(0);
                    }
                    if (widths[j] < +svg.attr("width")) {
                        widths[j] = +svg.attr("width");
                    }
                });
            });
            heights.push(height);
        });
        widths.forEach(function(d, i) {
            xoffsets.push(w);
            w += d;
        });
        heights.forEach(function(d, i) {
            yoffsets.push(h);
            h += d;
        });
        t.selectAll(".tmp").remove();
        var tmpDiv = t.append("div").classed("tmp", true)
            .style("display", "none");
        var destSvg = tmpDiv.append("svg").attr("width", w + 20).attr("height", h + 20);
        selection.each(function(d, i) {
            var tr = d3.select(this);
            tr.selectAll("td").each(function(d, j) {
                var td = d3.select(this);
                var svgs = td.selectAll("svg");
                svgs.each(function(d) {
                    var svg = d3.select(this);
                    destSvg.append("g").attr("transform", "translate(" + xoffsets[j] + "," + yoffsets[i] + ")").html(svg.html());
                });
            });
        });

        downloadSvg(destSvg.node(),"newplot.svg");

    }

    function objectFactory (v) {
      var k = v[0];
      var l = k.length;
      var a = new Array(l - 1);
      a.columns = v[0];
      v.forEach(function (d, i) {
        if (i == 0) {
          return
        }
        var b = {};
        d.forEach(function (d, j) {
          b[k[j]] = d;
        });
        a[i - 1] = b;
      });
      return a
    }

    var apiKey = vars.apiKey;

    function loadGoogleSheet (sheetid, title, range, isPub, callback) {
      if (!isPub) {
        /*
        $.ajax({
          url: "/gsheets/get",
          data: {
            "sheetid": sheetid,
            "title": title,
            "range": range
          },
          success: function (d, e, s) {
            var a = d3.tsvParse(d)
            callback(a,undefined)
          },
          error: function (x, o, e) {
            callback(undefined,e)
          }
        })
        */
          d3.text("/gsheets/get",{"title":title,"range":range,"sheetid":sheetid})
              .then(function(d){
                var a = d3.tsvParse(d);
                callback(a,undefined);
              })
              .catch(function(e){
                callback(undefined,e);
        
              });
      } else {
        var r = title+ "!" + range;
        d3.json("https://sheets.googleapis.com/v4/spreadsheets/" + sheetid + "/values/" + r + "?key=" + apiKey, {})
          .then(function (d) {
            var a = objectFactory(d.values);
            callback(a,undefined);
          })
          .catch(function(e){
            callback(undefined,e);
          });
      }
    }

    /* coord API

     */
    function _overlap$1(a, b) {
        var start = Math.max(a[0], b[0]);
        var end = Math.min(a[1], b[1]);
        if (start < end) {
            return [start, end]
        } else {
            return false
        }
    }
    function ccoords() {
        var regions;
        var startAngle = 0;
        var endAngle = 6.28 * Math.PI;
        var gapAngle = 0.01 * Math.PI;  
        var inited = false;
        var scales, offsets, angles;
        var chart = function(e) {
            if (!inited) {
                init();
            }
            var rdata = [];
            regions.forEach(function(r, i) {
                var domain = scales[i].domain();
                if (Object.prototype.toString.call(e) === '[object Array]') {
                    e.forEach(function(d, j) {
                        if (overlap(r, d)) {
                            var start = d.start;
                            var end = d.end;
                            var full = true;
                            var o_e = false;
                            var o_s = false;
                            if (d.start < domain[0]) {
                                start = domain[0];
                                full = false;
                                o_s = true;
                            }
                            if (d.end > domain[1]) {
                                end = domain[1];
                                full = false;
                                o_e = true;
                            }
                            var x = scales[i](start) + offsets[i] + startAngle;
                            var full = true;
                            var l = scales[i](end) + offsets[i] + startAngle  - x; 

                            rdata.push({
                                "startAngle": x, //start
                                "angle": l, //degree
                                "f": full,
                                "o_e": o_e,
                                "o_s": o_s,
                            });
                        }
                    });
                } else {
                    if (overlap(r, e)) {
                        var start = e.start;
                        var end = e.end;
                        var full = true;
                        var o_e = false;
                        var o_s = false;
                        var l_oe = 0.0;
                        var l_os = 0.0;
                        if (e.start < domain[0]) {
                            start = domain[0];
                            full = false;
                            o_s = true;
                        }
                        if (e.end > domain[1]) {
                            end = domain[1];
                            full = false;
                            o_e = true;
                        }
                        var x = scales[i](start) + offsets[i] + startAngle;
                        var l = scales[i](end) + offsets[i] + startAngle - x;
                        if (o_e) {
                            l_oe = scales[i](e.end) - scales[i](end);
                        }
                        if (o_s) {
                            l_os = scales[i](start) - scales[i](e.start);
                        }
                        rdata.push({
                            "startAngle": x,
                            "angle": l,
                            "f": full,
                            "o_e": o_e,
                            "o_s": o_s,
                            "a_oe": l_oe,
                            "a_os": l_os,
                            "fa": l_os + l + l_oe
                        });
                    }
                }
            });

            return rdata
        };
        var init = function() {
            inited = true;
            scales = [];
            offsets = [];
            angles = [];
            var offset = 0;  //offset + startAngle 
            var totalLen = totalLength(regions);
            var effectAngle = (endAngle - startAngle) - (regions.length - 1) * gapAngle;
            regions.forEach(function(d) {
                var a = (+(d.end) - (+d.start)) * effectAngle / totalLen;
                var scale = d3.scaleLinear().domain([+(d.start), +(d.end)]).range([0, a]);
                scales.push(scale);
                offsets.push(offset);
                offset += a + gapAngle;
                angles.push(a);
            });
        };
        chart.regions = function(_) {
            return arguments.length ? (regions = _, inited = false, chart) : regions;
        };
        chart.gapAngle = function(_) {
            return arguments.length ? (gapAngle = _, inited = false, chart) : gapAngle;
        };
        chart.range = function(i) {
            if (!inited) {
                init();
            }
            if (scales[i]) {
                var x = scales[i].range();
                return [x[0] + offsets[i] + startAngle, x[1] + offsets[i] + startAngle]
            } else {
                return [null, null]
            }
        };
        chart.startAngle = function(_) {
            return arguments.length ? (startAngle = _, inited = false, chart) : startAngle;
        };
        chart.endAngle = function(_) {
            return arguments.length ? (endAngle = _, inited = false, chart) : endAngle;
        };

        chart.invert = function(_) {
            var r = [];
            scales.forEach(function(d, i) {
                var range = chart.range(i);
                var o = _overlap$1(range, _);
                if (o) {
                    r.push({
                        "chr": regions[i].chr,
                        "start": Math.round(d.invert(o[0] - offsets[i])),
                        "end": Math.round(d.invert(o[1] - offsets[i]))
                    });
                }
            });
            return r
        };
        chart.invertHost = function(_) {
            var r = [];
            scales.forEach(function(d, i) {
                var range = chart.range(i);
                var o = _overlap$1(range, _);
                if (o) {
                    r.push(i);
                }
            });
            return r
        };
        return chart
    }

    var height = 500;
    var cs = d3.interpolateBlues;
    var colorMap$1 = {
        "blue": d3.interpolateBlues,
        "grey": d3.interpolateGreys,
        "green": d3.interpolateGreens,
    };


    var cband = {
        "gneg": 0.10,
        "gpos33": 0.33,
        "gpos66": 0.66,
        "gpos75": 0.75,
        "gpos50": 0.5,
        "gpos25": 0.25,
        "gpos100": 1.0,
        "gvar": 0.5,
        "acen": "grey",
        "stalk": 0.25,
    };
    var colorBand$1 = function(v) {
        if (v == "acen") return "grey"
        if (v in cband) return cs(cband[v])
        return "red"
    };
    var width = 500;
    var height = 500;
    var scale = ccoords()
        .startAngle(
            0.20 *
            Math.PI).endAngle(-
            1.28 * Math.PI);

    var renderChr = function(svg, d) {
        var arc = d3.arc()
            .innerRadius(170)
            .outerRadius(210)
            .cornerRadius(1);
        svg.selectAll(".chr").remove();
        var g = svg.append("g").attr(
                "opacity",
                0.9)
            .classed("chr", true)
            .attr("transform", "translate(" +
                width / 2 +
                "," + height / 2 + ")");
        var chr=d[0].chr;
        var start=d[0].start;
        var end=d[d.length-1].end;
        scale.regions([{chr:chr,start:start,end:end}]);
        var data = scale(d);
        var arcs = data.map(function(d){
            return {startAngle:d.startAngle,endAngle:d.startAngle+d.angle,paddingAngle:0.0}
        }); 
        var background = g.selectAll("path")
            .data(arcs)
            .enter()
            .append("path")
            .style("fill", function(d0, i) {
                return colorBand$1(d[i].value)
            })
            .attr("d", function(d0, i) {
                /*  TODO
                if (d[i].value != "acen") return arc(d0)
                console.log(d0,d[i]) //TODO centrimere
                */
                return arc(d0)
            });
    };
    function chr(svg,d) {
        //TODO
        renderChr(svg,d);

    }

    /* Regions format:
     * chr1:100,100-122,200;chr2:10,000-12,000
     */

    var parseRegion = function (s) {
      var a = s.split(":");
      if (a.length == 1) {
        return {
          "chr": a[0],
          "start": 0,
          "end": undefined
        }

      }
      var x = a[1].split("-");
      return {
        "chr": a[0].replace(/ /g,""),
        "start": +(x[0].replace(/,/g, ""))-1,
        "end": +(x[1].replace(/,/g, ""))
      }
    };
    function parsePrettyRegions (s) {
      var a = s.split(';');
      var r = [];
      a.forEach(function (d) {
        r.push(parseRegion(d));
      });
      return r
    }

    function regionsText(regions) {
        var r = [];
        regions.forEach(function(d) {
            r.push(regionText(d));
        });
        return r.join(",")
    }

    var noop = {
        value: function() {}
    };

    function dispatch() {
        for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
            if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
            _[t] = [];
        }
        return new Dispatch(_);
    }

    function Dispatch(_) {
        this._ = _;
    }

    function parseTypenames(typenames, types) {
        return typenames.trim().split(/^|\s+/).map(function(t) {
            var name = "",
                i = t.indexOf(".");
            if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
            if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
            return {
                type: t,
                name: name
            };
        });
    }

    Dispatch.prototype = dispatch.prototype = {
        constructor: Dispatch,
        on: function(typename, callback) {
            var _ = this._,
                T = parseTypenames(typename + "", _),
                t,
                i = -1,
                n = T.length;

            // If no callback was specified, return the callback of the given type and name.
            if (arguments.length < 2) {
                while (++i < n)
                    if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
                return;
            }

            // If a type was specified, set the callback for the given type and name.
            // Otherwise, if a null callback was specified, remove callbacks of the given name.
            if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
            while (++i < n) {
                if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
                else if (callback == null)
                    for (t in _) _[t] = set(_[t], typename.name, null);
            }

            return this;
        },
        copy: function() {
            var copy = {},
                _ = this._;
            for (var t in _) copy[t] = _[t].slice();
            return new Dispatch(copy);
        },
        call: function(type, that) {
            if ((n = arguments.length - 2) > 0)
                for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
            if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
            for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
        },
        apply: function(type, that, args) {
            if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
            for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
        }
    };

    function get(type, name) {
        for (var i = 0, n = type.length, c; i < n; ++i) {
            if ((c = type[i]).name === name) {
                return c.value;
            }
        }
    }

    function set(type, name, callback) {
        for (var i = 0, n = type.length; i < n; ++i) {
            if (type[i].name === name) {
                type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
                break;
            }
        }
        if (callback != null) type.push({
            name: name,
            value: callback
        });
        return type;
    }

    function chan() {
        var extId = "djcdicpaejhpgncicoglfckiappkoeof";
        var chanId = "cnbChan01";
        var status = {
            connection: "No Connection",
            id: ""
        };
        var dispatch$1 = dispatch("sendMessage",
            "receiveMessage", "_disconnect");

        dispatch$1.on("_disconnect.status", function() {
            status.connection = "No Connection";
            status.id = "";
        });

        var onchange = function() {

        };
        var onclose = function() {
            //TODO Add Other Handle
            onchange();
        };
        var agent = function() {};
        agent.connect = function(_) {
            if (typeof _ == "function") {
                connect(chanId, extId, dispatch$1, status, function(d) {
                    onchange();
                    _(d);
                }, onclose);
            } else {
                connect(chanId, extId, dispatch$1, status, function(d) {
                    onchange();
                }, onclose);
            }
        };
        agent.disconnect = function(_) {
            dispatch$1.call("_disconnect", this, {});
        };
        agent.close = function(_) {
            dispatch$1.call("_disconnect", this, {});
        };
        //V0 API
        // chan.dipsatch()
        // code: sendMessage
        //       receiveMessage  
        // data:  {
        //      code: CodeString,
        //      data: Stringify JSON Object 
        // }
        agent.dispatch = function() {
            return dispatch$1;
        };
        agent.extId = function(_) {
            return arguments.length ? (extId = _, agent) : extId;
        };
        agent.chanId = function(_) {
            return arguments.length ? (data = _, agen) : data;
        };
        agent.status = function() {
            return status
        };
        //status change callback
        agent.onchange = function(_) {
            return arguments.length ? (onchange = _, agent) : onchange;
        };
        //V1 API
        agent.on = function(m, f) {
            var a = m.split(".");
            var m0 = a[0] || "";
            //check status??
            if (m0 == "sendMessage" || m0 == "receiveMessage") {
                dispatch$1.on(m, f);
            } else {
                // codebook
                // Add Code Book Wrapper for Receive Message Interface
                // Extend d3 dispatch 
                // user interface:
                // agent.on("code.x",function(data){})
                // translate to
                // agent.on("receiveMessage.code.x",function({"code":code,data:JSON.stringify(data)}))
                dispatch$1.on("receiveMessage" + "." + a, function(d) {
                    if (d.code == m0) {
                        f(JSON.parse(d.data));
                    }
                });
            }
        };
        agent.call = function(code, self, data) {
            if (code == "sendMessage" || code == "receiveMessage") {
                dispatch$1.call(code, self, data);
            } else {
                dispatch$1.call("sendMessage", self, {
                    "code": code,
                    data: JSON.stringify(data)
                });
            }
        };
        // Add Share Worker (share worker js)
        return agent
    }

    function connect(chanId, extId, _dispatch, status, callback, onclose) {
        var chromeExtPort;
        var chromeExtID = extId;
        var hasExtension;
        var channel = chanId;
        var connectChan = function() {
            console.log("connect to channel " + channel);
            try {
                var chan = new BroadcastChannel(channel);
                _dispatch.on("sendMessage.chan", function(d) {
                    chan.postMessage(d);
                });
                chan.onmessage = function(e) {
                    var d = e.data;
                    _dispatch.call("receiveMessage", this, d);

                };
                _dispatch.on("_disconnect", function(d) {
                    _dispatch.on("sendMessage.chan", null);
                    chan.close();
                    onclose();
                });
                status.connection = "Channel";
                status.id = channel;
                callback(status);

            } catch (e) {
                console.log("your browser doesn't support BroadCastChannel");
                status.connection = "No Connection";
                status.id = "";
                callback(status);
            }
        };
        try {
            chrome.runtime.sendMessage(chromeExtID, {
                    message: "version"
                },
                function(reply) {
                    if (reply) {
                        if (reply.version) {
                            hasExtension = true;
                            connectExt();
                        }
                    } else {
                        hasExtension = false;
                        connectChan();
                    }
                });
        } catch (e) {
            connectChan();
        }
        var connectExt = function() {
            chromeExtPort = chrome.runtime.connect(
                chromeExtID);
            console.log("connect to extension ", chromeExtID);
            _dispatch.on("sendMessage.apps", function(d) {
                chromeExtPort.postMessage(d); //send message to chromeExt
            });
            chromeExtPort.onMessage.addListener(function(d) {
                _dispatch.call("receiveMessage",
                    this, {
                        code: d.code,
                        data: JSON.stringify(
                            d.data)
                    });
            });
            chromeExtPort.onDisconnect.addListener(function(e) {
                console.log("disconnect to extension ", chromeExtID);
                _dispatch.on("sendMessage.apps", null);
                onclose();
            });
            _dispatch.on("_disconnect", function(d) {
                console.log("disconnect to extension ", chromeExtID);
                _dispatch.on("sendMessage.apps", null);
                onclose();
                chromeExtPort.disconnect();
            });
            status.connection = "Extension";
            status.id = chromeExtID;
            callback(status);
        };
    }

    function rot(n, xy, rx, ry) {
        if (ry == 0) {
            if (rx == 1) {
                xy[0] = (n - 1 - xy[0]);
                xy[1] = (n - 1 - xy[1]);
            }
            xy.push(xy.shift());
        }
    }

    function xy2d(x, y, n) {
        var rx, ry, d = 0,
            xy = [x, y];

        for (var s = n / 2; s >= 1; s /= 2) {
            rx = (xy[0] & s) > 0;
            ry = (xy[1] & s) > 0;
            d += s * s * ((3 * rx) ^ ry);
            rot(s, xy, rx, ry);
        }
        return d;
    }

    function d2xy(d, n) {
        var rx, ry, t = d,
            xy = [0, 0];

        for (var s = 1; s < n; s *= 2) {
            rx = 1 & (t / 2);
            ry = 1 & (t ^ rx);
            rot(s, xy, rx, ry);

            xy[0] += (s * rx);
            xy[1] += (s * ry);
            t /= 4;
        }
        return xy;
    }

    function l2n(l){
        var n = 1;
        while(l>=n*n) {
            n*=2;
        }
        return n
    }

    var hilbert = {
        xy2d: xy2d,
        d2xy: d2xy,
        l2n: l2n
    };

    function hilbert$1() {
        var width = 400;
        var chart = function(selection){
            selection.each(function(d){
                console.log("render hilbert curve");
                var range = d3.extent(d);
                var colorScale = d3.scaleLinear();
                if (range[0] < 0 && range[1] > 0) {
                    colorScale.domain([range[0],0,range[1]]).range(["#0F0","#EEE","#F00"]);
                } else if (range[0]>0){
                    colorScale.domain([0,range[1]]).range(["#EEE","#F00"]);
                } else if (range[1]<0){
                    colorScale.domain([range[0],0]).range(["#0F0","#EEE"]);
                } else {
                    colorScale.domain(range).range(["#EEE","#F00"]);
                }

                var el = d3.select(this);
                var l = d.length;
                var n = hilbert.l2n(l);
                var cellsize = width / n;
                for (var i=0;i<d.length;i++) {
                    var xy1 = hilbert.d2xy(i,n);
                    var xy2 = hilbert.d2xy(i+1,n);
                    el.append("line")
                      .attr("x1",xy1[0]*cellsize)
                      .attr("y1",xy1[1]*cellsize)
                      .attr("x2",xy2[0]*cellsize)
                      .attr("y2",xy2[1]*cellsize)
                      .attr("stroke-width",2)
                      .attr("stroke",colorScale(d[i]))
                      .on("mouseover",function(){
                            console.log(d3.mouse(this));
                            var xy = d3.mouse(this);
                            console.log(n, hilbert.xy2d(xy[0]/cellsize,xy[1]/cellsize,n));
                            console.log(4, hilbert.xy2d(xy[0]/100,xy[1]/100,4));
                            var dstart = hilbert.d2xy(hilbert.xy2d(xy[0]/100,xy[1]/100,4),4);
                            console.log(dstart,[dstart[0]+1,dstart[1]+1]);
                            var rect = el.append("rect").attr("opacity","0.1").attr("x",100*dstart[0])
                          .attr("y",100*dstart[1]).attr("width",100).attr("height",100);
                          rect.on("mouseout",function(){
                              d3.select(this).remove();
                          });
                      });
                }

            });
        }; 
        return chart
     }

    // Chart Has Coordinates 
    function hilbertChart() {
        var width = 500;
        var step = 20000;
        var callback = function(d){
            console.log("callback",d);
        };
        var translate = function(i, brushn, n) {
            var fold = n/brushn;
            var step = fold * fold;
            return [step*i,step*(i+1)] 
        };
        var chart = function(selection) {
            var d = selection.datum();
            var el = selection;
            var head = el.append("div");
            console.log("call chart", el, d);
            //add d3 slider depend
            var brushN = 4;
            var myFormat = function(d) {
                return 2 ** d
            };
            var sliderN = d3.sliderTop().min(1).max(5).width(width - 100).ticks(5).default(2).step(1).tickFormat(myFormat)
                .on('onchange', val => {
                    console.log(2 ** val);
                    brushN = 2 ** val;
                    renderIndex(brushN);
                    rect.style("display", "none");
                });
            var svg = el.append("svg").attr("width", width).attr("height", width);
            var gN = svg.append("g").attr("transform", "translate(50,40)");
            gN.call(sliderN);

            //TODO Multiple Values Show 
            //TODO Response
            var range = d3.extent(d);
            var colorScale = d3.scaleLinear();
            if (range[0] < 0 && range[1] > 0) {
                colorScale.domain([range[0], 0, range[1]]).range(["#0F0", "#EEE", "#F00"]);
            } else if (range[0] > 0) {
                colorScale.domain([0, range[1]]).range(["#EEE", "#F00"]);
            } else if (range[1] < 0) {
                colorScale.domain([range[0], 0]).range(["#0F0", "#EEE"]);
            } else {
                colorScale.domain(range).range(["#EEE", "#F00"]);
            }


            var gCurve = svg.append("g").attr("transform", "translate(50,50)");
            var l = d.length;
            var n = hilbert.l2n(l);
            var w = width - 100;
            var cellsize = w / n;
            for (var i = 0; i < d.length; i++) {
                var xy1 = hilbert.d2xy(i, n);
                var xy2 = hilbert.d2xy(i + 1, n);
                gCurve.append("line")
                    .attr("x1", xy1[0] * cellsize)
                    .attr("y1", xy1[1] * cellsize)
                    .attr("x2", xy2[0] * cellsize)
                    .attr("y2", xy2[1] * cellsize)
                    .attr("stroke-width", 2)
                    .attr("stroke", colorScale(d[i]))
                    .on("mouseover", function() {
                        var xy = d3.mouse(this);
                        var size = w / brushN;
                        var xyN = xy.map(function(d) {
                            return Math.floor(d / size)
                        });
                        console.log(brushN, xyN);
                        rect.attr("x", xyN[0] * size).attr("y", xyN[1] * size)
                            .attr("width", size).attr("height", size);
                        rect.style("display", null);
                        rect.on("click", function() {
                            var d = hilbert.xy2d(xyN[0], xyN[1], brushN);
                            console.log("d", brushN, d);
                            var s = translate(d,brushN,n);
                            console.log("chr1:"+s[0]*step+"-"+s[1]*step);
                            //TODO Event 
                            callback([{"chr":"chr1","start":s[0]*step,"end":s[1]*step}]);
                        });
                    });
            }
                    var gIndex = svg.append("g").attr("transform", "translate(100,100)");
            var renderIndex = function(n1) {
                gIndex.selectAll("line").remove();
                var offset = 50 + w / n1 / 2;
                gIndex.attr("transform", "translate(" + offset + "," + offset + ")");
                //TODO Guess N
                var s = 4;
                if (n1 > 16) {
                    s = 2;
                }
                //TODO Guess L
                var f = n/n1 * n/n1;
                var l1 = Math.floor(l/f);
                
                for (var i = 0; i < l1; i++) {
                    var xy1 = hilbert.d2xy(i, n1);
                    var xy2 = hilbert.d2xy(i + 1, n1);

                    gIndex.append("line")
                        .attr("x1", xy1[0] * w / n1)
                        .attr("y1", xy1[1] * w / n1)
                        .attr("x2", xy2[0] * w / n1)
                        .attr("y2", xy2[1] * w / n1)
                        .attr("stroke-width", s)
                        .attr("stroke", "#d6d675")
                        .attr("stroke-opacity", 0.5);
                }
            };
            renderIndex(4);
            var gRect = svg.append("g").attr("transform", "translate(50,50)");
            var rect = gRect.append("rect")
                .attr("opacity", "0.1");
            rect.style("display", "none");

            var gCtrl = svg.append("g").attr("transform","translate("+(width-20)+",50)");
            gCtrl.append("circle")
                .attr("r",5)
                .attr("fill","green")
                .on("click",function(){
                    if (gCurve.style("display") == "none") {
                        gCurve.style("display",null);
                        d3.select(this).attr("fill","green");
                    } else {
                        gCurve.style("display","none");
                        d3.select(this).attr("fill","grey");
                    }
                });
                


        };
        chart.callback=function(_) {return arguments.length ? (callback= _, chart) : callback; };
        return chart
    }

    //TODO : Genome Coordinates To Hilbert Coordinates Translator
    //       Multiple Scale
    //GOAL : Add Bed as Circle in Hilbert Coordinates
    //

    function coord() {
        var regions; //coordinates domain
        var bin; //resolution size , mininum bin
        var chart = function(r) {
            var l = totalLength(regions);
            var n = hilbert.l2n(l/bin);
            var coord = coords().regions(regions).gap(0).width(l/bin);
            // generate n x n matrix coordinates
            var ds = coord(r); 
            var xys = [];
            ds.forEach(function(d){
                var s = Math.floor(d.x);
                var e = Math.ceil(d.x + d.l);
                for(var i=s;i<e;i++){
                    var xy = hilbert.d2xy(i,n);
                    xys.push(xy);
                }
            });
            return {data:xys,n:n} //TODO 
        };
        chart.bin = function(_) {
            return arguments.length ? (bin = _, chart) : bin;
        };
        chart.regions = function(_) {
            return arguments.length ? (regions = _, chart) : regions;
        };
        return chart
    }

    function getBand(genome, callback) {
        var chrBands = {};
        fetch("/static/data/cytoband/" + genome + ".cytoBand.txt", {
            "credentials": "include"
        }).then(function(res) {
            res.text().then(function(d) {
                var l = d.split("\n");
                l.forEach(function(d) {
                    var a = d.split("\t");
                    var c = a[0];
                    var s = parseInt(a[1]);
                    var e = parseInt(a[2]);
                    var band = a[3];
                    if (!(c in chrBands)) {
                        chrBands[c] = {
                            "band": []
                        };
                    }
                    chrBands[c]["band"].push({
                        "chr":c,
                        "start": s,
                        "end": e,
                        "id": band,
                        "value":a[4]
                    });
                });
                callback(chrBands);
            });
        }).catch(function(e) {
            callback(null);
        });
    }

    function logo(){

    }


    //TODO convert this to javascript
    /*
    <svg height="100" width="100" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
         <radialGradient id="grad1" cx="70%" cy="50%" r="60%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:rgb(255,255,255);
          stop-opacity:0" />
          <stop offset="100%" style="stop-color:#000;stop-opacity:0.8" />
        </radialGradient>
        <g id="charN">
        <path d="M 43.848 1.953 L 66.895 1.172 L 63.379 67.383 L 37.793 69.727 L 24.121 34.277 L 21.973 70.41 L 0 70.41 L 1.758 1.172 L 26.172 0 L 43.066 35.156 L 43.848 1.953 Z" vector-effect="non-scaling-stroke"/></g>
        </g>
        <g id="charB">
        <path d="M 0.098 67.676 L 0 4.785 A 57.841 57.841 0 0 1 4.669 3.105 A 65.393 65.393 0 0 1 5.811 2.759 A 66.496 66.496 0 0 1 12.085 1.245 Q 15.283 0.635 18.457 0.317 A 62.649 62.649 0 0 1 23.862 0.005 A 56.598 56.598 0 0 1 24.609 0 A 56.835 56.835 0 0 1 31.616 0.439 A 38.643 38.643 0 0 1 38.428 1.904 Q 41.699 2.93 44.531 4.565 A 19.855 19.855 0 0 1 49.487 8.594 A 17.623 17.623 0 0 1 52.713 13.913 A 19.98 19.98 0 0 1 52.808 14.16 A 18.046 18.046 0 0 1 53.758 17.924 A 24.625 24.625 0 0 1 54.004 21.484 A 16.976 16.976 0 0 1 53.583 25.316 A 15.175 15.175 0 0 1 53.223 26.611 Q 52.441 29.004 50.977 30.908 A 13.9 13.9 0 0 1 47.412 34.155 A 15.06 15.06 0 0 1 43.566 35.894 A 17.486 17.486 0 0 1 42.676 36.133 A 21.453 21.453 0 0 1 47.632 38.09 A 19.754 19.754 0 0 1 48.462 38.574 Q 51.074 40.186 52.905 42.48 Q 54.736 44.775 55.737 47.656 A 18.397 18.397 0 0 1 56.728 53.148 A 21.006 21.006 0 0 1 56.738 53.809 A 18.509 18.509 0 0 1 56.453 57.14 A 13.288 13.288 0 0 1 55.249 60.791 Q 53.76 63.721 51.27 65.771 A 21.005 21.005 0 0 1 46.528 68.693 A 24.175 24.175 0 0 1 45.532 69.116 Q 42.285 70.41 38.77 71.143 Q 35.254 71.875 31.714 72.119 A 107.341 107.341 0 0 1 28.29 72.302 A 86.647 86.647 0 0 1 25.098 72.363 Q 22.07 72.363 18.823 72.144 A 66.739 66.739 0 0 1 12.354 71.387 A 55.979 55.979 0 0 1 6.006 69.946 A 36.117 36.117 0 0 1 0.098 67.676 Z M 22.266 42.188 L 22.07 53.32 A 54.975 54.975 0 0 0 23.511 53.589 A 8.181 8.181 0 0 0 24.902 53.711 A 11.147 11.147 0 0 0 26.047 53.649 A 14.841 14.841 0 0 0 27.148 53.491 A 6.583 6.583 0 0 0 29.443 52.612 A 5.479 5.479 0 0 0 31.215 50.848 A 6.299 6.299 0 0 0 31.226 50.83 A 4.202 4.202 0 0 0 31.722 49.662 Q 31.934 48.866 31.934 47.852 Q 31.934 46.405 31.503 45.373 A 4.158 4.158 0 0 0 31.226 44.824 Q 30.518 43.652 29.492 42.993 A 6.115 6.115 0 0 0 27.246 42.114 A 14.709 14.709 0 0 0 26.074 41.949 A 11.047 11.047 0 0 0 25 41.895 Q 23.584 41.895 22.266 42.188 Z M 22.559 21.68 L 22.266 32.52 A 16.622 16.622 0 0 0 23.163 32.493 Q 23.581 32.471 24.052 32.428 A 36.195 36.195 0 0 0 25.049 32.324 A 11.484 11.484 0 0 0 28.247 31.47 A 6.865 6.865 0 0 0 30.859 29.517 A 4.383 4.383 0 0 0 31.696 27.88 Q 31.874 27.245 31.919 26.492 A 8.719 8.719 0 0 0 31.934 25.977 A 5.717 5.717 0 0 0 31.825 24.836 A 4.141 4.141 0 0 0 31.348 23.56 A 5.646 5.646 0 0 0 30.427 22.368 A 5.037 5.037 0 0 0 29.907 21.924 A 5.843 5.843 0 0 0 28.052 20.996 Q 27.051 20.703 26.27 20.703 A 6.287 6.287 0 0 0 24.365 20.996 A 17.19 17.19 0 0 0 22.559 21.68 Z" vector-effect="non-scaling-stroke"/>
        </g>  
      </defs>
      <g id="icon" transform="scale(0.2)">
        <circle cx=250 cy=250 r=250 fill="#F0F0F0" opacity=1.0></circle>
        <g transform="translate(175,175)">
        <use xlink:href="#charN" fill="#226A98" transform="scale(2)"/> 
        </g> 
         <g transform="translate(325,175)">
        <use xlink:href="#charB" fill="#CE5156" transform="scale(2)"/> 
        </g>   
    </g>
    </svg>
    */

    exports.bw = bw;
    exports.chan = chan;
    exports.coords = coords;
    exports.curveHilbert = hilbert$1;
    exports.curveHilbertChart = hilbertChart;
    exports.curveHilbertCoord = coord;
    exports.downloadSvg = downloadSvg;
    exports.getBand = getBand;
    exports.layoutSvg = layout;
    exports.loadGoogleSheet = loadGoogleSheet;
    exports.logo = logo;
    exports.parseBed = parseBed;
    exports.parsePrettyRegions = parsePrettyRegions;
    exports.printHubs = hubs;
    exports.printSvg = print;
    exports.regionsText = regionsText;
    exports.renderChr = chr;
    exports.svgTabPrint = svgTabPrint;
    exports.trackBw = trackBw;
    exports.trackChr = trackChr;
    exports.trackHic = trackHic;
    exports.trackScale = trackScale;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
