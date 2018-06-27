
const FIFA_FIXTURES_URL = "https://fifa-2018-apis.herokuapp.com/fifa/fixtures";
const FOOTBALL_DATA_TEAMS_URL = 'https://api.football-data.org/v1/competitions/467/teams';
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php";
let groupStageFixtures = [];
let country = '';
let roster = [];
let history = {};
let allResults = [];
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

//retrieve FIFA fixture data and build groupStageFixtures array

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
			fixturesArrayIsReady();
		}

		function fixturesArrayIsReady() {
			fixIran();
		  	enableCountrySelectionSubmit();
		}

		function enableCountrySelectionSubmit(){
			$('#country-submit').removeAttr("disabled");
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

		function fixIran() {
			groupStageFixtures.forEach(function (fixture) {
				if (fixture.home_team === "IR Iran") {
					fixture.home_team = "Iran";
				}
				if (fixture.away_team === "IR Iran") {
					fixture.away_team = "Iran";
				}
			})
		}

//create country list and render country options in select tag
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

//assign country variable
	function assignCountryVar(countrySelection) {
		country = countrySelection;
	}

//retrieve roster from football data and build roster array
	function getRosterArray(country) {
		console.log("getRosterArray ran");
		getFootballDataApiData(FOOTBALL_DATA_TEAMS_URL, callbackFootballDataApiData, country);
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

	function callbackFootballDataApiPlayerData(response, country){
		updateRosterArray(response);
		displayRoster();	}

	function updateRosterArray(response) {
		roster = buildRosterArray(response);
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

//retrieve wikipedia data and places in variable
	function getHistoryInfo(country){
		getWikipediaApiData(country);
	}

	function getWikipediaApiData(country) {
		console.log('getWikipediaApiData has ran');
		const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=${country}_national_football_team&callback=?`;
	    $.ajax({
	        type: "GET",
	        url: apiUrl,
	        contentType: "application/json; charset=utf-8",
	        async: false,
	        dataType: "json",
	        success: function (data, textStatus, jqXHR) {
	            buildHistoryString(data);
	            displayTeamHistory(history);
	        },
	        error: function (errorMessage) {
	        }
	    });
	}

	function buildHistoryString(data) {
		history = data;
	}

//display flag
	function displayFlag(country) {
		const url = getFlagUrl(country);
		renderFlag(url, country);
	}

	function getFlagUrl(country) {
		return groupStageFixtures.reduce((acc, fixture) => {
			if (fixture.home_team === country) {
				acc = fixture.home_flag;
			}
			if (fixture.away_team === country) {
				acc = fixture.away_flag;
			}
			return acc;
		})
	}

	function renderFlag(url, country){
		$('.js-flag img').attr({
			src: url,
			alt: `${country}'s flag`,
		})
	}

//displays country name
	
	function displayCountryName(country) {
	$('.js-country-name').html(country.toUpperCase());
	}

//retrieves results data from groupStageFixtures array
	function updateResultsArray(country) {
		allResults = getCountryFixturesData(groupStageFixtures, country);
	}

	function getCountryFixturesData(groupStagesFixtures, country) {
		return groupStagesFixtures.reduce((acc, fixture) => {
			if (fixture.home_team === country || fixture.away_team === country) {
				acc.push(fixture);
			}
			return acc;
		}, [])
	}

	function getDateTime(match){
		return match.datetime;
	}

	function getHomeTeam(match) {
		return match.home_team;
	}

	function getAwayTeam(match) {
		return match.away_team;
	}

	function getScore(match) {
		console.log(match.results.score);
		return match.results.score;
	}

	function getHomeScorers(match) {
		return match.results.home_scoreres;
	}

	function getAwayScorers(match) {
		return match.results.away_scoreres;
	}

//renders results
	function renderResults() {
		console.log(allResults);
		return allResults.map(match => {
			return `<div>${getDateTime(match)}</div>
			<span>${getHomeTeam(match)}</span> <span>${match.results.score}</span> <span>${getAwayTeam(match)}</span>
			<div class="row js-scorers">
			<div class="col-6 js-home-scorers">
				<ul>
					${renderHomeScorers(match)}
				</ul>
			</div>
			<div class="col-6 js-away-scorers">
				<ul>
					${renderAwayScorers(match)}
				</ul>
			</div>
			</div>`
		});
	}

	function renderLatestResult(renderedResults) {
		return renderedResults.pop();
	}

	function renderHomeScorers(match) {
		const homeScorers = getHomeScorers(match);
		return homeScorers.map(scorer => {
			return `<li>
					${scorer.title} ${scorer.minute}
					</li>`
		})
	}

	function renderAwayScorers(match) {
		const awayScorers = getAwayScorers(match);
		return awayScorers.map(scorer => {
			return `<li>
					${scorer.minute} ${scorer.title}
					</li>`
		})
	}

//displays results
	function displayResults(country) {		
		const renderedResults = renderResults();
		const latestResult = renderLatestResult(renderedResults);
		$('.js-latest-result p').html(latestResult);
		$('.js-timeline p').html(renderedResults);
	}

//renders roster
	function renderRoster() {
		console.log("renderRoster has ran");
		return roster.map(player => {
			return `<li>${player.jerseyNumber} ${player.position} ${player.name}</li>`
		})
		console.log(roster);
	}

	function displayRoster() {
		playerRoster = renderRoster(roster);
		$('.js-roster ul').html(playerRoster);
	}

//renders history

function displayTeamHistory(data) {
	console.log("displayTeamHistory has ran");
   var markup = data.parse.text["*"];
   var blurb = $('<div></div>').html(markup); 
   $('.js-history p').html($(blurb).find('p'));  
}

//function that handles submit country event
	function handleCountrySelection(event) {
		event.preventDefault();
		const country = $('#countries option:selected').val();
		updateResultsArray(country);
		getRosterArray(country);
		console.log("roster:", roster);
		getHistoryInfo(country);
		displayFlag(country);
		displayCountryName(country);
		displayResults();

	}

function startWorldCupApp() {
	buildGroupStageFixturesObj();
	renderSelectCountryOptions();
}

$(startWorldCupApp());