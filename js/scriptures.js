/*========================================================================
* FILE:     scriptures.js
* AUTHOR:   Stephen W. Liddle with some help of Dakota Orrock
* DATE:     Winter 2021
*
* DESCRIPTION: Front end JS for Project 1 - IS 542 - BYU
*/
/*jslint
    browser, long, this, for
*/
/*global
    console, google, map
*/
/*property
    Animation, DROP, LatLng, LatLngBounds, Marker, Point, Size, animation,
    books, catch, classKey, color, content, exec, extend, fitBounds, fontSize,
    fontWeight, forEach, from, fullName, getAttribute, getElementById,
    getElementsByClassName, getLabel, getPosition, gridName, hash, href, icon,
    id, includes, init, innerHTML, json, label, labelOrigin, lat, length, lng,
    log, map, maps, maxBookId, message, minBookId, numChapters, ok,
    onHashChanged, position, push, querySelectorAll, scaledSize, setCenter,
    setLabel, setMap, setZoom, slice, split, text, then, title, tocName, url
*/






const Scriptures = (function () {
    "use strict";

    /*--------------------------------------------------------------------
    *                      CONSTANTS
    */

    const BOTTOM_PADDING = "<br /><br />";
    const CLASS_BOOKS = "books";
    const CLASS_BUTTON = "btn";
    const CLASS_VOLUMES = "volumes";
    const CLASS_CHAPTER = "chapter";
    const CLASS_NAV_HEADING = "navheading";
    const CLASS_PADDING_LEFT = "padding-left";
    const DIV_SCRIPTURES_NAVIGATOR = "scripnav";
    const DIV_SCRIPTURES = "scriptures";
    const ICON_ORIGIN_X = 10;
    const ICON_ORIGIN_Y = 40;
    const ICON_SCALED_SIZE = 30;
    const INDEX_FLAG = 11;
    const INDEX_LATITUDE = 3;
    const INDEX_LONGITUDE = 4;
    const INDEX_PLACENAME = 2;
    const LABEL_FONT_COLOR = "#22222";
    const LABEL_FONT_SIZE = "12px";
    const LABEL_FONT_WEIGHT = "bold";
    const LABEL_ICON = "http://image.flaticon.com/icons/svg/252/252025.svg";
    const LAT_LONG_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
    const SINGLE_MARKER_ZOOM = 10;
    const SINGLE_GMMARKERS_INDEX = 0;
    const TAG_HEADERS = "h3";
    const URL_BASE = "https://scriptures.byu.edu/";
    const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
    const URL_SCRIPTURES = `${URL_BASE}mapscrip/mapgetscrip.php`;
    const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;

    /*--------------------------------------------------------------------
    *                       PRIVATE VARIABLES
    */
    let books;
    let gmMarkers = [];
    let volumes;
    let savedBookId;
    let savedChapter;

    /*--------------------------------------------------------------------
    *                       PRIVATE METHOD DECLARATIONS
    */
    let addMarker;
    let ajax;
    let cacheBooks;
    let bookChapterValid;
    let booksGrid;
    let booksGridContent;
    let chaptersGrid;
    let chaptersGridContent;
    let clearMarkers;
    let encodedScripturesURLParameters;
    let getScriptersCallback;
    let getScripturesFailure;
    let htmlAnchor;
    let htmlDiv;
    let htmlElement;
    let htmlLink;
    // let htmlHashLink;
    let init;
    let insertNavLinks;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let nextChapter;
    let onHashChanged;
    let previousChapter;
    let setUpMarkers;
    let titleForBookChapter;
    let updateMap;
    let volumesGridContent;



    /*--------------------------------------------------------------------
    *                       PRIVATE METHODS
    */

    addMarker = function (placeName, latitude, longitude) {
        let existsInArray = false;

        gmMarkers.forEach(function (gmMarker) {
            let gmMarkerLocation = gmMarker.getPosition();

            if (gmMarkerLocation.lat() === Number(latitude) && gmMarkerLocation.lng() === Number(longitude)) {
                existsInArray = true;

                if (!gmMarker.label.text.split(",").includes(placeName)) {
                    let gmMarkerLabel = gmMarker.getLabel();
                    gmMarkerLabel.text += `, ${placeName}`;
                    gmMarker.setLabel(gmMarkerLabel);
                }

            }
        });

        // For help with labels : https://cheppers.com/google-map-labelled-markers

        if (existsInArray === false) {
            let marker = new google.maps.Marker({
                position: {lat: Number(latitude), lng: Number(longitude)},
                title: placeName,
                map,
                animation: google.maps.Animation.DROP,
                label: {
                    text: placeName,
                    color: LABEL_FONT_COLOR,
                    fontSize: LABEL_FONT_SIZE,
                    fontWeight: LABEL_FONT_WEIGHT
                },
                icon: {
                    // https://www.drupal.org/project/geolocation/issues/2882573
                    url: LABEL_ICON,
                    scaledSize: new google.maps.Size(ICON_SCALED_SIZE, ICON_SCALED_SIZE),
                    labelOrigin: new google.maps.Point(ICON_ORIGIN_X, ICON_ORIGIN_Y)
                }
            });

            gmMarkers.push(marker);
        }
    };

    ajax = function (url, successCallback, failureCallback, skipJsonParse) {
        fetch(url).then(function (response) {
            if (response.ok) {
                return (
                    skipJsonParse
                    ? response.text()
                    : response.json()
                );
            }
        }).then(function (data) {
            if (typeof successCallback === "function") {
                successCallback(data);
            }
        }).catch(function (error) {
            console.log("Fetch error: ", error.message);
            if (typeof failureCallback === "function") {
                failureCallback(error);
            }
        });
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
        });
    };

    booksGridContent = function (volume) {
        let gridContent = "";

        volume.books.forEach(function (book) {
            gridContent += htmlLink({
                classKey: CLASS_BUTTON,
                id: book.id,
                href: `#${volume.id}:${book.id}`,
                content: book.gridName
            });
        });

        return gridContent;
    };

    chaptersGrid = function (book) {
        return htmlDiv({
            classKey: CLASS_VOLUMES,
            content: htmlElement(TAG_HEADERS, book.fullName)
        }) + htmlDiv({
            classKey: CLASS_BOOKS,
            content: chaptersGridContent(book)
        });
    };

    chaptersGridContent = function (book) {
        let gridContent = "";
        let chapter = 1;

        while (chapter <= book.numChapters) {
            gridContent += htmlLink({
                classKey: `${CLASS_BUTTON} ${CLASS_CHAPTER}`,
                id: chapter,
                href: `#0:${book.id}:${chapter}`,
                content: chapter
            });
            chapter += 1;
        }
        return gridContent;
    };

    cacheBooks = function (callback) {
        volumes.forEach(function (volume) {
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

    clearMarkers = function () {
        gmMarkers.forEach(function (marker) {
            marker.setMap(null);
        });

        gmMarkers = [];
    };

    encodedScripturesURLParameters = function (bookId, chapter, verses, isJst) {
        if (bookId !== undefined && chapter !== undefined) {
            let options = "";

            if (verses !== undefined) {
                options += `&versus=${verses}`;
            }

            if (isJst !== undefined) {
                options += `&jst=JST`;
            }

            return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}${options}`;
        }
    };

    getScriptersCallback = function (chapterHtml) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;
        insertNavLinks(savedBookId, savedChapter);
        setUpMarkers();
    };

    getScripturesFailure = function () {
        // FIXME: Better Error Handling
        document.getElementById(DIV_SCRIPTURES).innerHTML = "Unable to retrieve chapter contents.";
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
        let titleString = "";

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

        if (parameters.title !== undefined) {
            titleString = ` title="${parameters.title}"`;
        }

        return `<a${idString}${classString}${hrefString}${titleString}>${contentString}</a>`;
    };

    // htmlHashLink = function (hashArguments, content) {
    //     return `<a href="javascript:void(0)" onclick="changeHash(${hashArguments})">${content}<a/>`;
    // };

    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;

        ajax(URL_BOOKS, function (data) {
            books = data;
            booksLoaded = true;

            if (volumesLoaded) {
                cacheBooks(callback);
            }
        });

        ajax(URL_VOLUMES, function (data) {
            volumes = data;
            volumesLoaded = true;

            if (booksLoaded) {
                cacheBooks(callback);
            }
        });
    };

    insertNavLinks = function (bookId, chapter) {
        let navDivs = Array.from(document.getElementsByClassName(CLASS_NAV_HEADING));

        let nextChap = nextChapter(bookId, chapter);
        let prevChap = previousChapter(bookId, chapter);
        let childDiv = "";

        if (prevChap !== undefined) {
            childDiv += htmlLink({
                content: "<",
                href: `#0:${prevChap[0]}:${prevChap[1]}`,
                title: prevChap[2],
                classKey: CLASS_BUTTON
            });
        }

        if (nextChap !== undefined) {
            childDiv += htmlLink({
                content: ">",
                href: `#0:${nextChap[0]}:${nextChap[1]}`,
                title: nextChap[2],
                classKey: CLASS_BUTTON
            });
        }

        navDivs.forEach(function (element) {
            element.innerHTML += htmlDiv({
                content: childDiv,
                classKey: CLASS_PADDING_LEFT
            });
        });
    };

    navigateBook = function (bookId) {
        let book = books[bookId];

        if (book.numChapters <= 1) {
            navigateChapter(bookId, book.numChapters);
        } else {
            document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
                id: DIV_SCRIPTURES_NAVIGATOR,
                content: chaptersGrid(book)
            });
        }
    };

    navigateChapter = function (bookId, chapter) {
        savedBookId = bookId;
        savedChapter = chapter;

        ajax(encodedScripturesURLParameters(bookId, chapter), getScriptersCallback, getScripturesFailure, true);
    };

    navigateHome = function (volumeId) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: volumesGridContent(volumeId)
        });

    };

    nextChapter = function (bookId, chapter) {
        let book = books[bookId];

        if (book !== undefined) {
            if (chapter < book.numChapters) {
                return [
                    bookId,
                    chapter + 1,
                    titleForBookChapter(book, chapter + 1)
                ];
            }

            let nextBook = books[bookId + 1];

            if (nextBook !== undefined) {
                let nextChapterValue = 0;

                if (nextBook.numChapters > 0) {
                    nextChapterValue = 1;
                }

                return [
                    nextBook.id,
                    nextChapterValue,
                    titleForBookChapter(nextBook, nextChapterValue)
                ];
            }
        }
    };

    onHashChanged = function () {
        let ids = [];

        if (location.hash !== "" && location.hash.length > 1) {
            ids = location.hash.slice(1).split(":");
        }

        if (ids.length <= 0) {
            navigateHome();
        } else if (ids.length === 1) {
            let volumeId = Number(ids[0]);

            if (volumeId < volumes[0].id || volumeId > volumes.slice(-1)[0].id) {
                navigateHome();
            } else {
                navigateHome(volumeId);
            }
        } else {
            let bookId = Number(ids[1]);

            if (books[bookId] === undefined) {
                navigateHome();
            } else {
                if (ids.length === 2) {
                    navigateBook(bookId);
                } else {
                    let chapter = Number(ids[2]);

                    if (bookChapterValid(bookId, chapter)) {
                        navigateChapter(bookId, chapter);
                    } else {
                        navigateHome();
                    }
                }
            }
        }
    };

    previousChapter = function (bookId, chapter) {
        let book = books[bookId];

        if (book !== undefined) {
            if (chapter > 1) {
                return [
                    bookId,
                    chapter - 1,
                    titleForBookChapter(book, chapter - 1)
                ];
            }

            let previousBook = books[bookId - 1];

            if (previousBook !== undefined) {
                return [
                    previousBook.id,
                    previousBook.numChapters,
                    titleForBookChapter(previousBook, previousBook.numChapters)
                ];
            }
        }
    };

    setUpMarkers = function () {
        if (gmMarkers.length > 0) {
            clearMarkers();
        }

        document.querySelectorAll("a[onclick^=\"showLocation(\"]").forEach(function (ele) {
            let matches = LAT_LONG_PARSER.exec(ele.getAttribute("onClick"));

            if (matches) {
                let placeName = matches[INDEX_PLACENAME];
                let latitude = matches[INDEX_LATITUDE];
                let longitude = matches[INDEX_LONGITUDE];
                let flag = matches[INDEX_FLAG];

                if (flag !== "") {
                    placeName = `${placeName} ${flag}`;
                }

                addMarker(placeName, latitude, longitude);
            }
        });

        updateMap();
    };

    titleForBookChapter = function (book, chapter) {
        if (book !== undefined) {
            if (chapter > 0) {
                return `${book.tocName} ${chapter}`;
            }

            return book.tocName;
        }
    };

    updateMap = function () {
        if (gmMarkers.length === 1) {
            map.setZoom(SINGLE_MARKER_ZOOM);
            map.setCenter(gmMarkers[SINGLE_GMMARKERS_INDEX].getPosition());
        } else if (gmMarkers.length > 1) {
            let bounds = new google.maps.LatLngBounds();

            gmMarkers.forEach(function (marker) {
                bounds.extend(marker.getPosition());
            });

            map.fitBounds(bounds);
        }
    };

    volumesGridContent = function (volumeId) {
        let gridContent = "";

        volumes.forEach(function (volume) {
            if (volumeId === undefined || volumeId === volume.id) {
                gridContent += htmlDiv({
                    classKey: CLASS_VOLUMES,
                    content: htmlAnchor(volume) + htmlElement(TAG_HEADERS, volume.fullName)
                });

                gridContent += booksGrid(volume);
            }
        });

        return gridContent + BOTTOM_PADDING;
    };

    /*--------------------------------------------------------------------
    *                       PUBLIC API
    */

    return {
        init,
        onHashChanged
    };
}());

function showLocation(geotagId, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading) {
    map.setZoom(Number(viewAltitude));
    let position = new google.maps.LatLng(Number(latitude), Number(longitude));
    map.setCenter(position);

    // This console.log is just for jsLint purposes
    console.log(geotagId, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading);
}