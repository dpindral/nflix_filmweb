// ==UserScript==
// @name         nflix i filmweb
// @namespace    dpindral
// @version      0.1
// @description  dodaje oceny z filmwebu
// @author       dpindral
// @match        https://www.nflix.pl/netflix-polska-lista-wszystkich-dostepnych-tytulow/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @updateURL   https://github.com/dpindral/nflix_filmweb/raw/master/nflix_filmweb.user.js
// @downloadURL https://github.com/dpindral/nflix_filmweb/raw/master/nflix_filmweb.user.js
// ==/UserScript==

var userID = '2037911';


(function() {
    'use strict';

    function setSignature(){
        var node = document.createElement("H3");
        var textnode = document.createTextNode("dodano Twoje oceny");
        node.appendChild(textnode);
        document.getElementById('branding').appendChild(node);
    }

    var movies = [];

    function readMovieInfo(t){
        var pars = t.split("\\c");
        var movie = {
            id: pars[0],
            titleOrg: pars[1].trim().toLowerCase(),
            titlePl: pars[2].trim().toLowerCase(),
            year: pars[3],
            rating: pars[5],
            rateDate: pars[9]
        };
        movies.push(movie);
    }

    function parseResponse(e){
        var elems = e.responseText.split("\\a");
        for(var i=7;i<elems.length;i++){
            readMovieInfo(elems[i]);
        }
    }

    function getRatings(){

        GM_xmlhttpRequest({
            method : "GET",
            url : "http://www.filmweb.pl/splitString/user/"+userID+"/filmVotes",
            onload : parseResponse
        });

        GM_xmlhttpRequest({
            method : "GET",
            url : "http://www.filmweb.pl/splitString/user/"+userID+"/seriesVotes",
            onload : parseResponse
        });
    }

    function getFilmwebScore(it, title, year, type){

            GM_xmlhttpRequest({
                method : "GET",
                url : "http://www.filmweb.pl/search/"+type+"?q="+title+"&startYear="+year+"&endYear="+year,
                onload : function(e){
                    var t = e.responseText;
                    var scoreSpan = '<div id="searchResult" >';
                    var ind = t.indexOf(scoreSpan);
                    if(ind==-1) return;
                    ind += scoreSpan.length;
                    t = t.substring(ind);

                    scoreSpan = 'class="filmPreview__link" href="';
                    ind = t.indexOf(scoreSpan);
                    if(ind==-1) return;
                    ind += scoreSpan.length;
                    t = t.substring(ind);
                    ind = t.indexOf('"');
                    var fwid = t.substring(0,ind);

                    scoreSpan = 'data-rate="';
                    ind = t.indexOf(scoreSpan);
                    if(ind==-1) return;
                    ind += scoreSpan.length;
                    t = t.substring(ind);
                    ind = t.indexOf('"');
                    var scores = t.substring(0,ind);
                    var score = parseFloat(scores);

                    var fwtext = document.createTextNode("Filmweb");
                    var fwlink = document.createElement("a");
                    fwlink.setAttribute("target", "_blank");
                    fwlink.setAttribute("href", "http://www.filmweb.pl" + fwid);
                    fwlink.appendChild(fwtext);
                    var node = document.createElement("span");
                    node.setAttribute("class", "label label-warning");
                    var textnode = document.createTextNode(": ["+(score.toFixed(2))+"]");
                    node.appendChild(fwlink);
                    node.appendChild(textnode);
                    it.appendChild(node);
                }
            });


    }

    function addRatingToCell(cell){
        var centers = cell.getElementsByTagName("center");
        if(centers.length<1){
            return;
        }
        var part = centers[0];
        var h = part.innerHTML;
        var type = 'film';
        if(h.indexOf('<span class="label label-default">Serial</span>')>-1){
            type = 'serial';
        }
        
        h = h.substring(h.indexOf("</a>")+4);
        var ind = h.indexOf("(")+1;
        var year = h.substring(ind,ind+4);
        var tpart = part.getElementsByTagName("a")[0].innerText.replace(new RegExp("&nbsp;", 'g'), " ");
        var titles = tpart.split("/");
        var title = titles[0].trim().toLowerCase();
        var titlePl = '';
        if(titles.length>1){
            titlePl = titles[1].trim().toLowerCase();
        }
        

        for(var mi =0; mi<movies.length;mi++){
            var m = movies[mi];
            if((m.titleOrg == title || (m.titlePl == titlePl && titlePl!=="")) && m.year==year){
                var node = document.createElement("span");
                node.setAttribute("class", "label label-success");
                var textnode = document.createTextNode("Twoja ocena: ["+m.rating+"]");
                node.appendChild(textnode);
                part.appendChild(node);
                node = document.createElement("br");
                part.appendChild(node);
                break;
            }
        }

        getFilmwebScore(part, title, year, type);
    }

    function addRatingsToHtml(){
        console.log("adding notes "+ movies.length);
        var cells = document.getElementsByTagName("td");
        for(var i=0;i<cells.length;i++){
            var x = cells[i].getAttribute("width");
            if(x===null || x!="25%"){
                continue;
            }
            addRatingToCell(cells[i]);
        }
    }

    getRatings();

    setTimeout(function(){
        addRatingsToHtml();
        setSignature();
    }, 1000);
})();
