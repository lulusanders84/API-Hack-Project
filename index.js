
const FIFA_FIXTURES_URL = "https://fifa-2018-apis.herokuapp.com/fifa/fixtures";
const FOOTBALL_DATA_TEAMS_URL = 'https://api.football-data.org/v1/competitions/467/teams';
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php";
let fixtures = {
	groupStage: [],
	knockout: []
};
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
	groupF: ["Germany", "Mexico", "Sweden", "Korea Republic"],
	groupG: ["Belgium", "England", "Tunisia", "Panama"],
	groupH: ["Poland", "Senegal", "Colombia", "Japan"],
}

const menuClassNames = ["js-results", "js-roster", "js-history"];

function startWorldCupApp() {
	buildFixturesArrFromApiData();
	renderSelectCountryOptions();
	handleCollapsingMenu();
}
//retrieve FIFA fixture data and build fixture arrays

function buildFixturesArrFromApiData() {
	$.when($.getJSON(FIFA_FIXTURES_URL, callbackFixtureData)).done(function() {
		fixturesArrayIsReady();
	});	
}

function callbackFixtureData(data) {
	console.log("callback fixture data running");	
	fixtures.groupStage = assignFixtures(data.data.group_stages);
	fixtures.knockout = assignFixtures(data.data.knockout_stages);
}

function assignFixtures(data) {
	const fixtures = data;
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

function fixturesArrayIsReady() {
	fixIran();
	enableCountrySelectionSubmit();
}

function fixIran() {
	fixtures.groupStage.forEach(function (fixture) {
		if (fixture.home_team === "IR Iran") {
			fixture.home_team = "Iran";
		}
		if (fixture.away_team === "IR Iran") {
			fixture.away_team = "Iran";
		}
	})
}

function enableCountrySelectionSubmit(){
	$('#country-submit').removeAttr("disabled").attr({value: "Submit Country"});
}

function handleCountrySelection(event) {
	event.preventDefault();
	const country = $('#countries option:selected').val();
	processCountryResultsData(country);
	displayFlag(country);
	displayCountryName(country);
	getRosterArray(country);
	getHistoryInfo(country);
	removeInactiveClass("js-country-profile");
	}

function processCountryResultsData(country) {
	console.log("retrieve results running");
	const allFixtureResultRequestSignatures = 	
		[...getFixtureResults(fixtures.groupStage, country), ...getFixtureResults(fixtures.knockout, country)];
	$.when(...allFixtureResultRequestSignatures).done(function() {
		displayResults(country);
	})
}
function getFixtureResults(fixtures, country) {
	console.log("fixtures in getFixtureResults", fixtures);
	return fixtures.reduce((acc, fixture, i) =>{
		if (fixture.home_team === country || fixture.away_team === country) {
			acc.push(getResultsApiData(fixture.link, callbackResultsData, fixtures, i));
		}
		return acc;
	}, [])
}

function getResultsApiData(apiUrl, callbackFunc, fixturesArr, index) {
	return $.ajax({
		url: apiUrl,
		dataType: 'json',
		type: 'GET',
		success: function(response) {
			callbackFunc(response, fixturesArr, index);
		},
		error: function(response) {
		  	errorResultsData(response, fixturesArr, index);
		}
	})
}

function callbackResultsData(data, fixturesArr, index) {
	console.log("results callback running");
	fixturesArr[index].results = data.data;
}

function errorResultsData(data, fixturesArr, index) {
	fixturesArr[index].results = "No results found for this match";
}

	function displayResults(country) {
		const groupStageResults = getCountryFixturesData(country, fixtures.groupStage);
		const knockoutStageResults = getCountryFixturesData(country, fixtures.knockout);
		const results = [...knockoutStageResults, ...groupStageResults];
		$('.js-results').html(results);
	}

function getCountryFixturesData(country, fixtures) {
	return fixtures.reduce((acc, fixture) => {		
		if (fixture.home_team === country || fixture.away_team === country) {
			const htmlResults = generateHtmlResults(fixture);
			acc.unshift(htmlResults);
		}
		return acc;
	}, [])
}


	function getDateTime(match){
		const date = new Date(match.datetime);
		return date.toDateString();
	}

	function getHomeTeam(match) {
		return match.home_team;
	}

	function getAwayTeam(match) {
		return match.away_team;
	}

	function getScore(match) {
		return match.results.score;
	}

	function getHomeScorers(match) {
		return match.results.home_scoreres;
	}

	function getAwayScorers(match) {
		return match.results.away_scoreres;
	}

	function getResultValues(match) {
		return {
			score: getScore(match),
			homeScorers: generateHtmlHomeScorers(match),		
			awayScorers: generateHtmlAwayScorers(match),
			html: function() {
				return `<div class="row js-scorers">
					<div class="col-6 js-home-scorers home">
						<ul>
							${this.homeScorers}
						</ul>
					</div>
					<div class="col-6 js-away-scorers away">
						<ul>
							${this.awayScorers}
						</ul>
					</div>
				</div>`	
			}		
		}
	}

	function getErrorValues() {
		return {
			score: "---",
			homeScorers: "NA",
			awayScorers: "NA",
			html: function () {
				return `
				<div class="result-error">
					<p> No results found for this match </p>
				</div> `
			}
		}
	}
//generates HTML for results
	function generateHtmlResults(match) {
		console.log("match results type", typeof match.results);
		let resultValues = {};
		if (typeof match.results !== "object") {
			console.log("conditional error ran");
			resultValues = getErrorValues();
		} else {
			resultValues = getResultValues(match);
		}

		return `		
				<div class="col-12">${getDateTime(match)}</div>
				<div class="result">
						<div class="home">
							<span>${getHomeTeam(match)}</span> <img src="${match.home_flag}"> 
						</div> 
						<div class="score">
							${resultValues.score}
						</div> 
						<div class="away">
							<img src="${match.away_flag}"> <span>${getAwayTeam(match)}</span>
						</div>
					</div>
				</div>
				${resultValues.html()}`
		};

	function generateHtmlHomeScorers(match) {
		const homeScorers = getHomeScorers(match);
		const scorers = homeScorers.map(scorer => {
			return `<li class="scorer">
					${scorer.title} ${scorer.minute}
					</li>`
		})
		return scorers.join(" ");
	}

	function generateHtmlAwayScorers(match) {
		const awayScorers = getAwayScorers(match);
		const scorers = awayScorers.map(scorer => {
			return `<li class="scorer">
					${scorer.minute} ${scorer.title}
					</li>`
		})
		return scorers.join(" ");
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
		getFootballDataApiData(FOOTBALL_DATA_TEAMS_URL, callbackFootballDataApiData, country);
	}

	function getFootballDataApiData(apiUrl, callbackFunc, country) {
		$.ajax({
  			headers: { 
  				'X-Auth-Token': 'f7302355bfde4075a668246ec2d7056e'
	},
  			url: apiUrl,
  			dataType: 'json',
  			type: 'GET',
		}).done(function(response) {
 			callbackFunc(response, country);
		});
	}

	function callbackFootballDataApiData(response, country) {
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
		roster = sortRosterArr(response.players);
		renderRoster();
	}


	function sortRosterArr(roster) {
		return roster.sort(function(a, b) {
			if (a.jerseyNumber < b.jerseyNumber) {
    			return -1;
  			} else if (a.jerseyNumber > b.jerseyNumber) {
    			return 1;
  			}
  			return 0;
		});
	}

	/*function buildRosterArray(playerApiRequests) {
		$.when(...playerApiRequests).done(function() {
			renderRoster();
		});
	}

	/*function getPlayerApiRequests(response) {
		return roster.map((player, index) => {
			return getWikipediaApiPlayerData(player, index);
		});
	}

	function getWikipediaApiPlayerData(player, index) {
		let pageName = player.name.replace(/ /g, "_");
		const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text|images&section=0&page=${pageName}&callback=?`;
	   	return $.ajax({
	        type: "GET",
	        url: apiUrl,
	        contentType: "application/json; charset=utf-8",
	        async: false,
	        dataType: "json",
	        success: function (data, textStatus, jqXHR) {
	            imageSearchCallBack(data, pageName, index);
	        },
	        error: function (errorMessage) {
	        }
	    });
	}

	function imageSearchCallBack(data, pageName,index) {
		const currentPlayer = roster[index];
		currentPlayer.imageUrl = data.parse.images.find(image => {
			return image.includes(pageName); 
		});
	}*/


//retrieve wikipedia data and places in variable
	function getHistoryInfo(country){
		getWikipediaApiData(country);
	}

	function getWikipediaApiData(country) {
		const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=${country}_national_football_team&callback=?`;
	    return $.ajax({
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
		return fixtures.groupStage.reduce((acc, fixture) => {
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
		$('.js-flag').attr({
			src: url,
			alt: `${country}'s flag`,
		})
	}

//displays country name
	
	function displayCountryName(country) {
	$('.js-country-name h2').html(country.toUpperCase());
	}

//retrieves results data from fixture arrays



//renders roster
	function renderRoster() {
		const keepers = generatePositionList("Keeper"); 
		const leftDef = generatePositionList("Left-Back");
		const centerDef = generatePositionList("Centre-Back");
		const rightDef = generatePositionList("Right-Back");
		const defenders = [...leftDef, ...centerDef, ...rightDef];
		const defMid = generatePositionList("Defensive Midfield");
		const leftMid = [...generatePositionList("Left Midfield"), ...generatePositionList("Left Wing")];
		const centerMid = generatePositionList("Central Midfield");
		const rightMid = [...generatePositionList("Right Midfield"), ...generatePositionList("Right Wing")];
		const midfielders = [...defMid, ...leftMid, ...centerMid, ...rightMid];
		const attMid = [...generatePositionList("Attacking Midfield"), ...generatePositionList("Secondary Striker")];
		const strikers = generatePositionList("Centre-Forward");
		const forwards = [...attMid, ...strikers];
		$('.js-keepers div').html(keepers);
		$('.js-defenders div').html(defenders);
		$('.js-midfielders div').html(midfielders);
		$('.js-forwards div').html(forwards);
	}

	function generatePositionList(position) {

		return roster.reduce((acc, player) => {
			const pageName = player.name.replace(/ /g, "_");
			const html = `<div class="player">
							<p><a href="https://en.wikipedia.org/wiki/${pageName}">${player.name}</a></p>
						  </div>`;
			if (player.position.indexOf(position) != -1) {
				acc.push(html);
			}
			return acc;
		}, [])
	}

//renders history
	function displayTeamHistory(data) {
   	var markup = data.parse.text["*"];
   	var blurb = $('<div class="js-wiki"></div>').html(markup); 
   	$('.js-history p').html($(blurb).find('p'));
   	$( "a[href^='/']" ).prop( "href", function( _idx, oldHref ) {
   		const href = oldHref.split('/');
   		return "https://en.wikipedia.org/wiki/" + href[href.length - 1];
  		});
	}

//display class (remove "inactive" class)
function removeInactiveClass(className) {
	$(`.${className}`).removeClass("inactive");
}	

//function that handles submit country event


function handleMenuSelect(className) {
	$(`.${className}-button`).on("click", function() {
		$(`.${className}`).toggleClass("inactive");
		$(`.${className}-button img.ball`).toggleClass("football-hide");
		toggleArrowImage(className);
	})
}

function toggleArrowImage(className) {
	$(`.${className}-button img.arrow`).toggleClass("closed");
}

function handleCollapsingMenu() {
		handleMenuSelect("js-results");
		handleMenuSelect("js-roster");
		handleMenuSelect("js-history");
}

function closeMenu(className) {
	$(`.${className}-button img.arrow`).addClass("closed");
}

$(startWorldCupApp());