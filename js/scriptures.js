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
    const CLASS_BUTTON = "btn"
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
    let bookChapterValid;
    let booksGrid;
    let booksGridContent;
    let htmlAnchor;
    let htmlDiv;
    let htmlElement;
    let htmlLink;
    let htmlHashLink;
    let init;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let onHashChanged;
    let volumesGridContent;



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

    bookChapterValid = function (bookId, chapter) {
        let book = books[bookId];

        if (book === undefined || chapter < 0 || chapter > book.numChapters) {
            return false;
        }

        if (chapter === 0 && book.numChapters > 0) {
            return false;
        }

        return true;
    };

    booksGrid = function (volume) {
        return htmlDiv({
            classKey: CLASS_BOOKS,
            content: booksGridContent(volume)
        })
    };

    booksGridContent = function (volume){
        let gridContent = "";

        volume.books.forEach(function (book) {
            gridContent += htmlLink({
                classKey: CLASS_BUTTON,
                id: book.id,
                href: `#${volume.id}:${book.id}`,
                content: book.gridName
            })
        })

        return gridContent;
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
    };

    htmlDiv = function (parameters) {
        let classString = "";
        let contentString = "";
        let idString = "";

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
    };

    htmlElement = function (tagName, content) {
        return `<${tagName}>${content}</${tagName}>`;
    };

    htmlLink = function (parameters) {
        let classString = "";
        let contentString = "";
        let hrefString = "";
        let idString = "";

        if (parameters.classKey !== undefined) {
            classString = ` class="${parameters.classKey}"`;
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

        return `<a${idString}${classString}${hrefString}>${contentString}</a>`;
    };

    htmlHashLink = function (haschArguments, content) {
        return `<a href="javascript:void(0)" onclick="changeHash(${haschArguments})">${content}<a/>`;
    };

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
        });

        ajax(URL_VOLUMES, data => {
            volumes = data;
            volumesLoaded = true;

            if (booksLoaded) {
                cacheBooks(callback);
                // console.log(volumes);
                // console.log(books);
            }
        });
    };

    navigateBook = function (bookId) {
        console.log("navigateBook", bookId);
    };

    navigateChapter = function (bookId, chapter) {
        console.log("navigateChapter", bookId, " - ", chapter);
    };

    navigateHome = function (volumeId) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: volumesGridContent(volumeId)
        });

    };

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
            else {
                navigateHome(volumeId);
            }
        }
        else {
            let bookId = Number(ids[1]);

            if (books[bookId] === undefined) {
                navigateHome();
            }
            else {
                if (ids.length === 2) {
                    navigateBook(bookId);
                }
                else {
                    let chapter = Number(ids[2]);

                    if (bookChapterValid(bookId, chapter)) {
                        navigateChapter(bookId, chapter);
                    }
                    else {
                        navigateHome();
                    }
                }
            }
        }
    };

    volumesGridContent = function (volumeId) {
        let gridContent = "";

        volumes.forEach( function (volume) {
            if (volumeId === undefined || volumeId === volume.id) {
                gridContent += htmlDiv({
                    classKey: CLASS_VOLUMES,
                    content: htmlAnchor(volume) + htmlElement ( TAG_HEADERS, volume.fullName)
                })

                gridContent += booksGrid(volume);
            }
        })

        return gridContent;
    };

    /*--------------------------------------------------------------------
    *                       PUBLIC API
    */

    return {
        init,
        onHashChanged
    };
}());