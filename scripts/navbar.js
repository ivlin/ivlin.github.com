feather.replace({width:25, height:25, color:'white'});
var icons=[]
icons.push(document.getElementsByClassName("feather-user")[0]);
icons.push(document.getElementsByClassName("feather-book-open")[0]);
icons.push(document.getElementsByClassName("feather-briefcase")[0]);
icons.forEach(function(el){
    el.setAttribute("width",150);
    el.setAttribute("height",150);
    el.setAttribute("color","black");
});