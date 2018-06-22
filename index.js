
const JSON_2_JSONP_URL = "https://json2jsonp.com/";
function createRestCountriesUrl(country) {
const url = "https://restcountries.eu/rest/v2/name/";
return `https://restcountries.eu/rest/v2/name/${country}?fullText=true`;
}

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
	const countries = Object.keys(teams).reduce((acc, key) => {
		return [...acc, ...teams[key]];
	}, 	[])		
	return countries.sort();
}

function renderSelectCountryOptions() {
	const allTeams = generateSelectCountryOptions(teams);
	console.log(allTeams);
	const options = allTeams.map(team => {
		return `<option value=${team}> ${team} </option>`;
	})
	console.log(options);
	$('#countries').html(options);
}
//user selects country
function handleCountrySelection(event) {
	event.preventDefault();
	console.log ("handleCountrySelection ran");
	const country = $('#countries option:selected').val();
	console.log(country);
	displayCountryFlag(country, countryCodes);
	displayCountryName(country);
}

//get API data

function getFootballDataApiData() {}
function getLiveScoreApiData() {}
function getWikipediaApiData() {}

//API callback functions 
function callbackCountryFlag(data) {
	displayCountryFlag(data);
}
function callbackFootballData(data) {}
function callbackLiveScore(data) {}
function callbackWikipedia(data) {}

//display functions
function displayCountryFlag(country, countryCodes) {
	console.log("displayCountryFlag has ran country is", country);
	const countryCode = Object.keys(countryCodes).reduce((acc, key) => {
		console.log(key, countryCodes[key], country);
		if (countryCodes[key] === country) {
			acc = key;
		}
		return acc;
	}, "BR");
	$('.js-flag img').attr({ 
			src: `http://www.countryflags.io/${countryCode}/flat/64.png`, 
			alt: `${country}'s country flag` 
	});
}
function displayCountryName(country) {
	$('.js-country-name h2').html(country.toUpperCase());
}
function displayLatestScore() {}
function displayTeamRoster() {}
function displayTimeline() {}
function displayTeamHistory() {}

//renders country profile (flag, country name, latest results, timeline, roster, history)

$(renderSelectCountryOptions());