import { drawDensityPlot, drawScatterplot, drawPcp, drawRidgelinePlot } from './graph.js'
import { resetSelections, triggerCallback, toggleTheme, getSelectionCount } from './helper.js'
import { RACES, RACE_COLORMAP } from './constants.js'

function srs(data, limit) {
    Math.seedrandom('cse564-project');
    let chosen_cz = data.map((d) => ({name: d['name'].split("Race")[0], sort: Math.random()}))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.name)
        .slice(0,limit)
    return data.filter((d) => chosen_cz.indexOf(d['name'].split("Race")[0]) >= 0)
}

function setup() {
	d3.csv("../data/commuting_zone_zeroed.csv").then(function(data) {
        data = srs(data, 200);
        data.forEach(element => {
            element.selected = 0;
        });
        
        drawRidgelinePlot("#density-plot", data)
        // drawDensityPlot("#density-plot", data)
        drawScatterplot("#scatterplot-top-mid", "Household Income vs Median Household Income", 
        	"Median Household Income", "Household Income", data)
        drawScatterplot("#scatterplot-top-right", "College Graduation Rate vs Poverty Rate", 
        	"Poverty Rate", "College Graduation Rate", data)
        // drawScatterplot("#scatterplot-bottom-right", "College Graduation Rate vs Census Response Rate", 
        // 	"Census Response Rate", "College Graduation Rate", data)
        drawScatterplot("#scatterplot-bottom-right", "College Graduation Rate vs Neighborhood College Graduates", 
        	"Neighborhood College Graduates", "College Graduation Rate", data)
        drawPcp("#pcp", data)

        console.log(getSelectionCount())
        $(document).on('click','#reset-button', function() {
            $(".density-names").css("opacity", 1);
            triggerCallback("clear");
            resetSelections();
        })
    });

    $("#theme-toggle").on("click", function(){
        if ($("#theme-bg").attr("href") == "css/dark.css") {
            $("#theme-bg").attr("href", "css/light.css");
        } else {
            $("#theme-bg").attr("href", "css/dark.css");
        }
        toggleTheme();
    });
}

setup();