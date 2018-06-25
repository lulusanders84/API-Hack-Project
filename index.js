
const FIFA_FIXTURES_URL = "https://fifa-2018-apis.herokuapp.com/fifa/fixtures";
const FOOTBALL_DATA_TEAMS_URL = 'https://api.football-data.org/v1/competitions/467/teams';
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/api.php";
let teamFixtures = [];
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
	displayCountryName(country);
	getFixturesApiData(callbackFixtureData, country);
	getFootballDataApiData(FOOTBALL_DATA_TEAMS_URL, callbackFootballDataApiData, country);
	getWikipediaApiData(country);

}

//get API data

function getFootballDataApiData(apiUrl, callbackFunc, country) {
	console.log(callbackFunc);
	$.ajax({
  headers: { 'X-Auth-Token': 'f7302355bfde4075a668246ec2d7056e' },
  url: apiUrl,
  dataType: 'json',
  type: 'GET',
}).done(function(response) {
 	callbackFunc(response, country);

})
}

function callbackFootballDataApiData(response, country) {
	const teams = response.teams;
  	const FOOTBALL_DATA_PLAYERS_URL = teams.reduce((acc, team) => {
  		console.log(team.name);
  		if (team.name === country) {
  			console.log ("Teams matching: ", team)
  			acc = team._links.players.href;
  		}
  		return acc;
  	}, "");
  	console.log("Football data response");
  	getFootballDataApiData(FOOTBALL_DATA_PLAYERS_URL, callbackFootballDataApiPlayerData, country);
}

function callbackFootballDataApiPlayerData(response){
	const players = response.players;
	const sortedPlayers = players.sort(function(a, b) {
		if (a.jerseyNumber < b.jerseyNumber) {
    		return -1;
  		} else if (a.jerseyNumber > b.jerseyNumber) {
    		return 1;
  		}
  		return 0;
	});
	displayTeamRoster(sortedPlayers);
}

function getNewsApiData(callback) {
  $.getJSON(YOUTUBE_SEARCH_URL, query, callback);
}

function getFixturesApiData(callback) {
  	$.getJSON(FIFA_FIXTURES_URL, callback);
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

function callbackFixtureData(data) {
	const country = $('#countries option:selected').val();

	const fixtureInfo = returnFixtureInfo(data, country);
	const flagUrl = function(fixtureInfo) {
		if (fixtureInfo.home_team === country) {
			return fixtureInfo.home_flag;
		} else {
			return fixtureInfo.away_flag;
		}
	}
	console.log(fixtureInfo);
	const FIFA_LIVE_SCORE_URL = "https://fifa-2018-apis.herokuapp.com/fifa/live" + fixtureInfo.link;
	console.log(FIFA_LIVE_SCORE_URL);	
	createTeamFixturesArr(data, country, teamFixtures);
	getResultsApiData(FIFA_LIVE_SCORE_URL, callbackLatestResultData);
	displayCountryFlag(country, flagUrl(fixtureInfo));
	$('.js-timeline').html
	$('.js-game-datetime').html(fixtureInfo.datetime);
	$('.js-home-team').html(fixtureInfo.home_team);
	$('.js-away-team').html(fixtureInfo.away_team);

}

function callbackResultsData(data, fixturesArr, index) {
	fixturesArr[index].results = data.data;
	displayTimeline(fixturesArr);

	}

function returnFixtureInfo(data, country){
  const fixtures = data.data.group_stages;
  const arr = Object.keys(fixtures).reduce((acc, date) => {
    console.log(date);
    const matches = fixtures[date].reduce((acc2, match) => {
    	const fixtureUnix = Date.parse(match.datetime);
    	console.log(fixtureUnix);
      	if (match.home_team === country || match.away_team === country) {
        	if(fixtureUnix < Date.now()) {
        		console.log("Date now:", Date.now());
        		acc2.push(match);
        	}
      }
      return acc2;
    }, [])
    console.log(matches)
    return [...acc, ...matches];
    
  }, []);
  console.log(arr[arr.length - 1])
  return arr[arr.length - 1];
}

function createTeamFixturesArr(data, country, fixturesArr) {
  const fixtures = data.data.group_stages;
  const allFixtures = Object.keys(fixtures).reduce((acc, date) => {
    const matches = fixtures[date].reduce((acc2, match) => {
    	const fixtureUnix = Date.parse(match.datetime);
      	if (match.home_team === country || match.away_team === country) {
      			if (fixtureUnix < Date.now()) {
        		acc2.push(match);
        	}
      	}
    	return acc2;
    }, [])
    return [...acc, ...matches];
    
  }, []);
  for (let i = 0; i < allFixtures.length; i++) {
  	const apiUrl = "https://fifa-2018-apis.herokuapp.com/fifa/live" + allFixtures[i].link;
  	allFixtures[i].link = apiUrl;
  }

  console.log("All results:", allFixtures);
  fixturesArr = allFixtures;
  fixturesArr.forEach(function (match, i) {
  	getResultsApiData(match.link, callbackResultsData, fixturesArr, i)
  })
}


function getWikipediaApiData(country) {
	const apiUrl = `http://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=${country}_national_football_team&callback=?`;
	console.log("apiUrl:", apiUrl);
    $.ajax({
        type: "GET",
        url: apiUrl,
        contentType: "application/json; charset=utf-8",
        async: false,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
 			console.log(data);
            var markup = data.parse.text["*"];
            var blurb = $('<div></div>').html(markup);
            $('#article').html($(blurb).find('p'));
        },
        error: function (errorMessage) {
        }
    });
};


//API callback functions 
function callbackCountryFlag(data) {
	displayCountryFlag(data);
}

function callbackLatestResultData(data) {
	console.log("score:", data.data.score);
	const homeScorers = displayScorers(data.data.home_scoreres);
	const awayScorers = displayScorers(data.data.away_scoreres);
	$('.js-latest-score').html(data.data.score);
	$('.js-home-scorers ul').html(homeScorers);
	$('.js-away-scorers ul').html(awayScorers);

}

function callbackAllResultsData(data, allFixturesObj) {
	console.log("all results callback:", data.data);
	for (let i = 0; i < allFixturesObj.length; i++) {

	}
}

function callbackWikipedia(data) {
	console.log("Wikipedia: ", data);
}

//display functions
function displayCountryFlag(country, flagUrl) {
	return $('.js-flag img').attr({src:`${flagUrl}`, alt: `${country}'s flag`})
}
	
function displayCountryName(country) {
	$('.js-country-name').html(country.toUpperCase());
}
function displayNews(data) {
	//store news data in newsData object
	//display first image in js-news-feed
	//display title
	//activate link
	//display date
}
function displayScorers(scorers) {
	const scorersList = scorers.map(goal => {
		console.log(goal.title);
		return `<li>${goal.title}: ${goal.minute}</li>`
	})
	console.log("scorers list:", scorersList);
	return scorersList;
}
function displayTeamRoster(sortedPlayerList) {
	const roster = sortedPlayerList.map(player => {
		return `<li>${player.jerseyNumber} ${player.position} ${player.name}</li>`
	})
	$('.js-roster ul').html(roster);
}
function displayTimeline(fixturesArr) {
	const allResults = fixturesArr.map(match => {
		const datetime = match.datetime;
		console.log(datetime);
		const homeTeam = match.home_team;
		const awayTeam = match.away_team;
		const score = match.results.score;
		const homeScorers = match.results.home_scoreres.map(scorer => {
			return `<li>
				${scorer.minute} ${scorer.title}
				</li>`
		})
		const awayScorers = match.results.away_scoreres.map(scorer => {
			return `<li>
				${scorer.minute} ${scorer.title}
				</li>`
		})

		return `<div>${datetime}</div>
			<span>${homeTeam}</span> <span></span>${score}<span>${awayTeam}</span>
			<div class="row js-scorers">
			<div class="col-6 js-home-scorers">
				<ul>
					${homeScorers}
				</ul>
			</div>
			<div class="col-6 js-away-scorers">
				<ul>
					${awayScorers}
				</ul>
			</div>
			</div>`
	});

	$('.js-timeline').html(allResults);
}
function displayTeamHistory() {}

//renders country profile (flag, country name, latest results, timeline, roster, history)

$(renderSelectCountryOptions());