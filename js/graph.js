import { LABEL_TO_COLUMN, RACES, RACE_COLORMAP, PCP_AXES } from './constants.js'
import { registerChangeCallback, triggerCallback, deleteSelection, getSelectionCount, addSelection, getTheme } from './helper.js'

export function drawRidgelinePlot(element, data) {
    var margin = {top: 50, right: 30, bottom: 50, left: 80};
    let width = $(element).width();
    let height = $(element).height();

    var svg = d3.select(element)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + width + " " + height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var categories = Object.keys(RACE_COLORMAP);//RACES;
    var n = categories.length

    // X axis
    var x = d3.scaleLinear()
        .domain([ 0, d3.max(data, function(d) { return d.HouseholdIncomeOutcome; }) ])
        .range([ 0, width - margin.left]);
    svg.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0," + (height - margin.top - margin.bottom) + ")")
        .call(d3.axisBottom(x).tickValues([0, 10000, 20000, 30000, 40000, 50000, 60000]))
        .select(".domain").remove()
    // svg.append("text")
    //     .attr("text-anchor", "end")
    //     .attr("x", width - margin.left - margin.right)
    //     .attr("y", height - margin.top - margin.bottom + 40)
    //     .text("Median Household Income");

    // Y axis
    var selectedRaces = {};
    RACES.forEach((r)=> selectedRaces[r] = true);
    selectedRaces["NativeAmerican"] = true;
    
    var y = d3.scaleLinear()
        .domain([0, 0.001])
        .range([ height - margin.bottom, 0]);
    var yName = d3.scaleBand()
        .domain(RACES)
        .range([0, height - margin.top - margin.bottom])
        .paddingInner(1)
    svg.append("g")
        .call(d3.axisLeft(yName).tickSize(0))
        .on("click", function(e,d) {
            let targetRace = e.path[0].textContent;
            if (targetRace == "Native American") { targetRace = "NativeAmerican"; }
            selectedRaces[targetRace] = !selectedRaces[targetRace];
            let selection = data.filter((d) => selectedRaces[d["name"].split("Race")[1]]);

            let curr_element = d3.select('#density-name-' + targetRace)
            curr_element.attr('opacity', (d) => curr_element.style("opacity") == 1 ? 0.3 : 1)

            addSelection("ridgeline", selection);
            triggerCallback("brush");
            triggerCallback("pcp-brush");
            triggerCallback("ridgeline");
        })
        .select(".domain").remove()

    svg.selectAll(".tick")
        .filter((d) => !Number.isInteger(d))
        .attr("class", "density-names")
        .attr("fill", "white")
        .attr("id", (d)=>{return "density-name-" + String(d).replace(" ", "")})

    addSelection("ridgeline", data);

    function calculateDensities(useSelected) {
        var kde = kernelDensityEstimator(kernelEpanechnikov(300), x.ticks(60))
        var allDensity = []
        var total = 0;
        for (let i = 0; i < n; i++) {
            let key = categories[i]
            if (key == "Native American") {
                key = "NativeAmerican";
            }
            let density = kde( data
                .filter( function(d) { if (useSelected) { return d.selected >= getSelectionCount(); } else { return d; } })
                .filter( function(d) { return d["name"].split("Race")[1] === key && d.HouseholdIncomeOutcome !== '0'; } )
                .map(function(d){ return d.HouseholdIncomeOutcome; }) )
            
            density = density.map(function(d) { if (d[1] === undefined) { return [d[0], 0]; } else { return d; }})
            var density_max = d3.max(density, function(d) { return +d[1];});
            total += density_max
            
            allDensity.push({key: key, density: density})
        }

        let yHeight = total != 0 ? total : 0.001

        y = d3.scaleLinear()
            .domain([0, yHeight])
            .range([ height - margin.bottom, 0]);

        svg.selectAll("path").remove()

        svg.selectAll("areas")
            .data(allDensity)
            .enter()
            .append("path")
            .attr("id", (d, i)=>'ridgeline-'+d.key)
            .attr("class",  (d)=> `.${d.key}`)
            .attr("transform", function(d){
                if (d.key === 'NativeAmerican'){
                    return("translate(0," + (yName("Native American")-height+margin.bottom) +")" )
                } else {
                    return("translate(0," + (yName(d.key)-height+margin.bottom) +")" )
                }
            })
            .attr("class", function(d){ return d.key; })
            // .attr("fill", function(d){ return RACE_COLORMAP[d.key]; })
            .datum(function(d){ return(d.density); })
            .attr("opacity", 0.7)
            .attr("stroke", "#000")
            .attr("stroke-width", 0.1)
            .attr("d",  d3.line()
                .curve(d3.curveBasis)
                .x(function(d) { return x(d[0]); })
                .y(function(d) { return y(d[1]); })
            )
            .on("click", function(e,d) {
                console.log(getSelectionCount())
                let targetRace = e.target.className.baseVal;
                selectedRaces[targetRace] = !selectedRaces[targetRace];
                
                let selection = data.filter((d) => selectedRaces[d["name"].split("Race")[1]]);

                let curr_element = d3.select('#density-name-' + targetRace)
                curr_element.attr('opacity', (d) => curr_element.style("opacity") == 1 ? 0.3 : 1)

                addSelection("ridgeline", selection);
                triggerCallback("brush");
                triggerCallback("pcp-brush");
                triggerCallback("ridgeline");
            })
            .on('mouseover', (d,i)=> d3.select('#' + d.srcElement.id).style('opacity', '1'))
            .on('mouseout', (d,i)=> d3.select('#' + d.srcElement.id).style('opacity', '0.7'))
    }

    calculateDensities(false)
        
    registerChangeCallback("ridgeline", function() { return calculateDensities(true); });

    function clearBrush() {
        RACES.forEach((r)=> selectedRaces[r] = true);
        selectedRaces["NativeAmerican"] = true;
    }
    
    registerChangeCallback("clear", clearBrush);
}

export function drawDensityPlot(element, data) {
    let width = $(element).width();
    let height = $(element).height();
    
    var margin = {top: 30, right: 30, bottom: 80, left: 70};

    var svg = d3.select(element)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + width + " " + height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // X axis
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d.HouseholdIncomeOutcome; })])
        .range([0, width - margin.right - margin.left]);
    svg.append("g")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")")
        .call(d3.axisBottom(x));
  
    // Y axis
    var y = d3.scaleLinear()
              .range([height - margin.bottom, 0])
              .domain([0, 0.0005]);
    svg.append("g")
        .call(d3.axisLeft(y));
  
    var kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(60))

    for (var race in RACE_COLORMAP) {
        var density = kde( data
            .filter( function(d){ return d["name"].split("Race")[1] === race && d.HouseholdIncomeOutcome !== '0'; } )
            .map(function(d){ return d.HouseholdIncomeOutcome; }) )
        
        svg.append("path")
            .attr("class", "density-path")
            .datum(density)
            .attr("class", (d)=>d['name'].split("Race")[1])
            // .attr("fill", RACE_COLORMAP[race])
            .attr("opacity", ".6")
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("d",  d3.line()
            .curve(d3.curveBasis)
                .x(function(d) { return x(d[0]); })
                .y(function(d) { return y(d[1]); })
            );
    }
}

function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(function(x) {
            return [x, d3.mean(V, function(v) { return kernel(x - v); })];
        });
    };
}

function kernelEpanechnikov(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}

export function drawScatterplot(element, title, x_label, y_label, csv_data) {

    let x_values = csv_data.map((val) => { return parseFloat(val[LABEL_TO_COLUMN[x_label]]); });
    let y_values = csv_data.map((val) => { return parseFloat(val[LABEL_TO_COLUMN[y_label]]); });
    
    let x_max = Math.max(...x_values);
    let y_max = Math.max(...y_values);

    let width = $(element).width();
    let height = $(element).height();

    
    var margin = {top: 30, right: 30, bottom: 80, left: 70};

    var svg = d3.select(element)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + width + " " + height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // X axis
    var x = d3.scaleLinear()
        .domain([0, x_max])
        .range([ 0, width - margin.right - margin.left]);
    svg.append("g")
        .attr("transform", "translate(0," + (height - margin.bottom) + ")")
        .call(d3.axisBottom(x));

    svg.append("text")
        .attr("transform", "translate(" + ((width - margin.left - margin.right)/2) + " ," + (height - margin.top - 10) + ")")
        .style("text-anchor", "middle")
        .style("opacity", 1)
        .attr("font-family" , "Roboto")
        .text(x_label);

    // Y axis
    var y = d3.scaleLinear()
        .domain([0, y_max])
        .range([ height - margin.bottom, 0 ])
    svg.append("g")
        .call(d3.axisLeft(y));
    
    svg.append("text") 
        .attr("transform", "translate(" + -45 + " ," + ((height - margin.bottom)/2) + ")rotate(-90)")
        .style("text-anchor", "middle")
        .style("opacity", 1)
        .attr("font-family" , "Roboto")
        .text(y_label);

    // Dots
    var dots = svg.selectAll("dot")
            .data(csv_data)
            .enter()
            .append("circle")
                .attr("class", "scatter-dot")
                .attr("class", (d)=>d['name'].split("Race")[1])
                .attr("cx", function (d) { return x(d[LABEL_TO_COLUMN[x_label]]); } )
                .attr("cy", function (d) { return y(d[LABEL_TO_COLUMN[y_label]]); } )
                .attr("r", 1.5)
                .attr("opacity", (d)=>d.selected >= getSelectionCount() ? 1.0 : 0.0)
                // .style("fill", (d)=>RACE_COLORMAP[d['name'].split("Race")[1]]);

    function filterBySelection() {
        dots.attr("opacity", (d)=>d.selected >= getSelectionCount() ? 1.0 : 0.0);
    }
    registerChangeCallback("brush", filterBySelection);

    var brush = d3.brush()
        .extent( [ [0,0], [width - margin.right - margin.left, height - margin.bottom] ] )
        .on("brush end", function(e) {
            // deleteSelection(title);
            if (e.selection != null) {
                let x_min = x.invert(Math.min(e.selection[0][0], e.selection[1][0])),
                    x_max = x.invert(Math.max(e.selection[0][0], e.selection[1][0])),
                    y_max = y.invert(Math.min(e.selection[0][1], e.selection[1][1])),
                    y_min = y.invert(Math.max(e.selection[0][1], e.selection[1][1]));
                // deleteSelection(title);
                let selection = csv_data.filter(function(d) {
                    let xcor = d[LABEL_TO_COLUMN[x_label]];
                    let ycor = d[LABEL_TO_COLUMN[y_label]];
                    return xcor >= x_min && xcor <= x_max && ycor >= y_min && ycor <= y_max;
                });
                addSelection(title, selection);
            } else {
                deleteSelection(title);
            }
            triggerCallback("brush");
            triggerCallback("pcp-brush");
            triggerCallback("ridgeline");
        })

    function clearBrush() {
        svg.call(brush.move, null);
    }
    registerChangeCallback("clear", clearBrush);
    svg.call(brush);
}

export function drawPcp(element, data) {
    var dimensions;
    var margin = {top: 40, right: 50, bottom: 20, left: 100};
    let width = $("#pcp").width()
    let height = $("#pcp").height()

    var svg = d3.select(element).append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.bottom + margin.top))
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scalePoint().range([0, width]),
    y = {},
    dragging = {};

    var axis = d3.axisLeft();

    // Dimensions
    x.domain(dimensions = Object.keys(PCP_AXES).filter(function(d) {
        return y[d] = d3.scaleLinear()
            .domain(d3.extent(data, function(p) { return +p[d]; }))
            .range([height - margin.bottom, 0])
    }));

    // Lines
    var background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
            .attr("d", path)
            .style("fill", "none")
            .attr("class", (d)=>d['name'].split("Race")[1])
            // .style("stroke", function(d) {
            //     return RACE_COLORMAP[d["name"].split("Race")[1]]
            // })
            .style("opacity", 0.02)

    var foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
            .attr("d", path)
            .style("fill", "none")
            .attr("class", (d)=>d['name'].split("Race")[1])
            // .style("stroke", function(d) {
            //     return RACE_COLORMAP[d["name"].split("Race")[1]]
            // })
            .style("opacity", 0.2)

    // Axis
    svg.selectAll(".axis")
        .data(dimensions)
        .enter()
        .append("g")
            .attr("class", "axis")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            .call(d3.drag()
                .subject(function(d) { return { x: x(d) }; })
                .on("start", function(e, d) {
                    dragging[d] = x(d);
                })
                .on("drag", function(e, d) {
                    dragging[d] = Math.min(width + 20, Math.max(-20, e.x));
                    foreground.attr("d", path);
                    dimensions.sort(function(a, b) { return position(a) - position(b); });
                    x.domain(dimensions);
                    svg.selectAll('.axis').attr("transform", function(d) { return "translate(" + position(d) + ")"; })
                })
                .on("end", function(e, d) {
                    delete dragging[d];
                    transition(foreground).attr("d", path);
                    transition(svg.selectAll('.axis')).attr("transform", function(d) { return "translate(" + position(d) + ")"; })
                }));

    svg.selectAll('.axis')
        .append("g")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("text")
            .attr("class", "axis-title")
            .attr("font-size", "16px")
            .style("text-anchor", "middle")
            .attr("y", -10)
            .text(function(d) { return PCP_AXES[d]; });

    // Brushing
    var gbrush = svg.selectAll(".axis")
        .append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(y[d].brush = d3.brushY()
            .extent([[-10,0], [10,y[d].range()[0]]])
            .on("start", brushstart)
            .on("brush", brush)
            .on("end", brush)
            )
        })
        .selectAll("rect")
            .attr("x", "-8px")
            .attr("width", "16px");

    function filterBySelection() {
        foreground.style("display", (d)=>{return d.selected == getSelectionCount() ? null : "none"});
    }
    registerChangeCallback("pcp-brush", filterBySelection);
    
    function clearBrush() {
        svg.selectAll(".brush .selection")
            .attr("y", null)
            .attr("height", null)
    }
    registerChangeCallback("clear", clearBrush);

    function position(d) {
        var v = dragging[d];
            return v == null ? x(d) : v;
    }

    function transition(g) {
        return g.transition().duration(500);
    }

    function path(d) {
        return d3.line()(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
    }

    function brushstart(event) {
        event.sourceEvent.stopPropagation();
    }

    function brush() {
        var actives = []
        var selection = []

        svg.selectAll(".axis .brush")
            .each(function(d) {
                let extent = null
                let brush_y = this.childNodes[1].getAttribute("y")
                let brush_height = this.childNodes[1].getAttribute("height")

                if (brush_y !== null) {
                    extent = []
                    extent[0] = parseFloat(brush_y);
                    extent[1] = parseFloat(brush_y) + parseFloat(brush_height);
                }

                actives.push({
                    dimension: d,
                    extent: extent
                });
            });
        let validActives = actives.reduce((prev, cur)=> cur.extent !== null ? prev + 1 : prev, 0);
        foreground.style("display", function(d) {
            var brushed = false;
            let count_actives = 0;
            actives.forEach(function(active) {
                if (active.extent !== null) {
                    if (active.extent[0] <= y[active.dimension](d[active.dimension])
                        && y[active.dimension](d[active.dimension]) <= active.extent[1]) {
                        brushed = true;
                        count_actives++;
                        if (count_actives >= validActives) {
                            selection.push(d);
                        }
                        return;
                    }
                }
            });
            return brushed ? null : "none";
        });

        if (validActives > 0) {
            addSelection("pcp", selection);
        } else {
            deleteSelection("pcp");
        }

        triggerCallback("brush");
        triggerCallback("pcp-brush");
        triggerCallback("ridgeline");
    }
}