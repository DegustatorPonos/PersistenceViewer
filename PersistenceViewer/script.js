// Insert the date locale taht will be applied at the table format here
// Leave empty for default date display
// Set to 'auto' to let JS decide the value
const DateTimeDisplayLocale = 'auto'

// The name of the first breadcrum
const FirstCrumbName = "House";

var ohURL = window.location.origin;
var serviceId = getQueryVariable("serviceid").toLowerCase();
var startItem = getQueryVariable("startitem");
var startWithGroups = true;
if (getQueryVariable("startwithgroups").toLowerCase() == "false") {
    startWithGroups = false;
}
var shouldSort = true;
if (getQueryVariable("shouldsort").toLowerCase() == "false") {
    shouldSort = false;
}
console.log("getQueryVariable: serviceId=%s, startItem=%s, startWithGroups=%s, shouldSort=%s",serviceId,startItem,startWithGroups,shouldSort);
document.getElementById("start_tm").defaultValue = "00:00";
document.getElementById("end_tm").defaultValue = "00:00";

function sortTable() {
    var body = document.getElementById("ItemsBody");
    var rows = body.getElementsByTagName("TR");
    var switching = true;
    var shouldSwitch = false;
    var i;
    var x;
    var y;
    while (switching) {// loop until no switching has been done
        switching = false;
        for (i = 0; i < rows.length - 1; i+=1) {// loop through all table rows
            shouldSwitch = false;
            // get the two elements you want to compare, one from current row and one from the next
            x = rows[i].getElementsByTagName("TD")[0];
            y = rows[i + 1].getElementsByTagName("TD")[0];
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {// check if the two rows should switch place
                //if so, mark as a switch and break the loop
                shouldSwitch= true;
                break;
            }
        }
        if (shouldSwitch) {
            // if a switch has been marked, make the switch and mark that a switch has been done
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
    var numGroups = 0;
    for (i = 0; i < rows.length; i+=1) {
        x = rows[i].getElementsByTagName("TD")[0];
        if (x.classList.contains("groupItem")) {
            rows[i].parentNode.insertBefore(rows[i], rows[numGroups++]);
        }
    }
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    var i;
    var pair;
    for (i = 0; i < vars.length; i+=1) {
        pair = vars[i].split("=");
        if (decodeURIComponent(pair[0]).toLowerCase() == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return "";
}

// Fills up the items table with group members
function displayItems(groupMembers) {
    //console.log("displayItems: groupMembers=%s",JSON.stringify(groupMembers));
    //console.log("displayItems: groupMembers.length=%s",groupMembers.length);
    document.getElementById("ItemsBody").innerHTML = "";
    var tableBody = document.getElementById("ItemsBody");
    var i;
    var j;
    var row;
    var cell;
    for (i = 0; i < groupMembers.length; i+=1) {
        row = document.createElement("TR");
        cell = document.createElement("TD");
        cell.innerHTML = groupMembers[i].name;
        row.appendChild(cell);
        if (groupMembers[i].type === "Group") {// it's a group
            cell.classList.add("groupItem");
            //console.log("displayItems: group name=%s",groupMembers[i].name);
            cell.addEventListener("click",function() {
                //console.log("displayItems: cell clicked=%s",this.innerHTML);
                setBreadcrumbs(this.innerHTML,true);
            });
        }
        else {// it's an item
            cell.addEventListener("click",function() {
                //console.log("displayItems: cell clicked=%s",this.innerHTML);
                var activeElements = document.getElementsByClassName("active");
                for (j = 0; j < activeElements.length; j+=1) {
                    activeElements[j].classList.remove("active");
                }
                this.classList.add("active");
                setBreadcrumbs(this.innerHTML,false);
            });                    }
        tableBody.appendChild(row);
    }
    document.getElementById("Items").appendChild(tableBody);
    if (shouldSort === true) {
        sortTable();
    }
}

// Fills up main event table. Uses the item name as an input
function displayHistory(item) {
    if (typeof(item) === "undefined" || item === null) {
        item = document.getElementById("breadcrumbsUL").lastElementChild.lastElementChild.innerHTML;
    }
    var tableBody = document.getElementById("HistoryBody");
    tableBody.innerHTML = "";
    var row;
    var time;
    var state;
    if (item === "") {
        // If API returned null
        row = document.createElement("TR");
        time = document.createElement("TD");
        time.innerHTML = "N/A";
        row.appendChild(time);
        state = document.createElement("TD");
        state.innerHTML = "N/A";
        row.appendChild(state);
        tableBody.appendChild(row);
    }
    else {
        //console.log("displayHistory: item=%s",item);
        // Filling up the selection interval
        var tempDate;
        if (document.getElementById("start_dt").value === "") {
            tempDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
            document.getElementById("start_dt").value = tempDate.toISOString().split("T")[0];
        }
        if (document.getElementById("start_tm").value === "") {
            document.getElementById("start_tm").value = "00:00";
        }
        if (document.getElementById("end_dt").value === "") {
            tempDate = new Date(new Date().setDate(new Date().getDate() + 1));
            document.getElementById("end_dt").value = tempDate.toISOString().split("T")[0];
        }
        if (document.getElementById("end_tm").value === "") {
            document.getElementById("end_tm").value = "00:00";
        }
        var urlString = ohURL + "/rest/persistence/items/" + item + "?starttime=" + document.getElementById("start_dt").value + "T" + document.getElementById("start_tm").value + "&endtime=" + document.getElementById("end_dt").value + "T" + document.getElementById("end_tm").value;
        if (serviceId !== "") {
            urlString = urlString + "&serviceId=" + serviceId;
        }
        console.log("displayHistory API call: urlString=%s",urlString);
        $.ajax({
            url     : urlString,
            data    : {},
            success : function(data) {
                //console.log("displayHistory: data=%s",JSON.stringify(data));
                if (data.datapoints > 0) {
                    var i;
                    if (data.data.length === 2 * data.datapoints) {
                        //this corrects for a bug in the REST API for OnOffType items that was fixed in ESH after 2.3 release (https://github.com/eclipse/smarthome/issues/5628)
                        for (i = 0; i < 2 * data.datapoints; i+=2) {
                            row = document.createElement("TR");
                            time = document.createElement("TD");
                            time.innerHTML = new Date(data.data[i].time);
                            row.appendChild(time);
                            state = document.createElement("TD");
                            state.innerHTML = data.data[i].state;
                            row.appendChild(state);
                            tableBody.insertBefore(row, tableBody.childNodes[0]);
                        }
                    }
                    else {
                        for (i = 0; i < data.datapoints; i+=1) {
                            console.log("Parsing event #%s", i);
                            row = document.createElement("TR");
                            time = document.createElement("TD");
                            time.innerHTML = getDateString(new Date(data.data[i].time));
                            row.appendChild(time);
                            state = document.createElement("TD");
                            state.innerHTML = data.data[i].state;
                            row.appendChild(state);
                            tableBody.insertBefore(row, tableBody.childNodes[0]);
                        }
                    }
                }
                else {
                    row = document.createElement("TR");
                    time = document.createElement("TD");
                    time.innerHTML = "N/A";
                    row.appendChild(time);
                    state = document.createElement("TD");
                    state.innerHTML = "N/A";
                    row.appendChild(state);
                    tableBody.appendChild(row);
                }
                document.getElementById("History").appendChild(tableBody);
            },
            error: function(error){
                console.log("displayHistory: error=%s",error);
            }
        });
    }
}

// Sets the date in the correct given format
function getDateString(date) {
    if (DateTimeDisplayLocale == '') {
        return date
    }
    else if (DateTimeDisplayLocale == 'auto') {
        return date.toLocaleString();
    } else {
        return date.toLocaleString(DateTimeDisplayLocale);
    }
}

function getItems(item) {
    //console.log("getItems: %s",item);
    var urlString = ohURL + "/rest/items";
    if (item === "") {
        urlString = urlString + "?recursive=false";
    }
    else {
        urlString = urlString + "/" + item;
    }
    //console.log("getItems: urlString=%s",urlString);
    $.ajax({
        url     : urlString,
        data    : {},
        success : function(data) {
            //console.log("getItems: data=#s",JSON.stringify(data));
            //console.log("getItems: data: groups=%s",JSON.stringify(data).includes("members"));
            if (item === "" && startWithGroups === true) {
                //console.log("first load: data.length=%s",data.length);
                var i;
                for (i = data.length - 1; i >= 0; i-=1) {
                    if (data[i].groupNames.length > 0) {
                        data.splice(i,1);// remove everything but groups that are not members of a group
                    }
                }
            }
            if (data.members) {
                displayItems(data.members);
            }
            else {
                if(data.name == item) {
                    // If we are here then there are no items that we need to display.
                    // Therefore, we hide the item table
                    document.getElementById("Items").style.display = "none";
                    document.getElementById("History").style.width = "calc(100% - 20px)";
                }
                else {
                    displayItems(data);
                }
            }
            displayHistory(item);
        },
        error : function(error){
            console.log("getItems: error=%s",error);
        }
    });
}

function setBreadcrumbs(item,isGroup) {
    var breadcrumbsUL = document.getElementById("breadcrumbsUL");
    var oldBreadcrumbs = breadcrumbsUL.children;
    var lastBreadcrumb = breadcrumbsUL.lastElementChild;
    //console.log("setBreadcrumbs: oldBreadcrumbs=%s",JSON.stringify(oldBreadcrumbs));
    if (lastBreadcrumb.hasChildNodes() && lastBreadcrumb.children[0].href === "") {
        breadcrumbsUL.removeChild(lastBreadcrumb);
        oldBreadcrumbs = breadcrumbsUL.children;
    }
    if (isGroup) {
        var indexFound = 0;
        var i;
        for (i = oldBreadcrumbs.length - 1; i >= 0; i-=1) {
            //console.log("setBreadcrumbs: text=%s",oldBreadcrumbs[i].children[0].text);
            if (oldBreadcrumbs[i].children[0].text === item) {
                indexFound = i;
            }
        }
        if (indexFound > 0 || item === startItem) {
            for (i = oldBreadcrumbs.length - 1; i >= indexFound; i-=1) {
                breadcrumbsUL.removeChild(oldBreadcrumbs[i]);
            }
        }
        getItems(item);
        var activeElements = document.getElementsByClassName("active");
        for (i = 0; i < activeElements.length; i+=1) {
            activeElements[i].classList.remove("active");
        }
    }
    else {
        displayHistory(item);
    }
    if (item === startItem) {
        createFirstBreadcrumb(startItem);
    }
    else {
        var breadcrumb = document.createElement("LI");
        var breadcrumbAnchor = document.createElement("A");
        var breadcrumbText = document.createTextNode(item);
        //breadcrumbAnchor.appendChild(breadcrumbText);
        if (isGroup) {
            breadcrumbAnchor.setAttribute("href","javascript:setBreadcrumbs('" + item + "',true)");
        }
        breadcrumbAnchor.appendChild(breadcrumbText);
        breadcrumb.appendChild(breadcrumbAnchor);
        breadcrumbsUL.appendChild(breadcrumb);
    }
}

function createFirstBreadcrumb(item) {
    var newItem = item;
    if (item === startItem) {
        newItem = FirstCrumbName;
    }
    var breadcrumbsUL = document.getElementById("breadcrumbsUL");
    var breadcrumb = document.createElement("LI");
    var breadcrumbAnchor = document.createElement("A");
    var breadcrumbText = document.createTextNode(newItem);
    //breadcrumbAnchor.appendChild(breadcrumbText);
    breadcrumbAnchor.setAttribute("href","javascript:setBreadcrumbs('" + item + "',true)");
    breadcrumbAnchor.appendChild(breadcrumbText);
    breadcrumb.appendChild(breadcrumbAnchor);
    breadcrumbsUL.appendChild(breadcrumb);
}

$( "#history_canvas" ).ready($(function() {
    //console.log("start");
    createFirstBreadcrumb(startItem);
    getItems(startItem);
}));