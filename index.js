
const FIFA_FIXTURES_URL = "https://fifa-2018-apis.herokuapp.com/fifa/fixtures";
const FOOTBALL_DATA_TEAMS_URL = 'https://api.football-data.org/v1/competitions/467/teams';
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php";
let groupStageFixtures = [];
let roster = [];
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

//functions that retrieve FIFA fixture data and build groupStageFixtures array

		function buildGroupStageFixturesObj() {
			getFixturesApiData(callbackFixtureData);
			
		}
		function getFixturesApiData(callback) {
		  	$.getJSON(FIFA_FIXTURES_URL, callback);
		}

		function callbackFixtureData(data) {
			groupStageFixtures = assignGroupStageFixtures(data);
			getAllResultsApiData(groupStageFixtures);
		}

		function assignGroupStageFixtures(data, groupStageFixtures) {
		  	const fixtures = data.data.group_stages;
		  	return createFixtures(fixtures);
		  	
		}

		function createFixtures(fixtures) {
			const allFixtures = Object.keys(fixtures).reduce((acc, date) => {
		    	const matches = fixtures[date].reduce((acc2, match) => {
		    		const fixtureUnix = Date.parse(match.datetime);
		      		if (fixtureUnix < Date.now()) {
		        		acc2.push(match);
		        	}
		    		return acc2;
		    	}, [])
		    	return [...acc, ...matches];
		    }, []);
		  for (let i = 0; i < allFixtures.length; i++) {
		  	const apiUrl = createMatchResultsApiUrl(allFixtures[i].link);
		  	allFixtures[i].link = apiUrl;
		  }
		  	return allFixtures;
		}

		function createMatchResultsApiUrl(link) {
			return "https://fifa-2018-apis.herokuapp.com/fifa/live" + link;
		}

		function getAllResultsApiData(groupStageFixtures) {
			groupStageFixtures.forEach(function(match, i) {
		  		getResultsApiData(match.link, callbackResultsData, groupStageFixtures, i)
		  	})
		}

		function getResultsApiData(apiUrl, callbackFunc, fixturesArr, index) {
			$.ajax({
		  url: apiUrl,
		  dataType: 'json',
		  type: 'GET',
		}).done(function(response) {
		 	callbackFunc(response, fixturesArr, index);
		})
		}

		function callbackResultsData(data, fixturesArr, index) {
			fixturesArr[index].results = data.data;
		}

//functions that create country list and render country options in select tag
	function generateSelectCountryOptions(teams) {
		const countries = Object.keys(teams).reduce((acc, key) => {
			return [...acc, ...teams[key]];
		}, 	[])		
		return countries.sort();
	}

	function renderSelectCountryOptions() {
		const allTeams = generateSelectCountryOptions(teams);
		const options = allTeams.map(team => {
			return `<option value='${team}'> ${team} </option>`;
		})
		$('#countries').html(options);
	}

//functions that retrieve roster from football data and build roster array
	function getRosterArray(country) {
		console.log("getRosterArray ran");
		getFootballDataApiData(FOOTBALL_DATA_TEAMS_URL, callbackFootballDataApiData, country)
	}

	function getFootballDataApiData(apiUrl, callbackFunc, country) {
		console.log("getFootballDataApiData ran with apiUrl:", apiUrl);
		$.ajax({
  			headers: { 'X-Auth-Token': 'f7302355bfde4075a668246ec2d7056e' },
  			url: apiUrl,
  			dataType: 'json',
  			type: 'GET',
		}).done(function(response) {
			console.log("getFootballDataApiData request is done")
 			callbackFunc(response, country);
		});
	}

	function callbackFootballDataApiData(response, country) {
		console.log("callbackFootballDataApiData ran");
		const teams = response.teams;
  		const FOOTBALL_DATA_PLAYERS_URL = teams.reduce((acc, team) => {
  			if (team.name === country) {
  				const href = team._links.players.href;
  				acc = href.substring(0, 4) + "s" + href.substring(4);
  			}
  			return acc;
  		}, "");
  		getFootballDataApiData(FOOTBALL_DATA_PLAYERS_URL, callbackFootballDataApiPlayerData);
	}

	function callbackFootballDataApiPlayerData(response){
		roster = buildRosterArray(response);
		console.log(roster);
	}

	function buildRosterArray(response) {
		const players = response.players;
		return players.sort(function(a, b) {
			if (a.jerseyNumber < b.jerseyNumber) {
    			return -1;
  			} else if (a.jerseyNumber > b.jerseyNumber) {
    			return 1;
  			}
  			return 0;
		});
	}

//function that handles submit country event
	function handleCountrySelection(event) {
		event.preventDefault();
		const country = $('#countries option:selected').val();
		getRosterArray(country);
	}
function startWorldCupApp() {
	buildGroupStageFixturesObj();
	renderSelectCountryOptions();
}

$(startWorldCupApp());