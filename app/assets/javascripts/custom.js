var ready = function ready(){
	loadListeners();
}

var loadListeners = function loadListeners(){
	if ($("#resume").length){
		$("#resume").css("height",$(window).height()-$("#resume").offset().top);
		$("#toggle-resume").on("click", function(){
			$("#resume-container").toggle();
		});
	}
}

$(document).on('turbolinks:load', ready);