
const FIFA_FIXTURES_URL = "https://fifa-2018-apis.herokuapp.com/fifa/fixtures";
const FOOTBALL_DATA_TEAMS_URL = 'https://api.football-data.org/v1/competitions/467/teams';
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php";
let groupStageFixtures = [];
let knockoutFixtures = [];
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
const positions = {
	"keeper": ["keeper"],
	"left defense": ["left back"],
	"center defense": [],
	"right defense": [],
	"left mid": [],
	"center mid": [],
	"right mid": [],
	"left for": [],
	"center for": [],
	"right for": []
}


//retrieve FIFA fixture data and build groupStageFixtures array

		function buildFixturesArr() {
			getFixturesApiData(callbackFixtureData);	
		}

		function getFixturesApiData(callback) {
		  	$.getJSON(FIFA_FIXTURES_URL, callback);
		}

		function callbackFixtureData(data) {
			groupStageFixtures = assignFixtures(data.data.group_stages);
			knockoutFixtures = assignFixtures(data.data.knockout_stages);
			getAllResultsApiData(groupStageFixtures);
			getAllResultsApiData(knockoutFixtures);
		}

		function assignFixtures(data) {
		  	const fixtures = data;
		  	return createFixtures(fixtures) 	
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

		function getAllResultsApiData(fixtures) {
			fixtures.forEach(function(match, i) {
		  		getResultsApiData(match.link, callbackResultsData, fixtures, i)
		  	})
		
		}

		function fixturesArrayIsReady() {
			fixIran();
		  	enableCountrySelectionSubmit();
		}

		function enableCountrySelectionSubmit(){
			$('#country-submit').removeAttr("disabled").attr({value: "Submit Country"});
		}

		function getResultsApiData(apiUrl, callbackFunc, fixturesArr, index) {
			$.ajax({
		  url: apiUrl,
		  dataType: 'json',
		  type: 'GET',
		}).done(function(response) {
			if (fixturesArr === knockoutFixtures && index === fixturesArr.length - 1) {		 	
				fixturesArrayIsReady();
			}
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
		const playerApiRequests = getPlayerApiRequests(response);
		console.log(playerApiRequests);
		buildRosterArray();	
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

	function buildRosterArray() {
		$.when(...playerApiRequests).done(renderRoster());
	}

	function getPlayerApiRequests(response) {
		return roster.map(player => {
			return getWikipediaApiPlayerData;
		});
	}

	function getWikipediaApiPlayerData(player) {
		console.log(player);
		let pageName = player.name.replace(/ /g, "_");
		const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text|images&section=0&page=${pageName}&callback=?`;
	   $.ajax({
	        type: "GET",
	        url: apiUrl,
	        contentType: "application/json; charset=utf-8",
	        async: false,
	        dataType: "json",
	        success: function (data, textStatus, jqXHR) {
	            imageSearchCallBack(data, pageName, player);
	        },
	        error: function (errorMessage) {
	        }
	    });
	}

	function imageSearchCallBack(data, pageName, player) {

		player.imageUrl = data.parse.images.find(image => {
			return image.includes(pageName); 
		});
	}


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
		$('.js-flag').attr({
			src: url,
			alt: `${country}'s flag`,
		})
	}

//displays country name
	
	function displayCountryName(country) {
	$('.js-country-name h2').html(country.toUpperCase());
	}

//retrieves results data from groupStageFixtures array
	function displayResults(country) {
		const groupStageResults = getCountryFixturesData(country, groupStageFixtures);
		const knockoutStageResults = getCountryFixturesData(country, knockoutFixtures);
		const results = [...knockoutStageResults, ...groupStageResults];
		$('.js-results div').html(results);
	}


	function getCountryFixturesData(country, fixtures) {
		let fixtureCount = 0;
		return fixtures.reduce((acc, fixture) => {		
			if (fixture.home_team === country || fixture.away_team === country) {
				fixtureCount++;
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

//generates HTML for results
	function generateHtmlResults(match) {
		return `
			<div class="result">
				<div>${getDateTime(match)}</div>
				<div class="row team">${getHomeTeam(match)} <img src="${match.home_flag}"> <span class="score">${getScore(match)}</span> <img src="${match.away_flag}"> ${getAwayTeam(match)}</div>
			</div>
			<div class="row js-scorers">
			<div class="col-6 js-home-scorers">
				<ul>
					${generateHtmlHomeScorers(match)}
				</ul>
			</div>
			<div class="col-6 js-away-scorers">
				<ul>
					${generateHtmlAwayScorers(match)}
				</ul>
			</div>
			</div>`
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
			const imageSrc = `https://en.wikipedia.org/wiki/${pageName}#/media/File:${player.imageUrl}`;
			const html = `<div class="player">
									<img src='${imageSrc}' alt='${player.name}'>
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
	function handleCountrySelection(event) {
		event.preventDefault();
		const country = $('#countries option:selected').val();
		displayFlag(country);
		displayCountryName(country);
		getRosterArray(country);

		getHistoryInfo(country);
		displayResults(country);
		removeInactiveClass("js-country-profile");
	}

function handleMenuSelect(className) {
	$(`.${className}-button`).on("click", function() {
		$(`.${className}`).toggleClass("inactive");
	})
}

function handleCollapsingMenu() {
		handleMenuSelect("js-results");
		handleMenuSelect("js-roster");
		handleMenuSelect("js-history");
}
function startWorldCupApp() {
	buildFixturesArr();
	renderSelectCountryOptions();
	handleCollapsingMenu();

}

$(startWorldCupApp());