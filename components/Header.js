var e = React.createElement;


toggleicon = e('span', {className:"navbar-toggler-icon"});
toggle = e('button', {className:"navbar-toggler", type:"button"}, toggleicon)
logo = e('a', {className:"navbar-brand"}, "Ivan Lin");
container = e('div', {className:"container"}, logo);
navbar = e('ol', {className:"navbar navbar-expand-lg navbar-dark bg-dark fixed-top"}, container);

ReactDOM.render(navbar, document.getElementById("root"));