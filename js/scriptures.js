/*========================================================================
* FILE:     scriptures.js
* AUTHOR:   Stephen W. Liddle with some help of Dakota Orrock
* DATE:     Winter 2021
*
* DESCRIPTION: Front end JS for Project 1 - IS 542 - BYU
*/

const Scriptures = (function () {
    "use strict";

    /*--------------------------------------------------------------------
    *                      CONSTANTS
    */

    const BOTTOM_PADDING = "<br /><br />";
    const CLASS_BOOKS = "books";
    const CLASS_VOLUMES = "volumes";
    const DIV_SCRIPTURES_NAVIGATOR = "scripnav"
    const DIV_SCRIPTURES = "scriptures"
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;
    const TAG_HEADERS = "h5";
    const URL_BASE = "https://scriptures.byu.edu/";
    const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
    const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;

    /*--------------------------------------------------------------------
    *                       PRIVATE VARIABLES
    */
    let books;
    let volumes;

    /*--------------------------------------------------------------------
    *                       PRIVATE METHOD DECLARATIONS
    */
    let ajax;
    let cacheBooks;
    let htmlAnchor;
    let htmlDiv;
    let htmlElement;
    let htmlLink;
    let htmlHashLink;
    let init;
    let onHashChanged;
    let navigateHome;
    

    /*--------------------------------------------------------------------
    *                       PRIVATE METHODS
    */
    ajax = function (url, successCallback, failureCallback) {
        let request = new XMLHttpRequest();

        request.open(REQUEST_GET, url, true);

        request.onload = function () {
            if (this.status >= REQUEST_STATUS_OK && this.status < REQUEST_STATUS_ERROR) {
                let data = JSON.parse(this.response);

                if (typeof successCallback === "function") {
                    successCallback(data);
                }
            } else {
                if (typeof successCallback === "function") {
                    failureCallback(request);
                }
            }
        };

        request.onerror = failureCallback;
        request.send();
    };

    cacheBooks = function (callback) {
        volumes.forEach(volume => {
            let volumeBooks = [];
            let bookID = volume.minBookId;

            while (bookID <= volume.maxBookId) {
                volumeBooks.push(books[bookID]);
                bookID += 1;
            }

            volume.books = volumeBooks;
        });

        if (typeof callback === "function") {
            callback();
        }
    };

    htmlAnchor = function (volume) {
        return `<a name="v${volume.id}" />`;
    }

    htmlDiv = function (parameters) {
        let classString = "";
        let contentString = "";
        let idString= "";

        if (parameters.classKey !== undefined) {
            classString = ` class="${parameters.classKey}"`;
        }

        if (parameters.content !== undefined) {
            contentString = parameters.content;
        }

        if (parameters.id !== undefined) {
            idString = ` id="${parameters.id}"`;
        }

        return `<div${idString}${classString}>${contentString}</div>`;
    }

    htmlElement = function (tagName, content) {
        return `<${tagName}>${content}</${tagName}>`;
    }

    htmlLink = function (parameters) {
        let classString = "";
        let contentString = "";
        let hrefString = ""; 
        let idString= "";

        if (parameters.classkey !== undefined) {
            classString = ` class="${parameters.classkey}"`;
        }

        if (parameters.content !== undefined) {
            contentString = parameters.content;
        }

        if (parameters.href !== undefined) {
            hrefString = ` href="${parameters.href}"`;
        }

        if (parameters.id !== undefined) {
            idString = ` id="${parameters.id}"`;
        }

        return `<div${idString}${classString}${hrefString}>${contentString}</div>`;
    }

    htmlHashLink = function (haschArguments, content) {
        return `<a href="javascript:void(0)" onclick="changeHash(${haschArguments})">${content}<a/>`;
    }

    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;

        ajax(URL_BOOKS, data => {
                books = data;
                booksLoaded = true;

                if (volumesLoaded) {
                    cacheBooks(callback);
                    // console.log(volumes);
                    // console.log(books);
                }
            }
        );

        ajax(URL_VOLUMES, data => {
                volumes = data;
                volumesLoaded = true;

                if (booksLoaded) {
                    cacheBooks(callback);
                    // console.log(volumes);
                    // console.log(books);
                }
            }
        );
    };

    navigateHome = function (volumeId) {
        document.getElementById(DIV_SCRIPTURES).innerHTML =
        "<div>Old Testament</div>" +
        "<div>New Testament</div>" +
        "<div>Book of Mormon</div>" +
        "<div>Doctrine and Covenants</div>" +
        "<div>Pearl of Great Price</div>" + volumeId;
    }

    onHashChanged = function () {
        let ids = [];

        if (location.hash !== "" && location.hash.length > 1) {
            ids = location.hash.slice(1).split(":");
        }

        if (ids.length <= 0) {
            navigateHome();
        }
        else if (ids.length === 1) {
            let volumeId = Number(ids[0]);

            if (volumeId < volumes[0].id || volumeId > volumes.slice(-1)[0].id) {
                navigateHome();
            }
            else{
                navigateHome(volumeId);
            }
        }
    }    

    /*--------------------------------------------------------------------
    *                       PUBLIC API
    */

    return {
        init,
        onHashChanged
    };
}());