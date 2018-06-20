
const teams = {
	groupA: ["Russia", "Saudi Arabia", "Egypt", "Uruguay"],
	groupB: ["Portugal", "Spain", "Morocco", "Iran"],
	groupC: ["France", "Australia", "Peru", "Denmark"],
	groupD: ["Argentina", "Iceland", "Croatia", "Nigeria"],
	groupE: ["Brazil", "Switzerland", "Costa Rica", "Serbia"],
	groupF: ["Germany", "Mexico", "Sweden", "South Korea"],
	groupG: ["Belgium", "England", "Tunisia", "Panama"],
	groupH: ["Poland", "Senegal", "Colombia", "Japan"],
}


//page loads
function generateSelectCountryOptions(teams) {
	let allTeams = [];
	Object.keys(teams).forEach(function(key) {
		for (let i = 0; i < teams[key].length; i++) {
			allTeams.push(teams[key][i])
		}
	})
		
	return allTeams.sort();
	

}

function renderSelectCountryOptions() {
	let allTeams = generateSelectCountryOptions(teams);
	console.log(allTeams);
	let options = allTeams.map(team => {
		return `<option value=${team}> ${team} </option>`
	})
	console.log(options)
	$('#countries').html(options);
}
//user selects country
function handleCountrySelection() {
}

//renders country profile (flag, country name, latest results, timeline, roster, history)

renderSelectCountryOptions(generateSelectCountryOptions(teams));