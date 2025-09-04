/// <reference path="../../typings/tsd.d.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Charts;
    (function (Charts) {
        class ChartHelperFunctions {
            static getZeroXCoordinate(min, max, width) {
                var xCoordinate = (min / (max - min)) * width * -1;
                if (xCoordinate == width) {
                    xCoordinate--;
                }
                return xCoordinate;
            }
            static getXCoordinate(min, max, width, value) {
                var xCoordinate = (min / (max - min)) * width * -1;
                if (value < 0) {
                    xCoordinate -= ChartHelperFunctions.getWidth(min, max, width, value);
                }
                if (xCoordinate == width) {
                    xCoordinate--;
                }
                return xCoordinate;
            }
            static getXCoordinateForMarker(min, max, width, value, markerWidth) {
                var xCoordinate = ((value - min) / (max - min)) * width;
                xCoordinate -= (value - min) / (max - min) * markerWidth;
                return xCoordinate;
            }
            static getWidth(min, max, width, value) {
                return Math.abs((value / (max - min)) * width);
            }
        }
        Charts.ChartHelperFunctions = ChartHelperFunctions;
    })(Charts = CockpitFramework.Charts || (CockpitFramework.Charts = {}));
})(CockpitFramework || (CockpitFramework = {}));

function removePropertiesFromObject(data, propertiesToRemove) {
    const result = $.extend({}, data);
    if (!propertiesToRemove) {
        propertiesToRemove = [];
    }
    if (data) {
        // remove properties (e.g. calculated properties)
        propertiesToRemove.forEach(property => {
            delete result[property];
        });
        // remove relation objects
        for (const property in result) {
            if (!(data[property] instanceof Date)
                && !((data[property] || data[property] === 0) && !isNaN(data[property]))
                && result[property] instanceof Object) {
                delete result[property];
            }
        }
    }
    return result;
}
function convertToODataObject(object, affectedProperties = null) {
    if (angular.isObject(object) && !angular.isDate(object)) {
        Object.getOwnPropertyNames(object).forEach((value, index, array) => {
            if (angular.isObject(object[value]) && !angular.isDate(object[value])) {
                object[value] = this.convertToODataObject(object[value], affectedProperties);
            }
            else if (!affectedProperties || affectedProperties.indexOf(value) > -1) {
                object[value] = this.convertToODataValue(object[value]);
            }
        });
    }
    return object;
}
function convertToODataValue(value) {
    if (angular.isString(value)) {
        if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            value = "guid'" + value + "'";
        }
        else {
            value = "'" + value + "'";
        }
    }
    else if (angular.isDate(value)) {
        value = "datetime'" + kendo.toString(value, "yyyy-MM-ddTHH:mm:ss") + "'";
    }
    else if (typeof value == "boolean") {
        value = value.toString();
    }
    return value;
}

/// <reference path="../../typings/tsd.d.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Application;
    (function (Application) {
        class ApplicationConfiguration {
            constructor() {
                this.username = "";
                this.title = "Cockpit Framework";
                this.supportEmail = "support@timecockpit.com";
                this.version = "";
                this.defaultUrl = "";
                this.modules = [];
                this.controllerProviders = [];
                this.routes = [];
                this.applicationUrl = "";
                this.staticResourceImageUrl = "/images/";
                this.staticResourceImageExtension = ".png";
                this.language = "en";
                this.formSizeS = 640;
                this.formSizeXS = 440;
                this.localeUrls = [];
                this.angularRoutes = [
                    "/app/dashboard/:dashboard",
                    "/app/external/:url",
                    "/app/import/importdefinition",
                    "/app/import/:importuuid",
                    "/app/lists-ng/:listName"
                ];
                // list
                this.allowReportingServicesExports = true;
                // colors
                this.primaryPalette = {
                    "50": "#ffffff",
                    "100": "#c6e6f5",
                    "200": "#96d1ed",
                    "300": "#59b7e3",
                    "400": "#3fabde",
                    "500": "#25a0da",
                    "600": "#218dc0",
                    "700": "#1c7aa6",
                    "800": "#18668c",
                    "900": "#135371",
                    "A100": "#ffffff",
                    "A200": "#c6e6f5",
                    "A400": "#3fabde",
                    "A700": "#1c7aa6",
                    "contrastDefaultColor": "light",
                    "contrastDarkColors": "50 100 200 300 400 A100 A200 A400"
                };
                this.accentPalette = {
                    "50": "#ffffff",
                    "100": "#dcefd1",
                    "200": "#bce1a7",
                    "300": "#94cf72",
                    "400": "#83c75b",
                    "500": "#72bf44",
                    "600": "#64aa3a",
                    "700": "#579332",
                    "800": "#497d2b",
                    "900": "#3c6623",
                    "A100": "#ffffff",
                    "A200": "#dcefd1",
                    "A400": "#83c75b",
                    "A700": "#579332",
                    "contrastDefaultColor": "light",
                    "contrastDarkColors": "50 100 200 300 400 A100 A200 A400"
                };
                this.warnPalette = {
                    "50": "#ffffff",
                    "100": "#fff2bd",
                    "200": "#ffe785",
                    "300": "#ffd83d",
                    "400": "#ffd21f",
                    "500": "#ffcc00",
                    "600": "#e0b400",
                    "700": "#c29b00",
                    "800": "#a38300",
                    "900": "#856a00",
                    "A100": "#ffffff",
                    "A200": "#fff2bd",
                    "A400": "#ffd21f",
                    "A700": "#c29b00",
                    "contrastDefaultColor": "light",
                    "contrastDarkColors": "50 100 200 300 400 500 600 700 A100 A200 A400 A700"
                };
            }
        }
        Application.ApplicationConfiguration = ApplicationConfiguration;
    })(Application = CockpitFramework.Application || (CockpitFramework.Application = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../TypeScript/Application/ApplicationService.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Navigation;
    (function (Navigation) {
        class HttpRequestInterceptorFactory {
            static Create($q, $location, $window, $injector, $log, localStorageService) {
                HttpRequestInterceptorFactory.$q = $q;
                HttpRequestInterceptorFactory.$location = $location;
                HttpRequestInterceptorFactory.$window = $window;
                HttpRequestInterceptorFactory.$injector = $injector;
                HttpRequestInterceptorFactory.$log = $log;
                HttpRequestInterceptorFactory.localStorageService = localStorageService;
                return new HttpRequestInterceptorFactory();
            }
            static processRequest(config) {
                if (!config.headers) {
                    config.headers = {};
                }
                var impersonationUsername = CockpitFramework.Application.ApplicationService.getCurrentApplication().impersonationUsername;
                if (impersonationUsername) {
                    config.headers["cofx-impersonated-account"] = impersonationUsername;
                }
                if (HttpRequestInterceptorFactory.localStorageService) {
                    var signalKey = HttpRequestInterceptorFactory.localStorageService.get("calendar.signalKey");
                    if (signalKey && config.url.indexOf("/timesheetcalendar/") == 0) {
                        config.headers["tc-signal-key"] = signalKey;
                    }
                    var selectedDevice = HttpRequestInterceptorFactory.localStorageService.get("calendar.selectedDevice");
                    if (signalKey && config.url.indexOf("/timesheetcalendar/") == 0) {
                        config.headers["tc-signal-device"] = selectedDevice;
                    }
                }
                return config;
            }
            static processResponse(response, $injector, $log, $q) {
                var deferred = $q.defer();
                var isDeferred = false;
                if (response.headers("content-type") && response.headers("content-type").indexOf("application/json") >= 0) {
                    if (response.config && response.data) {
                        try {
                            var metadata = null;
                            var cofxHttp = $injector.get("cofxHttp");
                            var responseObject = response.data;
                            if (angular.isString(responseObject)) {
                                responseObject = JSON.parse(responseObject);
                            }
                            if (response.config.url.indexOf("/odata/") >= 0) {
                                var entity = null;
                                var odataUrl = responseObject["odata.metadata"];
                                if (odataUrl) {
                                    var matches = odataUrl.match(/\$metadata#\w*/);
                                    if (matches.length > 0) {
                                        entity = matches[0].replace(/\$metadata#/, "");
                                    }
                                }
                                if (entity) {
                                    metadata = HttpRequestInterceptorFactory.metadata[entity];
                                    if (!metadata) {
                                        // load metadata
                                        isDeferred = true;
                                        var dataContextService = CockpitFramework.Application.ApplicationService.getInjector().get("dataContextService");
                                        dataContextService.getMetadata(entity).toPromise().then((newMetadata) => {
                                            HttpRequestInterceptorFactory.metadata[entity] = newMetadata;
                                            response.data = cofxHttp.transformResponseObject(response.data, newMetadata);
                                            deferred.resolve(response);
                                        }).catch((error) => {
                                            $log.error("Could not load metadata for " + entity + ": " + error);
                                        });
                                    }
                                    else {
                                        response.data = cofxHttp.transformResponseObject(response.data, metadata);
                                    }
                                }
                                else {
                                    console.error("Metadata is missing for odata object " + response.data);
                                }
                            }
                            else {
                                metadata = responseObject.metadata;
                                if (!metadata && responseObject.entityObject) {
                                    metadata = responseObject.entityObject.metadata;
                                }
                            }
                            if (!isDeferred) {
                                response.data = cofxHttp.transformResponseObject(response.data, metadata);
                            }
                        }
                        catch (e) {
                            $log.error("Could not convert response data: " + JSON.stringify(e));
                            throw e;
                        }
                    }
                }
                if (!isDeferred) {
                    deferred.resolve(response);
                }
                return deferred.promise;
            }
            request(config) {
                return HttpRequestInterceptorFactory.processRequest(config);
            }
            response(response) {
                return HttpRequestInterceptorFactory.processResponse(response, HttpRequestInterceptorFactory.$injector, HttpRequestInterceptorFactory.$log, HttpRequestInterceptorFactory.$q);
            }
            responseError(rejection) {
                var that = this;
                var appInsightsService = HttpRequestInterceptorFactory.$injector.get("appInsightsService");
                appInsightsService.trackException(new Error("Could not load " + rejection.config.url + ", rejection: " + JSON.stringify(rejection)));
                // ignore version check and missing localizations
                if (rejection.config.url == "/shell/version" || rejection.config.url.indexOf("/shell/entityversions") == 0 || rejection.config.url.indexOf("/assets/i18n/") == 0) {
                    return HttpRequestInterceptorFactory.$q.reject(rejection);
                }
                var rejectionData = null;
                try {
                    if (angular.isString(rejection)) {
                        var error = new NavigationError();
                        error.message = rejection;
                        HttpRequestInterceptorFactory.lastError = error;
                    }
                    else if (rejection.data) {
                        if (angular.isString(rejection.data)) {
                            HttpRequestInterceptorFactory.lastError = JSON.parse(rejection.data);
                        }
                        else {
                            HttpRequestInterceptorFactory.lastError = rejection.data;
                        }
                        rejectionData = HttpRequestInterceptorFactory.lastError;
                    }
                }
                catch (e) {
                    HttpRequestInterceptorFactory.lastError = HttpRequestInterceptorFactory.getUndefinedError();
                }
                var parser;
                if (rejection.config && rejection.config.url) {
                    parser = document.createElement("a");
                    parser.href = rejection.config.url;
                }
                if (rejection.config.url.indexOf("/password/reset") < 0 && rejection.config.url.indexOf("/password/change") < 0) {
                    var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                    if (HttpRequestInterceptorFactory.lastError == null) {
                        var $translate = CockpitFramework.Application.ApplicationService.getInjector().get("$translate");
                        if (rejection.config.method == "DELETE" && rejection.status == 404) {
                            $translate(["cofx.error.objectToDeleteNotFoundTitle", "cofx.error.objectToDeleteNotFoundDescription"]).then((values) => {
                                messageService.alert("objecttodeletenotfound", values["cofx.error.objectToDeleteNotFoundTitle"], values["cofx.error.objectToDeleteNotFoundDescription"]);
                            });
                        }
                        else if (rejection.config.method == "POST" && rejection.config.url.indexOf("/odata/") == 0 && rejection.status == 404) {
                            $translate(["cofx.error.objectToUpdateNotFoundTitle", "cofx.error.objectToUpdateNotFoundDescription"]).then((values) => {
                                messageService.alert("objecttoupdatenotfound", values["cofx.error.objectToUpdateNotFoundTitle"], values["cofx.error.objectToUpdateNotFoundDescription"]);
                            });
                        }
                        else {
                            $translate(["cofx.error.sessionTimeoutTitle", "cofx.error.sessionTimeoutDescription"]).then((values) => {
                                messageService.alert("sessiontimeout", values["cofx.error.sessionTimeoutTitle"], values["cofx.error.sessionTimeoutDescription"])
                                    .then((messageResult) => {
                                    if (messageResult == CockpitFramework.Controls.MessageResult.Accept) {
                                        HttpRequestInterceptorFactory.$window.location.reload();
                                    }
                                });
                            });
                        }
                    }
                    else if (rejection.config && rejection.config.url.indexOf("/error/") == 0) {
                        HttpRequestInterceptorFactory.$location.url("/shell/logout");
                    }
                    else if (rejectionData && (rejectionData["odata.error"] || rejectionData["ExceptionMessage"])) {
                        // OData 
                        var key = "unknownodataerror";
                        var title = "Error";
                        var errorText = "An error with status code " + rejection.status.toString() + " occurred when loading data from the " + CockpitFramework.Application.ApplicationService.getCurrentApplication().configuration.title + " service.";
                        var internalError = "";
                        if (rejectionData["odata.error"]) {
                            var odataError = rejectionData["odata.error"];
                            if (angular.isString(odataError.message)) {
                                errorText = odataError.message;
                            }
                            else if (odataError.message.value) {
                                errorText = odataError.message.value;
                            }
                            while (odataError.innererror) {
                                odataError = odataError.innererror;
                                if (angular.isString(odataError.message)) {
                                    errorText = odataError.message;
                                }
                                else if (odataError.message.value) {
                                    errorText = odataError.message.value;
                                }
                            }
                            if (odataError.code == "TimeCockpit.Data.DataModel.ValidationException") {
                                key = "validationerror";
                                title = "Item not Valid";
                            }
                            else if (odataError.code == "TimeCockpit.Data.Database.ForeignKeyDeleteConflictException") {
                                key = "foreignkeydeleteconflicterror";
                                title = "Item Cannot be Deleted";
                            }
                            else if ((odataError.code == "System.Data.SqlClient.SqlException" || odataError.code == "Microsoft.Data.SqlClient.SqlException") && odataError.message && odataError.message.value && odataError.message.value.indexOf("Execution Timeout Expired.") == 0) {
                                key = "executiontimeouterror";
                                title = "Execution Timeout";
                            }
                            else if (odataError.code == "TimeCockpit.Data.DataModel.MemberNullException" && rejection.config.url == "/validate") {
                                key = "validatemembernullexception";
                                title = "Member Null Exception in Validate";
                            }
                            else if (odataError.code == "TimeCockpit.Data.DataModel.SecurityException") {
                                key = "securityexception";
                                title = "No Permission";
                            }
                        }
                        else if (rejectionData["ExceptionMessage"]) {
                            errorText = rejectionData["ExceptionMessage"];
                        }
                        else {
                            internalError = JSON.stringify(rejectionData);
                        }
                        var parameters = {
                            statusText: rejection.statusText,
                            error: errorText,
                            internalError: internalError,
                            source: HttpRequestInterceptorFactory.$location.absUrl(),
                            request: JSON.stringify(rejection)
                        };
                        if (key == "validatemembernullexception") {
                        }
                        else if (key == "validationerror" || key == "foreignkeydeleteconflicterror" || key == "securityexception") {
                            messageService.alert(key, title, errorText);
                        }
                        else {
                            messageService.error(key, title, errorText, parameters);
                        }
                    }
                    else if ((rejection.config && rejection.config.handlePermissions === false && rejection.status == 403)
                        || (rejection.status != 403 && rejection.config && (rejection.config.url.indexOf("/timesheetcalendar/timesheettemplates/") == 0
                            || rejection.config.url.indexOf("/timesheetcalendar/durationsignals/") == 0
                            || rejection.config.url.indexOf("/timesheetcalendar/signaldetails/") == 0
                            || rejection.config.url.indexOf("/shell/version") == 0
                            || (parser && parser.host.replace(":" + parser.port, "") != HttpRequestInterceptorFactory.$location.host())))) {
                        // TODO: specify list of ignore urls
                        return HttpRequestInterceptorFactory.$q.reject(rejection);
                    }
                    else {
                        HttpRequestInterceptorFactory.$location.url("/app/error/" + HttpRequestInterceptorFactory.lastError.errorCode);
                    }
                }
                return HttpRequestInterceptorFactory.$q.reject(rejection);
            }
            raiseError(error) {
                HttpRequestInterceptorFactory.lastError = error;
                HttpRequestInterceptorFactory.$location.url("/app/error/" + HttpRequestInterceptorFactory.lastError.errorCode);
            }
            getLastError() {
                var that = this;
                return HttpRequestInterceptorFactory.lastError;
            }
            static getUndefinedError() {
                var error = new NavigationError();
                error.errorCode = "unknown";
                error.message = "Unknown error";
                return error;
            }
        }
        HttpRequestInterceptorFactory.handeledExceptions = ["TimeCockpit.Data.DataModel.ValidationException", "TimeCockpit.Data.Database.ForeignKeyDeleteConflictException"];
        HttpRequestInterceptorFactory.metadata = {};
        Navigation.HttpRequestInterceptorFactory = HttpRequestInterceptorFactory;
        class NavigationError {
        }
        Navigation.NavigationError = NavigationError;
    })(Navigation = CockpitFramework.Navigation || (CockpitFramework.Navigation = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        (function (MessageType) {
            MessageType[MessageType["Alert"] = 1] = "Alert";
            MessageType[MessageType["Confirm"] = 2] = "Confirm";
            MessageType[MessageType["Error"] = 3] = "Error";
        })(Controls.MessageType || (Controls.MessageType = {}));
        var MessageType = Controls.MessageType;
        (function (MessageResult) {
            MessageResult[MessageResult["Confirm"] = 1] = "Confirm";
            MessageResult[MessageResult["Cancel"] = 2] = "Cancel";
            MessageResult[MessageResult["Accept"] = 3] = "Accept";
            MessageResult[MessageResult["Duplicate"] = 4] = "Duplicate";
        })(Controls.MessageResult || (Controls.MessageResult = {}));
        var MessageResult = Controls.MessageResult;
        class ApplicationMessage {
        }
        Controls.ApplicationMessage = ApplicationMessage;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        class ViewService {
            constructor() {
                var that = this;
                that._views = [];
                // handle Angular events
                that.navigationService = CockpitFramework.Application.ApplicationService.getInjector().get("navigationService");
                that.navigationService.viewOpened.subscribe((view) => {
                    this.addView(view);
                });
            }
            addView(view) {
                var that = this;
                that._views.push(view);
                if (that._onViewAdded) {
                    that._onViewAdded(view);
                }
                if (that.viewsChangedFunction) {
                    that.viewsChangedFunction(that._views.length);
                }
            }
            closeView(view, viewClosedEventArgs) {
                var that = this;
                var index = that._views.indexOf(view);
                that._views.splice(index, 1);
                if (view && view.onClosed) {
                    view.onClosed(viewClosedEventArgs);
                }
                if (view && view.scope) {
                    view.scope.$destroy();
                }
                if (that.viewsChangedFunction) {
                    that.viewsChangedFunction(that._views.length);
                }
            }
            closeAllViews() {
                var that = this;
                while (that._views.length > 0) {
                    var view = that._views.pop();
                    if (view.onClosed) {
                        view.onClosed(null);
                    }
                }
                if (that.viewsChangedFunction) {
                    that.viewsChangedFunction(that._views.length);
                }
            }
            views() {
                var that = this;
                return that._views;
            }
            onViewAdded(viewAddedCallback) {
                this._onViewAdded = viewAddedCallback;
            }
        }
        Controls.ViewService = ViewService;
        class View {
            constructor() {
                this.isLoaded = false;
                this.width = View.defaultWidth;
            }
        }
        View.defaultWidth = 700;
        Controls.View = View;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
function highlightText(value, searchText) {
    if (value && searchText && value != searchText) {
        searchText = searchText.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        var textMatcher = new RegExp(searchText, "ig");
        return value.replace(textMatcher, function (match) {
            return "<span class=\"cofx-selected-match\">" + match + "</span>";
        });
    }
    else {
        return value;
    }
}
function urlEncode(value) {
    return encodeURIComponent(value).replace(/'/g, "%27");
}
function urlEncodeParameter(value) {
    if (value || value === false) {
        if (angular.isDate(value)) {
            return "datetime(" + kendo.toString(value, "yyyy-MM-ddTHH:mm:ssZ") + ")";
        }
        else {
            return value.toString();
        }
    }
    else {
        return "";
    }
}
function urlDecode(value) {
    if (value.indexOf("datetime(") == 0) {
        value = value.slice(9, value.length - 1);
        return kendo.parseDate(value, "yyyy-MM-ddTHH:mm:ssZ");
    }
    else {
        return value;
    }
}
function getNonPrefixedName(name) {
    return name.replace(/^SYS_/, '').replace(/^APP_/, '').replace(/^USR_/, '');
}
var CockpitFramework;
(function (CockpitFramework) {
    class Guid {
    }
    Guid.empty = "00000000-0000-0000-0000-000000000000";
    CockpitFramework.Guid = Guid;
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />

/// <reference path="../../../typings/tsd.d.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var UI;
    (function (UI) {
        var Data;
        (function (Data) {
            class GroupManager {
                addGroup(column, aggregates, formatPattern, autoExpand = false) {
                    var that = this;
                    var groups = that.groupState.filter(g => g.field == column.field);
                    var group = {
                        title: column.title,
                        field: column.field,
                        dir: "asc",
                        autoExpand: autoExpand,
                        aggregates: aggregates,
                        dataType: column.tcDataType,
                        formatPattern: formatPattern ? formatPattern : column.cofxFormatPattern,
                        showWhenGrouped: formatPattern ? true : false
                    };
                    that.groupState.push(group);
                    that.groupsChanged(that.groupState.length - 1);
                }
                moveGroupDown(group) {
                    var that = this;
                    var groupIndex = that.groupState.indexOf(group);
                    if (groupIndex >= 0 && groupIndex < that.groupState.length - 1) {
                        that.groupState.splice(groupIndex, 1);
                        that.groupState.splice(groupIndex + 1, 0, group);
                        that.groupsChanged();
                    }
                }
                moveGroupUp(group) {
                    var that = this;
                    var groupIndex = that.groupState.indexOf(group);
                    if (groupIndex > 0 && groupIndex <= that.groupState.length - 1) {
                        that.groupState.splice(groupIndex, 1);
                        that.groupState.splice(groupIndex - 1, 0, group);
                        that.groupsChanged();
                    }
                }
                removeGroup(group) {
                    var that = this;
                    var groupIndex = that.groupState.indexOf(group);
                    if (groupIndex >= 0) {
                        that.groupState.splice(groupIndex, 1);
                        that.groupsChanged();
                    }
                }
            }
            Data.GroupManager = GroupManager;
        })(Data = UI.Data || (UI.Data = {}));
    })(UI = CockpitFramework.UI || (CockpitFramework.UI = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../HelperFunctions/DataContextHelperFunctions.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        class ActionManager {
            initialize(view, $scope, $log, $translate, $q, $timeout, cofxBusyIndicatorService, cofxViewService, listName, getListParameters, editProperty) {
                var that = this;
                that.$scope = $scope;
                that.$log = $log;
                that.$translate = $translate;
                that.$q = $q;
                that.$timeout = $timeout;
                that.cofxBusyIndicatorService = cofxBusyIndicatorService;
                that.cofxViewService = cofxViewService;
                that.listName = listName;
                that.getListParameters = getListParameters;
                that.editProperty = editProperty;
                that.view = view;
                that.dataContextService = CockpitFramework.Application.ApplicationService.getInjector().get("dataContextService");
            }
            executeActionByName(actionName, modelEntityName, items, editProperty = null, calculatedProperties = null, ignoreItemsErrors = false, skipConfirm = false, defaultValuesParameterForm = {}, handleMessages) {
                var that = this;
                var defer = that.$q.defer();
                that.cofxBusyIndicatorService.addJob(that.$scope, "loadAction", "Load action");
                that.dataContextService.getAction(actionName).toPromise().then((response) => {
                    that.cofxBusyIndicatorService.removeJob(that.$scope, "loadAction");
                    that.executeAction(response, modelEntityName, items, editProperty, calculatedProperties, ignoreItemsErrors, skipConfirm, defaultValuesParameterForm, handleMessages).then((error) => {
                        defer.resolve(error);
                    }).catch(() => {
                        defer.reject();
                    });
                }, (error) => {
                    that.cofxBusyIndicatorService.removeJob(that.$scope, "loadAction");
                    that.$log.error("Could not load action: " + JSON.stringify(error));
                    defer.reject();
                });
                return defer.promise;
            }
            executeAction(action, modelEntityName, items, editProperty = null, calculatedProperties = null, ignoreItemsErrors = false, skipConfirm = false, defaultValuesParameterForm = {}, handleMessages) {
                var that = this;
                var defer = that.$q.defer();
                if (items.length < action.minimumInputSetSize) {
                    return;
                }
                // check errors
                if (!ignoreItemsErrors && items.filter(item => item.errors && item.errors.length > 0).length > 0) {
                    var keys = ["cofx.actions.invalidItemsTitle", "cofx.actions.invalidItemsDescription"];
                    that.$translate(keys).then((translations) => {
                        var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                        messageService.alert("actionerror", translations["cofx.actions.invalidItemsTitle"], translations["cofx.actions.invalidItemsDescription"]);
                    });
                    return;
                }
                var keys = [
                    "cofx.controls.executeAction.executeAction",
                    "cofx.controls.executeAction.cancel",
                    "cofx.controls.executeAction.confirmExecuteActionTitle",
                    "cofx.controls.executeAction.confirmExecuteActionDescription",
                ];
                that.$translate(keys, { actionName: action.friendlyName }).then(translations => {
                    if (action.parameterEntity || action.parameterForm) {
                        var url = null;
                        if (action.parameterForm) {
                            url = "/forms/" + action.parameterForm;
                        }
                        else {
                            url = "/forms/entity/" + action.parameterEntity;
                        }
                        var formActions = [];
                        formActions.push({
                            friendlyName: translations["cofx.controls.executeAction.executeAction"],
                            execute: (formScope) => {
                                that.executeActionForForm(formScope, action, modelEntityName, items, editProperty, calculatedProperties, handleMessages).then(() => defer.resolve()).catch(() => defer.reject());
                            },
                            isPrimary: true,
                            hotkey: "ctrl+enter",
                            hotkeyDescription: translations["cofx.controls.executeAction.executeAction"],
                            hotkeyFunction: (event, hotkeys, formScope) => {
                                that.executeActionForForm(formScope, action, modelEntityName, items, editProperty, calculatedProperties, handleMessages).then(() => defer.resolve()).catch(() => defer.reject());
                            },
                            isDefault: false,
                            isCancel: false,
                            allowForReadOnly: false
                        });
                        formActions.push({
                            friendlyName: translations["cofx.controls.executeAction.cancel"],
                            execute: (formScope) => { that.closeForm(formScope); defer.reject(); },
                            isCancel: true,
                            allowForReadOnly: true,
                            hotkey: "esc",
                            hotkeyDescription: translations["cofx.controls.executeAction.cancel"],
                            hotkeyFunction: (event, hotkeys, formScope) => { that.closeForm(formScope); defer.reject(); },
                            isDefault: false
                        });
                        var view = new CockpitFramework.Controls.View();
                        view.title = action.friendlyName;
                        view.url = url;
                        view.scopeParameters = {
                            entityUuid: null, formActions: formActions, defaultValuesFromFilter: defaultValuesParameterForm };
                        view.onLoaded = () => { };
                        view.onClosed = (eventArgs) => {
                            if (that.view) {
                                that.view.setFocus();
                            }
                        };
                        that.cofxViewService.addView(view);
                    }
                    else {
                        if (action.executeWithoutPrompt || skipConfirm) {
                            that.executeActionInternal(action, modelEntityName, items, null, null, null, editProperty, calculatedProperties, handleMessages).then((error) => defer.resolve(error)).catch(() => defer.reject());
                        }
                        else {
                            var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                            messageService.confirm("confirmexecuteaction", translations["cofx.controls.executeAction.confirmExecuteActionTitle"], translations["cofx.controls.executeAction.confirmExecuteActionDescription"])
                                .then((result) => {
                                if (result == CockpitFramework.Controls.MessageResult.Confirm) {
                                    that.executeActionInternal(action, modelEntityName, items, null, null, null, editProperty, calculatedProperties, handleMessages).then((error) => defer.resolve(error)).catch(() => defer.reject());
                                }
                            });
                        }
                    }
                });
                return defer.promise;
            }
            executeActionForForm(formScope, action, modelEntityName, items, editProperty = null, calculatedProperties = null, handleMessages) {
                var that = this;
                var defer = that.$q.defer();
                var activeElement = document.activeElement;
                if (activeElement && typeof activeElement.blur == "function") {
                    activeElement.blur();
                    activeElement.focus();
                }
                that.$timeout(() => {
                    that.cofxBusyIndicatorService.addJob(that.$scope, "executeAction", "Execute action " + action.friendlyName);
                    formScope.validate([]).then((isValid) => {
                        if (isValid) {
                            var parameter = formScope.dataItems[0].entity;
                            formScope.calculatedProperties.forEach(property => {
                                delete parameter[property];
                            });
                            that.executeActionInternal(action, modelEntityName, items, formScope.modelEntity, action.parameterForm, parameter, editProperty, calculatedProperties, handleMessages).then((error) => {
                                if (!error) {
                                    that.closeForm(formScope);
                                    defer.resolve();
                                }
                                else {
                                    defer.reject();
                                }
                            });
                        }
                        else {
                            defer.reject();
                        }
                    }).finally(() => that.cofxBusyIndicatorService.removeJob(that.$scope, "executeAction"));
                });
                return defer.promise;
            }
            executeActionInternal(action, modelEntityName, items, parameterModelEntityName, parameterFormName, parameterValue, editProperty = null, calculatedProperties = null, handleMessages) {
                var that = this;
                that.cofxBusyIndicatorService.addJob(that.$scope, "executeAction", "Execute action " + action.friendlyName);
                var deferred = that.$q.defer();
                var itemsToSend = items.map(item => item.entity ? item.entity : item);
                if (itemsToSend && itemsToSend.length > 0 && angular.isObject(itemsToSend[0])) {
                    // build items to send
                    if (editProperty && action.reselectEntityObject !== false) {
                        itemsToSend = items.map(i => i.entity ? i.entity[editProperty] : i[editProperty]);
                    }
                    else {
                        var propertiesToRemove = calculatedProperties;
                        if (!propertiesToRemove) {
                            propertiesToRemove = [];
                        }
                        propertiesToRemove.push("isGroup", "level", "uid", "errorMessages", "ObjectUuid");
                        itemsToSend = itemsToSend.map(item => removePropertiesFromObject(item, propertiesToRemove));
                    }
                }
                if (that.view) {
                    that.view.removeFocus();
                }
                that.dataContextService.executeAction(action.name, modelEntityName, that.listName, !that.getListParameters ? null : that.getListParameters(), itemsToSend, parameterModelEntityName, parameterFormName, removePropertiesFromObject(parameterValue, ["odata.metadata"])).toPromise()
                    .then((response) => {
                    var succeeded = true;
                    var error = null;
                    if (response.exceptionMessage) {
                        // TODO: check if ValidationException was thrown, otherwise
                        succeeded = false;
                        error = response.exceptionMessage;
                        if (!handleMessages) {
                            var keys = ["cofx.actions.errorTitle"];
                            that.$translate(keys).then((translations) => {
                                var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                                messageService.alert("actionresult", response.exceptionTitle || translations["cofx.actions.errorTitle"], response.exceptionMessage);
                            });
                        }
                    }
                    else if (response.successMessage) {
                        if (!handleMessages) {
                            var keys = ["cofx.actions.resultTitle"];
                            that.$translate(keys).then((translations) => {
                                var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                                messageService.alert("actionresult", response.successTitle || translations["cofx.actions.resultTitle"], response.successMessage);
                            });
                        }
                    }
                    if (handleMessages) {
                        handleMessages({ exceptionMessage: error, successMessage: response.successMessage });
                    }
                    if (succeeded && that.actionExecuted) {
                        that.actionExecuted(response);
                    }
                    if (succeeded && response.actionResult) {
                        if (response.actionResult.resultType == "TimeCockpit.Data.DataModel.Actions.FileActionResult") {
                            var keys = ["cofx.actions.downloadTitle", "cofx.actions.downloadContent"];
                            that.$translate(keys).then((translations) => {
                                var url = response.actionResult.fileDownloadName.replace(/%2F/gi, '/');
                                let fileparts = url.split('?')[0].split('/');
                                const filename = fileparts[fileparts.length - 1];
                                var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                                messageService.alert("actionresultfiledownload", translations["cofx.actions.downloadTitle"], translations["cofx.actions.downloadContent"].replace("@@url@@", url).replace("@@filename@@", filename));
                            });
                        }
                        else if (response.actionResult.resultType == "TimeCockpit.Data.DataModel.Actions.UriActionResult") {
                            // show download dialog
                            if (response.actionResult.displayUri) {
                                var keys = ["cofx.actions.openUriActionResultTitleContent", "cofx.actions.openUriActionResultTitle"];
                                that.$translate(keys).then((translations) => {
                                    var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                                    messageService.alert("actionresultfiledownload", translations["cofx.actions.openUriActionResultTitle"], translations["cofx.actions.openUriActionResultTitleContent"].replace("@@url@@", response.actionResult.uri).replace("@@filename@@", response.actionResult.fileName));
                                });
                            }
                            // open file
                            if (response.actionResult.open) {
                                window.open(response.actionResult.uri, "_blank");
                            }
                        }
                    }
                    that.cofxBusyIndicatorService.removeJob(that.$scope, "executeAction");
                    deferred.resolve(error);
                }, (error) => {
                    var keys = ["cofx.actions.errorTitle", "cofx.actions.errorDescription"];
                    if (!error.status || error.status !== 500) {
                        // only show error when not handled by http.service.ts
                        var currentError = error;
                        that.$translate(keys).then((translations) => {
                            var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                            messageService.error("couldnotexecuteaction", translations["cofx.actions.errorTitle"], translations["cofx.actions.errorDescription"], { error: JSON.stringify(currentError) });
                        });
                    }
                    that.cofxBusyIndicatorService.removeJob(that.$scope, "executeAction");
                    //that.$log.error("Could not execute action: " + JSON.stringify(error));
                    var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                    appInsightsService.trackException(new Error("Could not execute action " + action.name + ", error: " + JSON.stringify(error)));
                    deferred.resolve(JSON.stringify(error));
                });
                return deferred.promise;
            }
            closeForm(scope) {
                var that = this;
                var activeElement = document.activeElement;
                if (activeElement && typeof activeElement.blur == "function") {
                    activeElement.blur();
                }
                scope.$root.$broadcast("viewClosed", { hasChanges: scope.hasChanges });
            }
        }
        Controls.ActionManager = ActionManager;
        class Action {
            constructor() {
                this.executeWithoutPrompt = false;
            }
        }
        Controls.Action = Action;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
"use strict";
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        /**
        * Replacement for ng-include in CoFX projects.
        * @class
        */
        class IncludeList {
            /**
            * Creates a new Include directive.
            */
            static Create($templateCache, $timeout, $compile, $controller, $q, cofxHttp) {
                var include = new IncludeList();
                include.restrict = "EA";
                include.template = "<div></div>";
                include.cofxHttp = cofxHttp;
                include.$templateCache = $templateCache;
                include.$timeout = $timeout;
                include.$compile = $compile;
                include.$controller = $controller;
                include.$q = $q;
                include.scope = {
                    src: "=",
                    filterProperty: "=?",
                    filterValue: "=?",
                    filterCondition: "=?",
                    filterParameters: "=?",
                    formDefaultProperty: "=?",
                    formDefaultValue: "=?",
                    title: "=?",
                    ignoreFilterDefaultValues: "=?",
                    autoLoad: "=?",
                    hideFilterArea: "=?",
                    showToolbar: "=?",
                    change: "=?",
                    select: "=?",
                    actionExecuted: "=?"
                };
                // Initialize component
                include.link = function (scope, element, attrs) {
                    var backreferenceTab = element.parents("div.cofx-form-backreference-tab");
                    if (backreferenceTab.length > 0 && scope.$parent.backreferenceTabLists) {
                        scope.$parent.backreferenceTabLists.push(scope);
                    }
                    var backreferenceCell = element.parents("div.cofx-include-list-inner-container");
                    if (backreferenceCell.length > 0 && scope.$parent.backreferenceCellLists) {
                        scope.$parent.backreferenceCellLists.push(scope);
                    }
                    scope.loadData = (forceReload) => include.loadData(scope, element, forceReload);
                    scope.dataLoaded = false;
                    scope.initialized = false;
                    if (scope.autoLoad) {
                        include.$timeout(() => {
                            scope.loadData(true);
                        });
                    }
                };
                return include;
            }
            loadData(scope, element, forceReload) {
                var that = this;
                var defer = that.$q.defer();
                if (!scope.dataLoaded || forceReload) {
                    var src = scope.src;
                    return that.cofxHttp.get(src, { cache: that.$templateCache, handlePermissions: false }).then((response) => {
                        var title = scope.title;
                        var scopeElement = angular.element(element.children("div")).html(response.data);
                        var newScope = scope.$new(false);
                        var controller = that.$controller("ListController", { $scope: newScope });
                        newScope.title = title;
                        scope.list = newScope;
                        if (scope.filterProperty || scope.filterCondition) {
                            var filters = [];
                            var formDefaultValues = [];
                            if (scope.filterProperty) {
                                filters.push({ filterOperator: "=", filterPath: scope.filterProperty, filterValue: scope.filterValue });
                                var backReferenceParameterName = "BackReferenceList_" + scope.filterProperty + "Uuid";
                                newScope.externalParameters.push({ filterParameterName: backReferenceParameterName, filterValue: scope.filterValue });
                            }
                            if (scope.filterProperty && scope.formDefaultValue) {
                                formDefaultValues.push({ path: scope.formDefaultProperty, value: scope.formDefaultValue });
                            }
                            if (scope.filterCondition) {
                                newScope.externalCondition = scope.filterCondition;
                            }
                            newScope.ignoreFilterDefaultValues = scope.ignoreFilterDefaultValues;
                            newScope.externalFilters = filters;
                            newScope.formDefaultValues = formDefaultValues;
                            newScope.hideFilterArea = scope.hideFilterArea;
                            newScope.showToolbar = (scope.showToolbar === false ? false : true);
                        }
                        if (scope.filterParameters) {
                            Object.getOwnPropertyNames(scope.filterParameters).forEach(property => {
                                newScope.externalFilterDefaultValues.push({ filterParameterName: property, filterValue: scope.filterParameters[property] });
                            });
                        }
                        newScope.change = scope.change;
                        newScope.select = scope.select;
                        scopeElement.children().data("$ngControllerController", controller);
                        var compiledView = that.$compile(scopeElement)(newScope);
                        if (scope.actionExecuted) {
                            if (newScope.actionManager.actionExecuted) {
                                const action = newScope.actionManager.actionExecuted;
                                newScope.actionManager.actionExecuted = (result) => {
                                    action(result);
                                    scope.actionExecuted(result);
                                };
                            }
                            else {
                                newScope.actionManager.actionExecuted = (result) => {
                                    scope.actionExecuted(result);
                                };
                            }
                        }
                        scope.dataLoaded = true;
                        defer.resolve();
                    }).catch((reason) => {
                        if (reason.status == 403) {
                            return that.cofxHttp.get("/error/nopermission", { cache: that.$templateCache }).then((response) => {
                                var scopeElement = angular.element(element.children("div")).html(response.data);
                                var newScope = scope.$new(false);
                                var error = null;
                                if (angular.isString(reason.data)) {
                                    error = JSON.parse(reason.data);
                                }
                                else {
                                    error = reason.data;
                                }
                                var controller = that.$controller("ErrorController", { $scope: newScope });
                                if (error && error.message) {
                                    newScope.error.message = error.message;
                                }
                                scopeElement.children().data("$ngControllerController", controller);
                                var compiledView = that.$compile(scopeElement)(newScope);
                                scope.dataLoaded = true;
                                defer.resolve();
                            });
                        }
                    });
                }
                else {
                    defer.resolve();
                }
                return defer.promise;
            }
        }
        Controls.IncludeList = IncludeList;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="ActionManager.ts" />
/// <reference path="IncludeList.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        /**
        * Helper to create the scope declaration for the Form.
        */
        class FormScope {
            static createScopeDeclaration() {
                var scope = {
                    entityUuid: "@",
                    clone: "=?",
                    query: "@",
                    modelEntity: "@",
                    filterEntityListName: "@",
                    properties: "=",
                    validationTriggerProperties: "=",
                    relations: "=",
                    calculatedProperties: "=",
                    filterEntity: "=?",
                    defaultValues: "=",
                    defaultValuesFromFilter: "=?",
                    valuesForUpdate: "=?",
                    formActions: "=?",
                    saveAction: "@",
                    readOnlyExpression: "@",
                    actions: "=",
                    autoRefreshOnDataUpdates: "=",
                    includeClause: "@",
                    control: "=",
                    loadStartTime: "=?",
                    handleMessages: "&"
                };
                return scope;
            }
        }
        Controls.FormScope = FormScope;
        class FormError {
            constructor(message, isClientError, participatingMembers = []) {
                this.message = message;
                this.isClientError = isClientError;
                this.participatingMembers = participatingMembers;
            }
        }
        Controls.FormError = FormError;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="FormScope.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        class ValidationManager {
            initialize(view, $scope, $log, $translate, $q, cofxBusyIndicatorService, cofxViewService, validated) {
                var that = this;
                that.$scope = $scope;
                that.$log = $log;
                that.$translate = $translate;
                that.$q = $q;
                that.cofxBusyIndicatorService = cofxBusyIndicatorService;
                that.cofxViewService = cofxViewService;
                that.validated = validated;
            }
            destroy() {
                if (this.unregisterWatchFunctions) {
                    this.unregisterWatchFunctions.forEach(unregisterWatchFunction => {
                        unregisterWatchFunction();
                    });
                    this.unregisterWatchFunctions = [];
                }
            }
            setParameters(parameters) {
                this.parameters = parameters;
            }
            createItem(entity, uuid = null, isValidated = false) {
                var item = {
                    entity: entity,
                    uuid: uuid,
                    validationCount: 0,
                    isReadOnly: isValidated ? false : true,
                    readOnlyStateSet: isValidated ? true : false,
                    expressions: entity.expressions ? entity.expressions : this.$scope.expressions,
                    errors: isValidated ? entity.errorMessages.map((e) => new Controls.FormError(e.errorMessage, false)) : [],
                    hasChangesSinceLastValidation: false,
                    changedPropertyNamesSinceLastSave: [],
                    missingReadPermissions: [],
                    missingWritePermissions: [],
                    entityMissingWritePermissions: [],
                    manyToManyChangedValues: new Map()
                };
                // TODO: check if is new
                this.updatePermissions(item, entity, false);
                return item;
            }
            updatePermissions(item, response, isNew) {
                var missingReadPermissions = [];
                var missingWritePermissions = [];
                var entityMissingWritePermissions = [];
                if (response.permissionErrorMessages && response.permissionErrorMessages.fields) {
                    for (var field in response.permissionErrorMessages.fields) {
                        if (response.permissionErrorMessages.fields.hasOwnProperty(field)) {
                            if (response.permissionErrorMessages.fields[field].read) {
                                missingReadPermissions.push(field);
                            }
                            if (response.permissionErrorMessages.fields[field].write) {
                                missingWritePermissions.push(field);
                            }
                        }
                    }
                }
                if (response.permissionErrorMessages && response.permissionErrorMessages.entity) {
                    if (response.permissionErrorMessages.entity.write) {
                        for (var index in response.permissionErrorMessages.entity.write) {
                            entityMissingWritePermissions.push(response.permissionErrorMessages.entity.write[index]);
                        }
                    }
                    if (response.permissionErrorMessages.entity.insert && isNew) {
                        for (var index in response.permissionErrorMessages.entity.insert) {
                            entityMissingWritePermissions.push(response.permissionErrorMessages.entity.insert[index]);
                        }
                    }
                    if (response.permissionErrorMessages.entity.update && !isNew) {
                        for (var index in response.permissionErrorMessages.entity.update) {
                            entityMissingWritePermissions.push(response.permissionErrorMessages.entity.update[index]);
                        }
                    }
                }
                item.missingReadPermissions = missingReadPermissions;
                item.missingWritePermissions = missingWritePermissions;
                item.entityMissingWritePermissions = entityMissingWritePermissions;
            }
            updateWatchExpression(dataItemsToWatch = null) {
                if (this.unregisterWatchFunction) {
                    this.unregisterWatchFunction();
                }
                if (this.unregisterWatchFunctions) {
                    this.unregisterWatchFunctions.forEach(unregisterWatchFunction => {
                        unregisterWatchFunction();
                    });
                }
                this.unregisterWatchFunctions = [];
                if (dataItemsToWatch == null) {
                    dataItemsToWatch = this.$scope.dataItems;
                }
                dataItemsToWatch.forEach((item, index) => {
                    var watchIndex = index;
                    if (dataItemsToWatch) {
                        watchIndex = this.$scope.dataItems.indexOf(item);
                    }
                    if (watchIndex >= 0) {
                        this.unregisterWatchFunctions.push(this.$scope.$watchCollection("dataItems[" + watchIndex + "].entity", (newValue, oldValue, scope) => {
                            if (newValue && oldValue && oldValue != newValue) {
                                var oldObject = oldValue;
                                var newObject = newValue;
                                var item = null;
                                var filteredItems = scope.dataItems.filter(item => item.entity["uid"] == newValue["uid"]);
                                if (filteredItems.length > 0) {
                                    item = filteredItems[0];
                                    if (!item.changedPropertyNamesSinceLastSave) {
                                        item.changedPropertyNamesSinceLastSave = [];
                                    }
                                }
                                if (item != null) {
                                    var changedProperties = [];
                                    for (var property in item.entity) {
                                        if (!oldObject ||
                                            (item.entity.hasOwnProperty(property)
                                                && (!scope.calculatedProperties || scope.calculatedProperties.indexOf(property) < 0)
                                                && (!angular.isObject(newObject[property]) || angular.isDate(newObject[property])))) {
                                            var hasChanged = false;
                                            if (angular.isDate(newObject[property])) {
                                                var oldTime = oldObject[property] ? oldObject[property].getTime() : 0;
                                                var newTime = newObject[property] ? newObject[property].getTime() : 0;
                                                hasChanged = newTime != oldTime;
                                            }
                                            else {
                                                hasChanged = newObject[property] != oldObject[property];
                                            }
                                            if (hasChanged) {
                                                item.hasChangesSinceLastValidation = true;
                                                changedProperties.push(property);
                                                if (item.changedPropertyNamesSinceLastSave.indexOf(property) < 0) {
                                                    // property cannot be pushed to existing array changedPropertyNamesSinceLastSave because sometimes an error occurs on push
                                                    var changedPropertyNames = [];
                                                    item.changedPropertyNamesSinceLastSave.forEach(item => changedPropertyNames.push(item));
                                                    changedPropertyNames.push(property);
                                                    item.changedPropertyNamesSinceLastSave = changedPropertyNames;
                                                }
                                            }
                                        }
                                    }
                                    // check if validationTriggerProperties are affected
                                    if (changedProperties.length > 0) {
                                        var validate = false;
                                        ////console.log("dataItems changed (" + JSON.stringify(changedProperties) + "): " + moment().format("HH:mm:ss.SS"));
                                        changedProperties.forEach((p, index) => validate = scope.validationTriggerProperties.indexOf(p) >= 0 || validate);
                                        if (validate) {
                                            this.validate(scope, item, changedProperties);
                                        }
                                    }
                                }
                            }
                        }));
                    }
                });
            }
            validate(scope, item, changedProperties, forceValidate = false) {
                var that = this;
                ////this.$log.info("start validate: " + moment().format("HH:mm:ss.SS"));
                //console.log('validate');
                if (item.lastValidationPromise && !item.hasChangesSinceLastValidation && !forceValidate) {
                    return item.lastValidationPromise;
                }
                // TODO: do not validate on server when client is not valid?
                var clientValid = that.validateClient(scope, true);
                var defer = that.$q.defer();
                item.lastValidationPromise = defer.promise;
                item.hasChangesSinceLastValidation = false;
                if (item && !item.isGroup) {
                    scope.isValidating = true;
                    if (scope.modelEntity || scope.filterEntityListName) {
                        var entityToValidate = angular.copy(item.entity);
                        if (!item.readOnlyStateSet) {
                            that.cofxBusyIndicatorService.addJob(scope, "validateentityobject", "Validate");
                        }
                        else {
                            that.cofxBusyIndicatorService.addJob(scope, "validateentityobject", "Validate", { isBlocking: false });
                        }
                        item.validationCount++;
                        var currentValidationCount = item.validationCount;
                        var currentItem = item;
                        var listName = null;
                        if (scope.listName) {
                            listName = scope.listName;
                        }
                        var changedPropertyNamesSinceLastSave = [];
                        item.changedPropertyNamesSinceLastSave.forEach(item => {
                            if (!scope.ignoreUpdatedPropertiesFromValidationManager || scope.ignoreUpdatedPropertiesFromValidationManager.indexOf(item) < 0) {
                                changedPropertyNamesSinceLastSave.push(item);
                            }
                        });
                        var dataContextService = CockpitFramework.Application.ApplicationService.getInjector().get("dataContextService");
                        dataContextService.validateObject(listName ? null : scope.modelEntity, scope.filterEntityListName, entityToValidate, changedProperties, changedPropertyNamesSinceLastSave, scope.expressions, scope.calculatedProperties.concat("uid").concat("errorMessages").concat("appliedFilterParameters"), null, listName, this.parameters).toPromise().then((response) => {
                            if (item.validationCount == currentValidationCount) {
                                // set error message
                                var validationResponse = response;
                                currentItem.errors = validationResponse.errorMessages.map((e) => new Controls.FormError(e.errorMessage, false, e.participatingMembers));
                                // update values
                                that.updateValues(scope, currentItem, validationResponse.entityObject, entityToValidate, true, response.changedBecauseOfDefaultValueProperties);
                                // update expressions
                                for (var property in scope.expressions) {
                                    if (validationResponse.expressionResults.hasOwnProperty(property)) {
                                        if (validationResponse.expressionResults[property].error) {
                                            var title = "Error in Expression '" + property + "'";
                                            var message = "Expression: " + currentItem.expressions[property].expression + "<br/><br/>Error: " + validationResponse.expressionResults[property].error;
                                            var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                                            messageService.error("errorinexpression", title, message, currentItem.expressions);
                                        }
                                        else {
                                            if (currentItem.expressions[property].value != validationResponse.expressionResults[property].value) {
                                                currentItem.expressions[property].value = validationResponse.expressionResults[property].value;
                                            }
                                        }
                                    }
                                }
                                // update isReadOnly
                                if (!item.readOnlyStateSet) {
                                    if (currentItem.expressions["readOnlyExpression"]) {
                                        item.isReadOnly = currentItem.expressions["readOnlyExpression"].value;
                                    }
                                    else {
                                        item.isReadOnly = false;
                                    }
                                    item.readOnlyStateSet = true;
                                    that.setFocus(scope);
                                }
                                // update permissions
                                scope.validationManager.updatePermissions(item, validationResponse, scope.isNew);
                                if (scope.isFirstValidationRequest && item.entityMissingWritePermissions.length > 0 && !scope.isNew) {
                                    item.isReadOnly = true;
                                }
                                scope.isFirstValidationRequest = false;
                                ////this.$log.info("finished validate: " + moment().format("HH:mm:ss.SS"));
                                if (that.validated) {
                                    that.validated();
                                }
                            }
                        }, (error) => {
                            that.$log.error("Could not validate object: " + JSON.stringify(error));
                            var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                            appInsightsService.trackException(new Error("Could not validate object, error: " + JSON.stringify(error)));
                        })
                            .finally(() => {
                            that.validateClient(scope, false);
                            that.cofxBusyIndicatorService.removeJob(scope, "validateentityobject");
                            scope.isValidating = false;
                            defer.resolve(currentItem.errors.length == 0);
                        });
                    }
                    else {
                        that.$log.error("Server side validation not possible, either modelEntity or filterEntityListName must be set or required fields are not set.");
                        scope.isValidating = false;
                        defer.resolve(item.errors.length == 0);
                    }
                }
                else {
                    defer.resolve(true);
                }
                return defer.promise;
            }
            updateValues(scope, item, entityObject, originalEntityObject, ignorePropertyChanges = false, changedBecauseOfDefaultValueProperties = []) {
                var that = this;
                var hasWatchFunction = this.unregisterWatchFunction != null || this.unregisterWatchFunctions.length > 0;
                if (ignorePropertyChanges && hasWatchFunction) {
                    if (this.unregisterWatchFunction) {
                        this.unregisterWatchFunction();
                    }
                }
                var changedProperties = [];
                try {
                    //this.$scope.ignoreUpdatedPropertiesFromValidationManager = [];
                    // TODO: use row index
                    for (var property in item.entity) {
                        if (item.entity.hasOwnProperty(property) && entityObject.hasOwnProperty(property)
                            && (!entityObject.metadata.properties[property] || entityObject.metadata.properties[property].type != "Edm.Binary")) {
                            var entityValue = item.entity[property];
                            var entityObjectValue = entityObject[property];
                            var originalEntityObjectValue = originalEntityObject[property];
                            if (angular.isDate(entityValue)) {
                                entityValue = moment(entityValue).unix();
                            }
                            if (angular.isDate(entityObjectValue)) {
                                entityObjectValue = moment(entityObjectValue).unix();
                            }
                            if (angular.isDate(originalEntityObjectValue)) {
                                originalEntityObjectValue = moment(originalEntityObjectValue).unix();
                            }
                            if (entityValue != entityObjectValue && (!originalEntityObject || entityValue == originalEntityObjectValue)) {
                                item.entity[property] = entityObject[property];
                                changedProperties.push(property);
                                // property has to be sent in save as default values are not evaluated on patch
                                if (scope.calculatedProperties.indexOf(property) < 0 && item.changedPropertyNamesSinceLastSave.indexOf(property) < 0) {
                                    item.changedPropertyNamesSinceLastSave.push(property);
                                }
                                if (!this.$scope.ignoreUpdatedPropertiesFromValidationManager) {
                                    this.$scope.ignoreUpdatedPropertiesFromValidationManager = [];
                                }
                                if (ignorePropertyChanges && (!changedBecauseOfDefaultValueProperties || changedBecauseOfDefaultValueProperties.indexOf(property) < 0)) {
                                    if (this.$scope.ignoreUpdatedPropertiesFromValidationManager.indexOf(property) < 0) {
                                        this.$scope.ignoreUpdatedPropertiesFromValidationManager.push(property);
                                    }
                                }
                                else {
                                    const index = this.$scope.ignoreUpdatedPropertiesFromValidationManager.indexOf(property);
                                    if (index >= 0) {
                                        this.$scope.ignoreUpdatedPropertiesFromValidationManager.splice(index, 1);
                                    }
                                }
                            }
                        }
                    }
                    console.log('values updated, changedPropertyNamesSinceLastSave: ', item.changedPropertyNamesSinceLastSave, 'ignoreUpdatedPropertiesFromValidationManager', this.$scope.ignoreUpdatedPropertiesFromValidationManager, "changedBecauseOfDefaultValueProperties", changedBecauseOfDefaultValueProperties);
                }
                catch (e) {
                    console.warn("Could not update properties: " + JSON.stringify(e));
                }
                finally {
                    if (ignorePropertyChanges && hasWatchFunction) {
                        this.updateWatchExpression();
                    }
                    if (changedProperties.length > 0) {
                        this.validate(scope, item, changedProperties, true);
                    }
                }
            }
            validateClient(scope, clearErrors = true) {
                var that = this;
                if (!scope.validator) {
                    ////that.$log.info("no client side validator available");
                    return false;
                }
                if (scope.comboboxesToLoad == 0) {
                    var isValid = false;
                    if (clearErrors || !scope.dataItems[0].errors) {
                        scope.dataItems[0].errors = [];
                    }
                    else {
                        scope.dataItems[0].errors = scope.dataItems[0].errors.filter(e => !e.isClientError);
                    }
                    // AngularJS errors
                    if (scope.validator.validate()) {
                        isValid = (scope.dataItems[0].errors.length == 0);
                    }
                    else {
                        if (scope.dataItems[0].errors.length == 0) {
                            scope.dataItems[0].errors = scope.validator.errors().map((e) => new Controls.FormError(e, true));
                        }
                    }
                    // Angular errors - kendo-numerictextbox
                    [...scope.validator.element[0].querySelectorAll("kendo-numerictextbox.ng-invalid")].forEach((numericTextBox) => {
                        isValid = false;
                        if (!scope.dataItems[0].errors.some(e => e.message === numericTextBox.parentElement.getAttribute("data-required-msg"))) {
                            scope.dataItems[0].errors.push(new Controls.FormError(numericTextBox.parentElement.getAttribute("data-required-msg"), true));
                        }
                    });
                    // Angular errors - kendo-datepicker
                    [...scope.validator.element[0].querySelectorAll("kendo-datepicker.ng-invalid,kendo-timepicker.ng-invalid")].forEach((datePicker) => {
                        isValid = false;
                        let error = datePicker.getAttribute("data-error-msg");
                        if (!error) {
                            error = scope.dataItems[0].errors.push(new Controls.FormError(error, true));
                        }
                        if (!scope.dataItems[0].errors.some(e => e.message === error)) {
                            scope.dataItems[0].errors.push(new Controls.FormError(error, true));
                        }
                    });
                    return isValid;
                }
                else {
                    return scope.dataItems[0].errors.length == 0;
                }
            }
            setFocus(scope) {
                // TODO
                //if ($(scope.element).find($(document.activeElement)).length < 1) {
                //	FormHelperFunctions.setFocusedElement(scope.element);
                //}
            }
        }
        Controls.ValidationManager = ValidationManager;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../../typings/tsd.d.ts" />
/// <reference path="GroupManager.ts" />
/// <reference path="../../../TypeScript/Controls/ValidationManager.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var UI;
    (function (UI) {
        var Data;
        (function (Data) {
            (function (ListViewMode) {
                ListViewMode[ListViewMode["List"] = 0] = "List";
                ListViewMode[ListViewMode["Pdf"] = 1] = "Pdf";
                ListViewMode[ListViewMode["Excel"] = 2] = "Excel";
                ListViewMode[ListViewMode["Word"] = 3] = "Word";
            })(Data.ListViewMode || (Data.ListViewMode = {}));
            var ListViewMode = Data.ListViewMode;
            class ListView {
                constructor() {
                    this.loaded = false;
                    this.isActive = false;
                }
            }
            Data.ListView = ListView;
            class FilterFormParameter {
            }
            Data.FilterFormParameter = FilterFormParameter;
            class FilterParameter {
            }
            Data.FilterParameter = FilterParameter;
            class NamedParameter {
            }
            Data.NamedParameter = NamedParameter;
            class FormDefaultValue {
            }
            Data.FormDefaultValue = FormDefaultValue;
            class ListConfigurationProfile {
            }
            Data.ListConfigurationProfile = ListConfigurationProfile;
            class ListConfigurationProfileSettings {
            }
            Data.ListConfigurationProfileSettings = ListConfigurationProfileSettings;
        })(Data = UI.Data || (UI.Data = {}));
    })(UI = CockpitFramework.UI || (CockpitFramework.UI = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../../typings/tsd.d.ts" />
/// <reference path="../../../TypeScript/Controls/ViewService.ts" />
/// <reference path="../../../TypeScript/HelperFunctions/StringHelperFunctions.ts" />
/// <reference path="../../../TypeScript/HelperFunctions/DataContextHelperFunctions.ts" />
/// <reference path="../../../TypeScript/HelperFunctions/FormHelperFunctions.ts" />
/// <reference path="../../../TypeScript/Navigation/IView.ts" />
/// <reference path="../../../TypeScript/Application/ApplicationService.ts" />
/// <reference path="ListControllerScope.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var CockpitFramework;
(function (CockpitFramework) {
    var UI;
    (function (UI) {
        var Data;
        (function (Data) {
            class ListController {
                constructor($scope, $rootScope, $q, $timeout, $templateCache, $compile, $location, $window, $log, $translate, cofxBusyIndicatorService, cofxArrayService, cofxViewService, cofxEditEntityService, hotkeys) {
                    this.$scope = $scope;
                    this.$rootScope = $rootScope;
                    this.$q = $q;
                    this.$timeout = $timeout;
                    this.$templateCache = $templateCache;
                    this.$compile = $compile;
                    this.$location = $location;
                    this.$window = $window;
                    this.$log = $log;
                    this.$translate = $translate;
                    this.cofxBusyIndicatorService = cofxBusyIndicatorService;
                    this.cofxArrayService = cofxArrayService;
                    this.cofxViewService = cofxViewService;
                    this.cofxEditEntityService = cofxEditEntityService;
                    this.hotkeys = hotkeys;
                    this.expandedItems = [];
                    this.collapsedItems = [];
                    this.columnsResized = false;
                    this.columnResizeInProgress = false;
                    this.numberOfUnloadedImages = 0;
                    this.currentPage = null;
                    var that = this;
                    var navigationService = CockpitFramework.Application.ApplicationService.getInjector().get("navigationService");
                    that.hotkeysService = CockpitFramework.Application.ApplicationService.getInjector().get("hotkeysService");
                    that.httpService = CockpitFramework.Application.ApplicationService.getInjector().get("httpService");
                    that.dataContextService = CockpitFramework.Application.ApplicationService.getInjector().get("dataContextService");
                    that.$scope.dataSourceInitialized = false;
                    that.$scope.configurationProfilesInitialized = false;
                    that.$scope.loadAllRowsFlag = false;
                    that.$scope.allItemsLoaded = true;
                    that.$scope.filterFormLoaded = false;
                    that.$scope.itemsLoaded = false;
                    that.$scope.selectedItems = [];
                    that.$scope.viewMode = Data.ListViewMode.List;
                    that.$scope.registeredHotkeys = [];
                    that.$scope.isTouchDevice = "ontouchstart" in document.documentElement;
                    that.$scope.hideFilterArea = false;
                    that.$scope.showToolbar = true;
                    that.$scope.isLoading = false;
                    that.$scope.destroyed = false;
                    that.$scope.refreshTime = null;
                    that.$scope.displayFooterAggregatesArray = [];
                    that.$scope.rowErrorMessage = kendo.template("<ul class=\"cofx-form-error-summary-tooltip\"><li ng-repeat=\"error in dataItem.errors\">{{error.message}}</li></ul>");
                    that.$scope.filterForm = {};
                    that.$scope.externalParameters = [];
                    that.$scope.externalFilterDefaultValues = [];
                    that.$scope.applyFilter = () => that.applyFilter(true);
                    that.$scope.editEntity = (uuid) => that.editEntity(uuid);
                    that.$scope.editSelectedEntity = () => that.editSelectedEntity();
                    that.$scope.copySelectedEntity = (uuid) => that.copySelectedEntity();
                    that.$scope.addObject = () => that.addObject();
                    that.$scope.deleteObjects = () => that.deleteObjects();
                    that.$scope.openForm = (url, formName, editModelEntityName, editModelEntityFriendlyName, editFormExpression, id, useFilterDefaultValues, defaultValues) => that.openForm(url, formName, editModelEntityName, editModelEntityFriendlyName, editFormExpression, id, false, useFilterDefaultValues, defaultValues);
                    that.$scope.navigate = ($event, url, target = null) => navigationService.navigate($event, url, target);
                    that.$scope.loadAllRows = () => that.loadAllRows();
                    that.$scope.collapseGroup = (level) => that.updateExpandLevel(level);
                    that.$scope.collapseAllGroups = () => that.updateExpandLevel(0);
                    that.$scope.expandRow = (item) => that.expandRow(item);
                    that.$scope.collapseRow = (item) => that.collapseRow(item);
                    that.$scope.toggleRow = (item) => that.toggleRow(item);
                    that.$scope.canAdd = () => that.canAdd();
                    that.$scope.canEdit = () => that.canEdit();
                    that.$scope.canDelete = () => that.canDelete();
                    that.$scope.canCopy = () => that.canCopy();
                    //that.$scope.toggleFilter = () => that.toggleFilter();
                    that.$scope.getFilterParameters = () => { return that.getFilterParameters(); };
                    that.$scope.columnResize = (e) => that.columnResize(e);
                    that.$scope.columnMenuInit = (e) => that.columnMenuInit(e);
                    that.$scope.showHtml = () => that.showHtml();
                    that.$scope.showPdf = (view, inline) => that.showPdf(view, inline);
                    that.$scope.showExcel = (view) => that.showExcel(view);
                    that.$scope.showWord = (view) => that.showWord(view);
                    that.$scope.fastExcelExport = (format) => that.fastExcelExport(format);
                    that.$scope.groupRowOperation = (e) => that.groupRowOperation(e);
                    that.$scope.showFullTextSearch = () => that.showFullTextSearch();
                    that.$scope.filterToggled = (isExpanded) => that.filterToggled(isExpanded);
                    that.$scope.toggleColumnVisibility = (column, event, toggled) => {
                        if (toggled) {
                            column.hidden = !column.hidden;
                        }
                        that.toggleColumnVisibility(column);
                    };
                    that.$scope.showRawReport = that.$location.search().raw && that.$location.search().raw.toLowerCase() == "true";
                    that.$scope.resizeColumns = () => that.resizeColumns();
                    that.$scope.removeFocus = () => that.removeFocus();
                    that.$scope.setFocus = () => that.setFocus();
                    that.$scope.getChangedItems = () => that.getChangedItems();
                    that.$scope.setGroupRowOperationTarget = (event) => {
                        var that = this;
                        var currentTarget = event.target.parentElement.parentElement.parentElement;
                        var dataItem = that.$scope.grid.dataItem(currentTarget);
                        if (dataItem && dataItem.isGroup) {
                            var contextMenu = $(".cofx-grid-group-context-menu").data("kendoContextMenu");
                            contextMenu.open(event.pageX, event.pageY);
                            that.$scope.groupOperationTarget = currentTarget;
                            that.$scope.$root.groupOperationScope = that.$scope;
                        }
                    };
                    that.$scope.hasMissingReadPermission = (dataItem, property) => dataItem && dataItem.missingReadPermissions && dataItem.missingReadPermissions.indexOf(property) >= 0;
                    that.$scope.hasMissingWritePermission = (dataItem, property) => {
                        return dataItem && dataItem.missingWritePermissions && dataItem.missingWritePermissions.indexOf(property) >= 0;
                    };
                    that.$scope.entityHasMissingWritePermission = (dataItem) => dataItem && dataItem.entityMissingWritePermissions && dataItem.entityMissingWritePermissions.length > 0;
                    that.$scope.hasConfigurationProfileChanges = false;
                    var $injector = CockpitFramework.Application.ApplicationService.getInjector();
                    var applicationService = $injector.get("applicationService");
                    that.$scope.filterAreaText = applicationService.configuration.filterAreaText;
                    that.$scope.filterAreaUrl = applicationService.configuration.filterAreaUrl;
                    that.$scope.copyToClipboard = (text, isBinary = false) => {
                        try {
                            if (isBinary) {
                                text = window.atob(text);
                            }
                            navigator.clipboard.writeText(text);
                        }
                        catch (error) {
                            var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                            appInsightsService.trackException(error);
                        }
                    };
                    that.$scope.saveConfigurationProfile = () => that.saveConfigurationProfile();
                    that.$scope.saveAsNewConfigurationProfile = () => that.saveAsNewConfigurationProfile();
                    that.$scope.selectConfigurationProfile = (listConfigurationProfile, event) => that.selectConfigurationProfile(listConfigurationProfile, event);
                    that.$scope.editConfigurationProfile = (listConfigurationProfile, event) => that.editConfigurationProfile(listConfigurationProfile, event);
                    that.$scope.deleteConfigurationProfile = (listConfigurationProfile, event) => that.deleteConfigurationProfile(listConfigurationProfile, event);
                    that.$scope.resetConfigurationProfile = () => that.resetConfigurationProfile();
                    that.callScopeInitializationFunction();
                    var listController = that;
                    that.$scope.$on("kendoWidgetCreated", (e, widget) => __awaiter(this, void 0, void 0, function* () {
                        if (widget.wrapper && angular.element(widget.wrapper).hasClass("k-grid") && angular.element(widget.wrapper).parents("div[cofx-busy-indicator]").first().hasClass("identifier-" + listController.$scope.identifier)) {
                            if (!listController.$scope.grid) {
                                listController.$scope.grid = widget;
                                listController.$scope.rootElement = that.$scope.grid.wrapper.closest(".cofx-list");
                                listController.$scope.isIncludeList = listController.$scope.rootElement.parents("div[cofx-include-list]").length > 0;
                                that.initialize();
                                // handle touch scroll events
                                $scope.touchStartFunction = (event) => {
                                    if (event.target.closest('.k-virtual-scrollable-wrap')) {
                                        that.$scope.touchScrollStartY = event.touches[0].clientY;
                                    }
                                    else {
                                        that.$scope.touchScrollStartY = undefined;
                                    }
                                };
                                $scope.touchMoveFunction = (event) => {
                                    if (that.$scope.touchScrollStartY !== undefined) {
                                        const scrollDiv = that.$scope.touchScrollStartY - event.touches[0].clientY;
                                        var verticalScrollbar = that.$scope.grid.wrapper.find(".k-scrollbar");
                                        if (verticalScrollbar.length > 0) {
                                            verticalScrollbar.scrollTop(verticalScrollbar.scrollTop() + scrollDiv);
                                        }
                                        var autoScrollable = that.$scope.grid.wrapper.find(".k-grid-content.k-auto-scrollable");
                                        if (autoScrollable.length > 0) {
                                            autoScrollable.scrollTop(autoScrollable.scrollTop() + scrollDiv);
                                        }
                                        that.$scope.touchScrollStartY = event.touches[0].clientY;
                                    }
                                };
                                document.addEventListener('touchstart', $scope.touchStartFunction, { passive: true });
                                document.addEventListener('touchmove', $scope.touchMoveFunction, { passive: true });
                                that.gridFooterObserver = new MutationObserver(mutationList => 
                                // child node has been added or removed
                                mutationList.filter(m => m.type === 'childList').forEach(m => {
                                    if (Array.from(m.removedNodes).find(n => n.classList && n.classList.contains("k-grid-footer"))) {
                                        that.$scope.displayFooterAggregatesArray.push(true);
                                        that.$timeout(() => that.displayFooterAggregates());
                                    }
                                }));
                                that.gridFooterObserver.observe(listController.$scope.grid.wrapper[0], { childList: true, subtree: true });
                                ////$(listController.$scope.grid.wrapper).bind("DOMNodeRemoved", function (e: any) {
                                ////	if ($(e.target)[0].className == "k-grid-footer") {
                                ////		that.$scope.displayFooterAggregatesArray.push(true);
                                ////		that.$timeout(() => that.displayFooterAggregates());
                                ////	}
                                ////                  });
                                // TODO: adaptive rendering for grid
                                //if (kendo.support.mobileOS.tablet) {
                                //	listController.$scope.grid.setOptions({ mobile: "tablet" });that.$scope.selectedItems
                                //} else if (<any>kendo.support.mobileOS != false) {
                                //	listController.$scope.grid.setOptions({ mobile: "phone" });
                                //}
                                listController.$scope.grid.bind("page", () => {
                                    that.$timeout(() => {
                                        var autoScrollable = that.$scope.grid.wrapper.find(".k-grid-content.k-auto-scrollable");
                                        if (autoScrollable.length > 0) {
                                            autoScrollable.scrollTop(0);
                                        }
                                    });
                                });
                                listController.$scope.grid.bind("dataBound", () => {
                                    // load configuration profiles
                                    if (!that.$scope.configurationProfilesInitialized) {
                                        that.$scope.configurationProfilesInitialized = true;
                                        setTimeout(() => that.reloadConfigurationProfiles(true));
                                    }
                                    var rows = that.$scope.grid.tbody.find("tr");
                                    // add click event to headers for sorting
                                    var headerCells = that.$scope.grid.thead.find("th");
                                    headerCells.unbind("click");
                                    headerCells.bind("click", (e) => {
                                        if (e.target.parentElement.classList.contains("cofx-row-selector")) {
                                            that.$timeout(() => {
                                                if (that.$scope.selectedItems.length < that.$scope.numberOfUnfilteredSelectableItems) {
                                                    listController.unselectAllRows();
                                                    that.$scope.selectedItems = [];
                                                    listController.flattenedEntityObjects
                                                        .filter(item => !item.isGroup
                                                        && listController.itemContainsSearchExpression(item, listController.$scope.fullTextSearchExpression)
                                                        && item.entity[that.$scope.editProperty])
                                                        .forEach(item => {
                                                        if (that.$scope.selectedItems.filter(selectedItem => that.itemsAreEqual(selectedItem, item)).length == 0) {
                                                            that.$scope.selectedItems.push(item);
                                                        }
                                                    });
                                                    listController.selectAllRows();
                                                }
                                                else {
                                                    listController.$scope.selectedItems = [];
                                                    listController.unselectAllRows();
                                                }
                                            });
                                        }
                                        else {
                                            if (e.currentTarget.attributes["data-field"]) {
                                                that.$scope.hasConfigurationProfileChanges = true;
                                                that.sortItems(e.currentTarget.attributes["data-field"].value);
                                                that.$scope.hasConfigurationProfileChanges = true;
                                            }
                                        }
                                    });
                                    // add dblclick event handler to each row
                                    rows.dblclick((e) => {
                                        if (e.target.nodeName != "INPUT") {
                                            that.$timeout(() => {
                                                if (that.$scope.select) {
                                                    that.$scope.select(that.$scope.selectedItems);
                                                }
                                                else {
                                                    if (that.canEdit()) {
                                                        that.editEntity(that.getProperty(that.$scope.selectedItems[0], that.$scope.editProperty));
                                                    }
                                                }
                                            });
                                        }
                                    });
                                    rows.mousedown((event) => {
                                        if (event.shiftKey || event.ctrlKey) {
                                            that.$scope.grid.wrapper.on("mousedown", null, that.preventSelection);
                                        }
                                        else if (event.button === 2) {
                                            this.rowClick(event, that);
                                        }
                                    });
                                    rows.mouseup((event) => {
                                        that.$scope.grid.wrapper.off("mousedown", null, that.preventSelection);
                                    });
                                    // add click event for rows
                                    rows.click((event) => {
                                        this.rowClick(event, that);
                                    });
                                    // open contextmenu for group rows
                                    rows.contextmenu((event) => {
                                        var dataItem = that.$scope.grid.dataItem(event.currentTarget);
                                        if (dataItem && dataItem.isGroup) {
                                            var contextMenu = $(".cofx-grid-group-context-menu").data("kendoContextMenu");
                                            contextMenu.open(event.pageX, event.pageY);
                                            that.$scope.groupOperationTarget = event.currentTarget;
                                            that.$scope.$root.groupOperationScope = that.$scope;
                                        }
                                        else if (dataItem) {
                                            var contextMenu = $(".cofx-grid-row-context-menu").data("kendoContextMenu");
                                            contextMenu.open(event.pageX, event.pageY);
                                            that.$scope.groupOperationTarget = event.currentTarget;
                                        }
                                        return false;
                                    });
                                    // iterate over all rows
                                    var selectedUuids = that.$scope.selectedItems.filter(item => this.getUuid(item)).map(item => this.getUuid(item));
                                    rows.toArray().forEach((row) => {
                                        var dataItem = that.$scope.grid.dataItem(row);
                                        if (dataItem) {
                                            var jRow = $(row);
                                            // color group rows
                                            if (dataItem.isGroup) {
                                                jRow.addClass("cofx-grid-group");
                                                jRow.addClass("cofx-grid-group-" + (dataItem.level > 4 ? "4" : dataItem.level.toString()));
                                            }
                                            else {
                                                jRow.find("td:first-of-type").addClass("cofx-grid-content-" + (that.$scope.groupManager.groupState.length > 4 ? "4" : that.$scope.groupManager.groupState.length.toString()));
                                            }
                                            // update selected items
                                            if (selectedUuids.indexOf(this.getUuid(dataItem)) > -1) {
                                                that.selectRow(jRow);
                                            }
                                        }
                                    });
                                    // set column width
                                    if (!that.columnsResized) {
                                        that.resizeColumns();
                                    }
                                });
                                listController.$scope.grid.bind("columnReorder", (e) => {
                                    that.$timeout(() => {
                                        that.$scope.hasConfigurationProfileChanges = true;
                                        that.updateDataSource();
                                        that.calculateFooterAggregates();
                                    });
                                });
                            }
                        }
                        else if (widget.wrapper && widget.wrapper.context && widget.wrapper.context.id == "filterTabStrip") {
                            listController.$scope.tabStrip = widget;
                        }
                        // Initialize filter
                        if (this.$scope.rootElement) {
                            listController.$scope.reportForm = this.$scope.rootElement.find("#cofx-list-report-form");
                        }
                    }));
                    that.$scope.$on("comboBoxValuesLoading", (sender, eventArgs) => {
                        that.cofxBusyIndicatorService.addJob(that.$scope, "loadComboBoxValues", "Load combobox " + eventArgs, { isBlocking: !that.$scope.filterFormLoaded });
                    });
                    that.$scope.$on("comboBoxValuesLoaded", (eventArgs) => {
                        that.cofxBusyIndicatorService.removeJob(that.$scope, "loadComboBoxValues");
                    });
                    that.$scope.$on("comboBoxValuesReset", (eventArgs) => {
                        that.cofxBusyIndicatorService.removeJob(that.$scope, "loadComboBoxValues");
                    });
                    that.$scope.$watch("fullTextSearchExpression", (newValue, oldValue) => {
                        if (newValue != oldValue) {
                            this.updateDataSource();
                            this.calculateFooterAggregates();
                        }
                    });
                    that.$scope.$on("$destroy", () => {
                        that.$scope.destroyed = true;
                        document.removeEventListener('touchstart', $scope.touchStartFunction);
                        document.removeEventListener('touchmove', $scope.touchMoveFunction);
                        that.$timeout.cancel();
                        that.hotkeysService.remove(that.$scope.registeredHotkeys);
                        that.gridFooterObserver.disconnect();
                    });
                    that.$timeout(() => {
                        // remove filter default values
                        if (that.$scope.ignoreFilterDefaultValues) {
                            var listScope = that.$scope;
                            for (var property in listScope.filterEntity) {
                                if (listScope.filterEntity.hasOwnProperty(property)) {
                                    if (listScope.requiredFilterMembers.indexOf(property) < 0) {
                                        listScope.filterEntity[property] = null;
                                    }
                                }
                            }
                        }
                        // load external filter from default values
                        if (that.$scope.externalFilterDefaultValues) {
                            that.$scope.externalFilterDefaultValues.forEach(p => {
                                var name = p.filterParameterName;
                                var value = p.filterValue;
                                var filters = that.$scope.filters.filter(f => f.filterParameterName == name);
                                if (filters.length > 0) {
                                    that.$scope.filterEntity[filters[0].filterName] = that.httpService.transformResponseValue(value);
                                }
                                // TODO: handle RelationCells with FilterValue property
                            });
                        }
                        // close actions context menu on click
                        $(".cofx-list-actions-context-menu div, .cofx-list-export-context-menu div").click((e) => {
                            var contextMenu = $(e.target).closest(".cofx-list-context-menu-root").data("kendoContextMenu");
                            contextMenu.close();
                        });
                    });
                }
                callScopeInitializationFunction() {
                    var that = this;
                    if (that.$scope.destroyed) {
                        return;
                    }
                    var src = that.$scope.src;
                    if (!src) {
                        src = this.$location.path();
                    }
                    src = src.replace(/\/app\/lists\//, "");
                    src = src.replace(/\/lists\//, "");
                    if (src.indexOf("?") >= 0) {
                        src = src.substr(0, src.indexOf("?"));
                    }
                    var functionName = "initialize" + window.btoa(src);
                    if (window.initializeListFunctions[functionName]) {
                        window.initializeListFunctions[functionName](that.$scope);
                        that.loadParameters();
                    }
                    if (that.$scope.isAngularList) {
                        this.initializeAngular();
                    }
                }
                initializeAngular() {
                    var that = this;
                    // Update page title
                    var search = that.$location.search();
                    if (search.title) {
                        that.$scope.title = search.title;
                    }
                }
                initialize() {
                    var that = this;
                    if (that.$scope.destroyed) {
                        return;
                    }
                    that.$scope.groupManager.groupsChanged = (expandLevel) => that.groupsChanged(expandLevel);
                    that.$scope.actionManager.initialize(that, that.$scope, that.$log, that.$translate, that.$q, that.$timeout, that.cofxBusyIndicatorService, that.cofxViewService, that.$scope.listName, that.$scope.getFilterParameters, that.$scope.editProperty);
                    that.$scope.actionManager.actionExecuted = (result) => that.actionExecuted(result);
                    that.$scope.validationManager.initialize(that, that.$scope, that.$log, that.$translate, that.$q, that.cofxBusyIndicatorService, that.cofxViewService);
                    that.updateGroupableColumns();
                    // Update page title
                    var search = that.$location.search();
                    if (search.title) {
                        if (that.$scope.rootElement.parents("div[cofx-include-list]").length == 0) {
                            that.$scope.title = search.title;
                        }
                    }
                    that.$scope.$on("formLoaded", function () {
                        that.$scope.filterFormLoaded = true;
                        CockpitFramework.Controls.FormHelperFunctions.setFocusedElement($(that.$scope.grid.table).parents(".cofx-list"));
                        if (that.$scope.executeOnOpen) {
                            that.applyFilter(false);
                        }
                    });
                    that.registerHotkeys();
                    // view content loaded
                    that.$scope.viewMode = Data.ListViewMode.List;
                    that.$translate("cofx.data.list.printView").then((value) => {
                        if (CockpitFramework.Application.ApplicationService.getCurrentApplication().configuration.allowReportingServicesExports) {
                            that.$scope.views.splice(0, 0, { uuid: null, name: "", friendlyName: value, loaded: false, isActive: false });
                        }
                        that.$scope.views.forEach(v => {
                            v.loaded = false;
                            v.isActive = false;
                        });
                        var format = that.$location.search().format;
                        var viewName = that.$location.search().view;
                        if (viewName && !format) {
                            format = "pdf";
                        }
                        if (format) {
                            var view = that.$scope.views[0];
                            if (viewName) {
                                var filteredViews = that.$scope.views.filter(v => v.name.toLowerCase() == viewName.toLowerCase());
                                if (filteredViews.length > 0) {
                                    view = filteredViews[0];
                                }
                            }
                            view.isActive = true;
                            if (format.toLowerCase() == "pdf") {
                                that.$scope.viewMode = Data.ListViewMode.Pdf;
                            }
                            else if (format.toLowerCase() == "excel") {
                                that.$scope.viewMode = Data.ListViewMode.Excel;
                            }
                            else if (format.toLowerCase() == "word") {
                                that.$scope.viewMode = Data.ListViewMode.Word;
                            }
                        }
                        if (that.$scope.executeOnOpen) {
                            that.applyFilter(false);
                        }
                        that.$scope.rootElement.find(".cofx-list-full-text-search > input").focusout((eventObject) => {
                            if (eventObject.target != that.focusedElement) {
                                that.setFocus(true);
                            }
                        });
                        that.$scope.rootElement.find(".cofx-list-full-text-search > input").keyup((eventObject) => {
                            if (eventObject.keyCode == 27 && eventObject.target != that.focusedElement) {
                                that.setFocus(true);
                            }
                        });
                        that.viewContentLoaded();
                    });
                }
                // can be overridden in other projects
                viewContentLoaded() {
                }
                // can be overridden in other projects
                dataLoaded(grid) {
                }
                getFilterParameters() {
                    var that = this;
                    var parameters = {};
                    for (var i = 0; i < that.$scope.filters.length; i++) {
                        var filter = that.$scope.filters[i];
                        if (filter.filterParameterName) {
                            var value = that.$scope.filterEntity[filter.filterValueName];
                            if (value === undefined) {
                                value = null;
                            }
                            parameters[filter.filterParameterName] = value;
                        }
                    }
                    if (that.$scope.externalParameters) {
                        that.$scope.externalParameters.forEach(parameter => {
                            parameters[parameter.filterParameterName] = parameter.filterValue;
                        });
                    }
                    return parameters;
                }
                getQueryFilters() {
                    var that = this;
                    //{ path: string; binaryOperator: string; operand: string }
                    var predicates = [];
                    for (var i = 0; i < that.$scope.filters.length; i++) {
                        var filter = that.$scope.filters[i];
                        if (filter.filterPath && !filter.filterIgnorePathInQuery) {
                            if (that.$scope.filterEntity[filter.filterValueName] != null) {
                                var operand = that.$scope.filterEntity[filter.filterValueName];
                                if (typeof (operand) != "string" || that.$scope.filterEntity[filter.filterValueName] != "") {
                                    if (filter.filterOperator == "like") {
                                        operand = "%" + operand + "%";
                                    }
                                    predicates.push({ path: filter.filterPath, binaryOperator: filter.filterOperator, operand: operand });
                                }
                            }
                        }
                    }
                    // add external filters
                    if (that.$scope.externalFilters) {
                        for (var i = 0; i < that.$scope.externalFilters.length; i++) {
                            var externalFilter = that.$scope.externalFilters[i];
                            predicates.push({ path: externalFilter.filterPath, binaryOperator: externalFilter.filterOperator, operand: externalFilter.filterValue });
                        }
                    }
                    if (that.$scope.externalCondition) {
                        predicates.push({ expression: that.$scope.externalCondition });
                    }
                    var queryFilters = undefined;
                    if (predicates.length > 0) {
                        queryFilters = { logicalOperator: "and", predicates: predicates };
                    }
                    return queryFilters;
                }
                getCondition() {
                    var that = this;
                    var condition = null;
                    // do not use conditions from url for lists in forms
                    if (!that.$scope.isIncludeList) {
                        var conditionQueryString = that.$location.search().condition;
                        if (conditionQueryString) {
                            condition = conditionQueryString;
                        }
                    }
                    return condition;
                }
                columnResize(e) {
                    var that = this;
                    if (!e.column.tcResizable) {
                        e.column.width = e.oldWidth;
                        that.saveGridState();
                        that.removeTooltipFromGrid(".k-grid");
                        that.loadGridState();
                        that.updateGroupableColumns();
                        that.updateSortIndicator();
                        that.updateGridTooltips();
                    }
                    else if (!that.columnResizeInProgress) {
                        e.column.tcColumnWidthAdjusted = true;
                    }
                }
                columnMenuInit(e) {
                    var that = this;
                    var menu = e.container.find(".k-menu").data("kendoMenu");
                    var columns = that.$scope.groupableColumns.filter((c) => c.field == e.field);
                    if (columns.length > 0) {
                        var column = columns[0];
                        if (column) {
                            that.$translate(["cofx.data.list.groupByColumn", "cofx.data.list.hideColumn", "cofx.data.list.calendarWeek", "cofx.data.list.groupByYear", "cofx.data.list.groupByMonth", "cofx.data.list.groupByWeek", "cofx.data.list.groupByDay", "cofx.data.list.groupByFormattedDate"], { column: column.title }).then((translations) => {
                                // remove column menu
                                menu.element[0].childNodes[0].remove();
                                if (that.$scope.allowGroup !== false) {
                                    if (column.tcDataType == "DateTime" || column.tcDataType == "Date") {
                                        var subItems = [];
                                        subItems.push({ text: translations["cofx.data.list.groupByFormattedDate"] });
                                        subItems.push({ text: translations["cofx.data.list.groupByYear"] });
                                        subItems.push({ text: translations["cofx.data.list.groupByMonth"] });
                                        subItems.push({ text: translations["cofx.data.list.groupByWeek"] });
                                        subItems.push({ text: translations["cofx.data.list.groupByDay"] });
                                    }
                                    var groupMenuItem = { text: translations["cofx.data.list.groupByColumn"], spriteCssClass: "k-i-group", items: subItems };
                                    menu.append(groupMenuItem, null);
                                }
                                // TODO: does not work, at least one column has to locked initially
                                //var lockMenuItem = { text: "Lock", spriteCssClass: "k-i-lock" };
                                //menu.append(lockMenuItem, null);
                                //var lockMenuItem = { text: "Unlock", spriteCssClass: "k-i-unlock" };
                                //menu.append(lockMenuItem, null);
                                var hideMenuItem = { text: translations["cofx.data.list.hideColumn"], spriteCssClass: "k-i-minus" };
                                menu.append(hideMenuItem, null);
                                menu.bind("select", (e1) => {
                                    var text = $(e1.item).text();
                                    if (text == translations["cofx.data.list.groupByColumn"] || text == translations["cofx.data.list.groupByFormattedDate"] || text == translations["cofx.data.list.groupByYear"] || text == translations["cofx.data.list.groupByMonth"] || text == translations["cofx.data.list.groupByWeek"] || text == translations["cofx.data.list.groupByDay"]) {
                                        var formatPattern = null;
                                        switch (text) {
                                            case translations["cofx.data.list.groupByYear"]:
                                                formatPattern = "yyyy";
                                                break;
                                            case translations["cofx.data.list.groupByMonth"]:
                                                formatPattern = "yyyy-MM";
                                                break;
                                            case translations["cofx.data.list.groupByWeek"]:
                                                formatPattern = "yyyy-'" + translations["cofx.data.list.calendarWeek"] + "' ww";
                                                break;
                                            case translations["cofx.data.list.groupByDay"]:
                                                formatPattern = "d";
                                                break;
                                        }
                                        that.$scope.groupManager.addGroup(column, that.$scope.aggregate, formatPattern);
                                        that.$scope.views.forEach(v => v.loaded = false);
                                        that.calculateFooterAggregates();
                                        // TODO: get better information if column contains hyperlink
                                        if (!column.template || column.template.indexOf("<a href=") < 0) {
                                            var cols = that.$scope.columns.filter(c => c.field == column.field);
                                            if (cols.length > 0 && !cols[0].hidden) {
                                                that.$scope.$apply(() => {
                                                    that.toggleColumnVisibility(cols[0]);
                                                });
                                            }
                                        }
                                    }
                                    else if (text == translations["cofx.data.list.hideColumn"]) {
                                        var cols = that.$scope.columns.filter(c => c.field == column.field);
                                        if (cols.length > 0) {
                                            that.$scope.$apply(() => {
                                                that.toggleColumnVisibility(cols[0]);
                                                var popup = e.container.data("kendoPopup");
                                                menu.close(null);
                                                popup.close();
                                            });
                                        }
                                    }
                                    else if (text == "Lock") {
                                        that.$scope.$apply(() => {
                                            that.$scope.grid.lockColumn(column.field);
                                            var popup = e.container.data("kendoPopup");
                                            menu.close(null);
                                            popup.close();
                                        });
                                    }
                                    else if (text == "Unlock") {
                                        that.$scope.$apply(() => {
                                            that.$scope.grid.unlockColumn(column.field);
                                            var popup = e.container.data("kendoPopup");
                                            menu.close(null);
                                            popup.close();
                                        });
                                    }
                                });
                            });
                        }
                    }
                }
                fastExcelExport(format) {
                    return __awaiter(this, void 0, void 0, function* () {
                        var excelExportService = CockpitFramework.Application.ApplicationService.getInjector().get("excelExportService");
                        let excelData = [];
                        let columns = [];
                        // check if default profile should be exported
                        var $injector = CockpitFramework.Application.ApplicationService.getInjector();
                        const applicationService = $injector.get("applicationService");
                        let selectedListConfigurationProfile = null;
                        if (applicationService.configuration.resetConfigurationProfileForExport && (this.$scope.selectedListConfigurationProfile || this.$scope.hasConfigurationProfileChanges)) {
                            if (this.$scope.hasConfigurationProfileChanges) {
                                var keys = [
                                    "cofx.data.list.confirmUndoConfigurationProfileChangesTitle",
                                    "cofx.data.list.confirmUndoConfigurationProfileChangesDescription",
                                ];
                                const translations = yield this.$translate(keys);
                                const messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                                const result = yield messageService.confirm("confirmundoconfigurationprofilechanges", translations["cofx.data.list.confirmUndoConfigurationProfileChangesTitle"], translations["cofx.data.list.confirmUndoConfigurationProfileChangesDescription"]);
                                if (result != CockpitFramework.Controls.MessageResult.Confirm) {
                                    return;
                                }
                            }
                            selectedListConfigurationProfile = this.$scope.selectedListConfigurationProfile;
                            if (selectedListConfigurationProfile) {
                                this.resetConfigurationProfile();
                            }
                        }
                        for (let column of this.$scope.grid.columns.slice(2)) {
                            if (column.template && (column.template.indexOf("entity.") >= 0 || (column.template.match(/<img [^>]*>/ig)))) {
                                let colFormat = column.cofxFormatPattern;
                                if (column.tcDataType == "Decimal" && colFormat) {
                                    colFormat = colFormat.replace(/[^#0\.\,]+/g, (x) => { return '"' + x + '"'; });
                                }
                                else if (column.tcDataType == "DateTime" && colFormat) {
                                    colFormat = CockpitFramework.Globalization.DateFormatPatterns.convertToMomentFormatPattern(colFormat).replace(/A/g, 'AM/PM');
                                }
                                columns.push({
                                    title: column.title,
                                    template: kendo.template(column.template),
                                    field: column.field,
                                    dataType: column.tcDataType,
                                    format: colFormat
                                });
                            }
                        }
                        // check selected items
                        let exportData = [];
                        if (applicationService.listOptions && applicationService.listOptions.exportCollapsedRows === true) {
                            exportData = this.flattenedEntityObjects;
                        }
                        else {
                            exportData = this.$scope.grid.dataSource.data().filter(i => true);
                        }
                        if (this.$scope.selectedItems.length > 0) {
                            var keys = [
                                "cofx.data.list.exportOnlySelectedRows",
                                "cofx.data.list.exportAllRows",
                                "cofx.data.list.exportAllRowsTitle",
                                "cofx.data.list.exportAllRowsDescription"
                            ];
                            const translations = yield this.$translate(keys);
                            const messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                            const result = yield messageService.confirm("confirmundoconfigurationprofilechanges", translations["cofx.data.list.exportAllRowsTitle"], translations["cofx.data.list.exportAllRowsDescription"], null, { confirmButtonText: translations["cofx.data.list.exportAllRows"], cancelButtonText: translations["cofx.data.list.exportOnlySelectedRows"] });
                            if (result != CockpitFramework.Controls.MessageResult.Confirm) {
                                exportData = this.$scope.selectedItems;
                            }
                        }
                        for (let item of exportData.filter(d => !d.isGroup)) {
                            const row = [];
                            for (let column of columns) {
                                let value = null;
                                let field = column;
                                if (column.dataType == "Decimal" || column.dataType == "Boolean" || column.dataType == "DateTime") {
                                    value = item;
                                    for (let path of column.field.split('.')) {
                                        if (value) {
                                            value = value[path];
                                        }
                                    }
                                    if (column.dataType == "Boolean") {
                                        if (value) {
                                            value = 1;
                                        }
                                        else {
                                            value = 0;
                                        }
                                    }
                                }
                                else {
                                    value = this.clearExcelValue(column.template(item));
                                }
                                row.push(value);
                            }
                            excelData.push(row);
                        }
                        let date = moment();
                        let filename = this.$scope.title + '-' + date.format('YYYY-MM-DD-HH-mm-ss');
                        excelExportService.export(columns.map((c) => ({ title: c.title, dataType: c.dataType, format: c.format })), excelData, filename, this.$scope.title, format);
                        if (selectedListConfigurationProfile) {
                            this.selectConfigurationProfile(selectedListConfigurationProfile, null);
                        }
                    });
                }
                clearExcelValue(content) {
                    if (content) {
                        content = content.replace("<div class='cofx-boolean-readonly-false' ></div>", "0");
                        content = content.replace("<div class='cofx-boolean-readonly-true' ></div>", "1");
                        content = content.replace("<div class='cofx-boolean-readonly-null' ></div>", "");
                        // find image url
                        const imgMatch = content.match(/<img [^>]*>/ig);
                        if (imgMatch && !content.match(/div style=["']display:none["']/)) {
                            const srcMatch = imgMatch[0].match(/src=["'][^"']*["']/);
                            if (srcMatch) {
                                content = content.replace(/<img [^>]*>/ig, srcMatch[0].substr(5, srcMatch[0].length - 6));
                            }
                            else {
                                content = "image";
                            }
                        }
                        content = content.replace(/<img [^>]*>/ig, "");
                        content = content.replace(/<[^>]*>/ig, "");
                        content = content.trim();
                    }
                    return content;
                }
                setFocus(ignoreHotkeys = false) {
                    var that = this;
                    if (!ignoreHotkeys) {
                        that.registerHotkeys();
                    }
                    CockpitFramework.Controls.FormHelperFunctions.setFocusedElement($(that.$scope.grid.table).parents(".cofx-list"), that.focusedElement);
                }
                removeFocus(ignoreHotkeys = false) {
                    var that = this;
                    if (!ignoreHotkeys) {
                        that.hotkeysService.remove(that.$scope.registeredHotkeys);
                    }
                    that.focusedElement = document.activeElement;
                }
                addObject() {
                    var that = this;
                    if (that.canAdd()) {
                        const uuid = null;
                        that.openForm(null, that.$scope.editFormName, that.$scope.editModelEntityName, that.$scope.editModelEntityFriendlyName, that.$scope.editFormExpression, uuid, false, !uuid, null);
                    }
                }
                editSelectedEntity() {
                    var that = this;
                    if (that.$scope.canEdit()) {
                        that.editEntity(that.getProperty(that.$scope.selectedItems[0], that.$scope.editProperty));
                    }
                }
                copySelectedEntity() {
                    var that = this;
                    if (that.$scope.canCopy()) {
                        that.openForm(null, that.$scope.editFormName, that.$scope.editModelEntityName, that.$scope.editModelEntityFriendlyName, that.$scope.editFormExpression, that.getProperty(that.$scope.selectedItems[0], that.$scope.editProperty), true, false, null);
                    }
                }
                editEntity(uuid) {
                    var that = this;
                    if (that.$scope.allowEdit) {
                        that.openForm(null, that.$scope.editFormName, that.$scope.editModelEntityName, that.$scope.editModelEntityFriendlyName, that.$scope.editFormExpression, uuid, false, !uuid, null);
                    }
                }
                saveConfigurationProfile() {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (this.$scope.hasConfigurationProfileChanges && this.$scope.selectedListConfigurationProfile) {
                            const listConfigurationProfileService = CockpitFramework.Application.ApplicationService.getInjector().get("listConfigurationProfileService");
                            const hasChanges = yield listConfigurationProfileService.saveConfigurationProfile(this.$scope.listName, this.$scope.selectedListConfigurationProfile.uuid, this.buildConfiguration());
                            if (hasChanges) {
                                this.$scope.hasConfigurationProfileChanges = false;
                                this.reloadConfigurationProfiles(false);
                            }
                        }
                    });
                }
                saveAsNewConfigurationProfile() {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (this.$scope.hasConfigurationProfileChanges) {
                            const listConfigurationProfileService = CockpitFramework.Application.ApplicationService.getInjector().get("listConfigurationProfileService");
                            const hasChanges = yield listConfigurationProfileService.saveConfigurationProfile(this.$scope.listName, null, this.buildConfiguration());
                            if (hasChanges) {
                                this.$scope.hasConfigurationProfileChanges = false;
                                const previousUuids = this.$scope.listConfigurationProfiles.map(p => p.uuid);
                                yield this.reloadConfigurationProfiles(false).then(() => {
                                    const newProfile = this.$scope.listConfigurationProfiles.find(p => previousUuids.indexOf(p.uuid) < 0);
                                    if (newProfile) {
                                        this.selectConfigurationProfile(newProfile, null);
                                    }
                                });
                            }
                        }
                    });
                }
                selectConfigurationProfile(listConfigurationProfile, pointerEvent) {
                    this.$scope.selectedListConfigurationProfile = listConfigurationProfile;
                    if (pointerEvent) {
                        // close the ContextMenu
                        let contextMenu = $("#list-configuration-context-menu").data("kendoContextMenu");
                        contextMenu.close(null);
                    }
                    // update columns
                    if (listConfigurationProfile.configuration.columns) {
                        // get first column with header
                        let index = this.$scope.grid.columns.findIndex(c => c.tcIdentifier && !!c.tcIdentifier.trim());
                        for (let column of listConfigurationProfile.configuration.columns) {
                            const gridColumn = this.$scope.grid.columns.find(c => c.tcIdentifier === column.identifier);
                            const scopeColumn = this.$scope.columns.find(c => c.tcIdentifier === column.identifier);
                            if (scopeColumn) {
                                scopeColumn.hidden = column.hidden;
                            }
                            if (gridColumn) {
                                if (column.hidden) {
                                    this.$scope.grid.hideColumn(gridColumn);
                                }
                                else {
                                    this.$scope.grid.showColumn(gridColumn);
                                }
                                this.$scope.grid.reorderColumn(index++, gridColumn);
                            }
                        }
                    }
                    // update sort order
                    if (listConfigurationProfile.configuration.sortState) {
                        this.$scope.sortState = {
                            field: listConfigurationProfile.configuration.sortState.field, dir: listConfigurationProfile.configuration.sortState.dir
                        };
                        this.$scope.sortState.dir = listConfigurationProfile.configuration.sortState.dir === 'asc' ? '' : (listConfigurationProfile.configuration.sortState.dir === 'desc' ? 'asc' : 'desc');
                        this.sortItems(listConfigurationProfile.configuration.sortState.field);
                    }
                    else {
                        const firstCol = this.$scope.grid.columns.find(c => !!c.title.trim() && !!c.field.trim());
                        if (firstCol) {
                            this.$scope.sortState = { field: firstCol.field, dir: 'desc' };
                            this.sortItems(firstCol.field);
                        }
                    }
                    // update grouping
                    if (!this.$scope.initialGroupState) {
                        this.$scope.initialGroupState = this.$scope.groupManager.groupState.slice();
                    }
                    for (let i = this.$scope.groupManager.groupState.length - 1; i >= 0; i--) {
                        this.$scope.groupManager.removeGroup(this.$scope.groupManager.groupState[i]);
                    }
                    let groupExpandLevel = 0;
                    if (listConfigurationProfile.configuration.groups) {
                        for (let group of listConfigurationProfile.configuration.groups) {
                            const gridColumn = this.$scope.grid.columns.find(c => c.field === group.field);
                            if (gridColumn) {
                                this.$scope.groupManager.addGroup(gridColumn, group.aggregates, group.formatPattern, group.autoExpand);
                                if (group.autoExpand) {
                                    groupExpandLevel++;
                                }
                            }
                        }
                    }
                    setTimeout(() => {
                        this.updateExpandLevel(listConfigurationProfile.configuration.expandLevel ? listConfigurationProfile.configuration.expandLevel : groupExpandLevel);
                    });
                    this.$scope.hasConfigurationProfileChanges = false;
                }
                resetConfigurationProfile() {
                    if (this.$scope.selectedListConfigurationProfile || this.$scope.hasConfigurationProfileChanges) {
                        // get first column with header
                        let index = this.$scope.grid.columns.findIndex(c => c.tcIdentifier && !!c.tcIdentifier.trim());
                        for (let column of this.$scope.columns.filter(c => c.tcIdentifier && !!c.tcIdentifier.trim())) {
                            const gridColumn = this.$scope.grid.columns.find(c => c.tcIdentifier === column.tcIdentifier);
                            column.hidden = false;
                            if (gridColumn) {
                                this.$scope.grid.reorderColumn(index++, gridColumn);
                                if (column.hidden) {
                                    this.$scope.grid.hideColumn(gridColumn);
                                }
                                else {
                                    this.$scope.grid.showColumn(gridColumn);
                                }
                            }
                        }
                        // remove sorting
                        const firstCol = this.$scope.grid.columns.find(c => !!c.title.trim() && !!c.field.trim());
                        if (firstCol) {
                            this.$scope.sortState = { field: firstCol.field, dir: 'desc' };
                            this.sortItems(firstCol.field);
                        }
                        // update grouping
                        if (this.$scope.initialGroupState) {
                            for (let i = this.$scope.groupManager.groupState.length - 1; i >= 0; i--) {
                                this.$scope.groupManager.removeGroup(this.$scope.groupManager.groupState[i]);
                            }
                            for (let group of this.$scope.initialGroupState) {
                                const gridColumn = this.$scope.grid.columns.find(c => c.field === group.field);
                                if (gridColumn) {
                                    this.$scope.groupManager.addGroup(gridColumn, group.aggregates, group.formatPattern);
                                }
                            }
                        }
                        this.$scope.selectedListConfigurationProfile = null;
                        this.$scope.hasConfigurationProfileChanges = false;
                    }
                }
                editConfigurationProfile(listConfigurationProfile, pointerEvent) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (pointerEvent) {
                            pointerEvent.preventDefault();
                            pointerEvent.stopPropagation();
                            // close the ContextMenu
                            let contextMenu = $("#list-configuration-context-menu").data("kendoContextMenu");
                            contextMenu.close(null);
                        }
                        const listConfigurationProfileService = CockpitFramework.Application.ApplicationService.getInjector().get("listConfigurationProfileService");
                        yield listConfigurationProfileService.editConfigurationProfile(listConfigurationProfile.uuid);
                        this.reloadConfigurationProfiles();
                    });
                }
                deleteConfigurationProfile(listConfigurationProfile, pointerEvent) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (pointerEvent) {
                            pointerEvent.preventDefault();
                            pointerEvent.stopPropagation();
                            // close the ContextMenu
                            let contextMenu = $("#list-configuration-context-menu").data("kendoContextMenu");
                            contextMenu.close(null);
                        }
                        let reset = this.$scope.selectedListConfigurationProfile && this.$scope.selectedListConfigurationProfile.uuid == listConfigurationProfile.uuid;
                        const listConfigurationProfileService = CockpitFramework.Application.ApplicationService.getInjector().get("listConfigurationProfileService");
                        yield listConfigurationProfileService.deleteConfigurationProfile(listConfigurationProfile.uuid);
                        this.reloadConfigurationProfiles(reset, true);
                    });
                }
                buildConfiguration() {
                    const configuration = {};
                    // columns
                    configuration.columns = this.$scope.grid.columns.filter(c => c.tcIdentifier && !!c.tcIdentifier.trim()).map(c => ({
                        identifier: c.tcIdentifier,
                        hidden: c.hidden
                    }));
                    // sorting
                    if (this.$scope.sortState && !!this.$scope.sortState.dir) {
                        configuration.sortState = this.$scope.sortState;
                    }
                    // grouping
                    configuration.groups = this.$scope.groupManager.groupState;
                    configuration.expandLevel = this.$scope.expandLevel;
                    return configuration;
                }
                buildDefaultValues() {
                    var that = this;
                    var defaultValues = {};
                    that.$scope.filters.forEach(filter => {
                        if (filter.defaultValueMemberName && filter.filterName) {
                            defaultValues[filter.defaultValueMemberName] = that.$scope.filterEntity[filter.filterName];
                        }
                    });
                    if (that.$scope.formDefaultValues) {
                        that.$scope.formDefaultValues.forEach(defaultValue => {
                            if (defaultValue.path && defaultValue.value) {
                                defaultValues[defaultValue.path] = defaultValue.value;
                            }
                        });
                    }
                    return defaultValues;
                }
                reloadConfigurationProfiles(initialize = false, forceReset = false) {
                    var defer = this.$q.defer();
                    // get profiles
                    var listConfigurationProfileService = CockpitFramework.Application.ApplicationService.getInjector().get("listConfigurationProfileService");
                    listConfigurationProfileService.getProfiles(this.$scope.listName).then((result) => {
                        this.$scope.listConfigurationProfiles = result;
                        // set default profile
                        if (initialize) {
                            let defaultProfile = this.$scope.listConfigurationProfiles.find(l => l.isDefault === true);
                            if (defaultProfile) {
                                this.selectConfigurationProfile(defaultProfile, null);
                            }
                            else if (forceReset) {
                                this.resetConfigurationProfile();
                            }
                        }
                        defer.resolve();
                    });
                    return defer.promise;
                }
                unselectAllRows() {
                    var rows = this.$scope.grid.tbody.find("tr").not(".cofx-grid-group");
                    rows.removeClass("k-state-selected");
                    rows.find(".cofx-row-selector i").removeClass("fa-check-square-o").addClass("fa-square-o");
                    this.updateSelectAllStatus();
                }
                selectAllRows() {
                    var rows = this.$scope.grid.tbody.find("tr").not(".cofx-grid-group");
                    //rows.addClass("k-state-selected");
                    rows.find(".cofx-row-selector i").parent().parent().addClass("k-state-selected");
                    rows.find(".cofx-row-selector i").removeClass("fa-square-o").addClass("fa-check-square-o");
                    this.updateSelectAllStatus();
                }
                selectRow(row) {
                    row.addClass("k-state-selected");
                    row.find(".cofx-row-selector i").removeClass("fa-square-o").addClass("fa-check-square-o");
                    this.updateSelectAllStatus();
                }
                unselectRow(row) {
                    row.removeClass("k-state-selected");
                    row.find(".cofx-row-selector i").removeClass("fa-check-square-o").addClass("fa-square-o");
                    this.updateSelectAllStatus();
                }
                updateSelectAllStatus() {
                    var i = this.$scope.grid.thead.find(".cofx-row-selector > i");
                    if (this.$scope.selectedItems.length == this.$scope.numberOfUnfilteredSelectableItems) {
                        i.removeClass("fa-square-o fa-minus-square-o").addClass("fa-check-square-o");
                    }
                    else if (this.$scope.selectedItems.length == 0) {
                        i.removeClass("fa-check-square-o fa-minus-square-o").addClass("fa-square-o");
                    }
                    else {
                        i.removeClass("fa-check-square-o fa-square-o").addClass("fa-minus-square-o");
                    }
                }
                itemsAreEqual(item1, item2) {
                    var listItem1 = item1.entity;
                    var listItem2 = item2.entity;
                    if (this.$scope.editProperty) {
                        var path = this.$scope.editProperty.split(".");
                        path.forEach(p => {
                            if (listItem1) {
                                listItem1 = listItem1[p];
                            }
                            if (listItem2) {
                                listItem2 = listItem2[p];
                            }
                        });
                        return listItem1 && listItem2 && listItem1 == listItem2;
                    }
                    else {
                        return listItem1.ObjectUuid && listItem1.ObjectUuid == listItem2.ObjectUuid;
                    }
                }
                applyFilter(showErrors) {
                    console.log('apply filter');
                    var that = this;
                    var defer = that.$q.defer();
                    if (that.$scope.isLoading) {
                        defer.reject();
                    }
                    else {
                        setTimeout(() => {
                            console.log('execute list');
                            // send message to Angular
                            that.$scope.refreshTime = new Date();
                            that.$scope.lastExecutionStartTime = moment();
                            that.columnsResized = false;
                            var activeElement = document.activeElement;
                            if (activeElement && typeof activeElement.blur == "function") {
                                activeElement.blur();
                                activeElement.focus();
                            }
                            var dataContextNgService = CockpitFramework.Application.ApplicationService.getInjector().get("dataContextNgService");
                            dataContextNgService.getGlobalSetting("APP_NumberOfItemsInLists").subscribe((response) => {
                                var numberOfItems = response;
                                if (that.$scope.numberOfItemsInitiallyLoaded) {
                                    numberOfItems = that.$scope.numberOfItemsInitiallyLoaded;
                                }
                                if (!numberOfItems) {
                                    numberOfItems = 500;
                                }
                                // remove all reports
                                if (!that.$scope.isAngularList) {
                                    var frameContainer = that.$scope.rootElement.find("#cofx-list-result-iframe-container");
                                    frameContainer.find("iframe").remove();
                                }
                                if (!that.$scope.grid || !that.$scope.filterFormLoaded || !that.$scope.filterForm) {
                                    defer.resolve();
                                }
                                else {
                                    that.cofxBusyIndicatorService.addJob(that.$scope, "updatedata", "Load data");
                                    that.$scope.filterForm.validate([]).then((isValid) => {
                                        if (!isValid) {
                                            if (showErrors) {
                                                var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                                                messageService.alert("filternotvalid", "Filter not Valid", that.$scope.filterForm.getEntity().errors.map(e => e.message).join(", "));
                                            }
                                            defer.resolve();
                                        }
                                        else {
                                            that.$scope.numberOfItems = 0;
                                            that.$scope.numberOfUnfilteredItems = 0;
                                            that.$scope.numberOfUnfilteredSelectableItems = 0;
                                            that.$scope.allItemsLoaded = true;
                                            that.$scope.htmlLoaded = false;
                                            that.$scope.views.forEach(v => {
                                                v.loaded = false;
                                            });
                                            var selectedViews = that.$scope.views.filter(v => v.isActive);
                                            if (selectedViews.length > 0) {
                                                that.cofxBusyIndicatorService.addJob(that.$scope, "loadreport", "Load report");
                                                that.$scope.itemsLoaded = true;
                                                // open report
                                                if (that.$scope.viewMode == Data.ListViewMode.Pdf) {
                                                    that.showPdf(selectedViews[0], true);
                                                }
                                                else if (that.$scope.viewMode == Data.ListViewMode.Excel) {
                                                    that.showExcel(selectedViews[0]);
                                                }
                                                else if (that.$scope.viewMode == Data.ListViewMode.Word) {
                                                    that.showWord(selectedViews[0]);
                                                }
                                                defer.resolve();
                                            }
                                            else {
                                                // execute query
                                                that.$scope.isLoading = true;
                                                that.cofxBusyIndicatorService.addJob(that.$scope, "updatedata", "Load data");
                                                var query = null;
                                                var parameters = that.getFilterParameters();
                                                var queryFilters = that.getQueryFilters();
                                                var condition = that.getCondition();
                                                if (!that.$scope.isScriptSourceList && that.$scope.query) {
                                                    if (that.$scope.listName) {
                                                        query = that.dataContextService.selectByList(that.$scope.listName, {
                                                            parameters: parameters,
                                                            expressions: that.$scope.expressions,
                                                            validate: true,
                                                            condition: condition,
                                                            filters: queryFilters,
                                                            expandResult: true,
                                                            top: that.$scope.loadAllRowsFlag ? null : (numberOfItems + 1),
                                                            select: null
                                                        }).toPromise();
                                                    }
                                                    else {
                                                        query = that.dataContextService.selectByQuery(that.$scope.query, {
                                                            parameters: parameters,
                                                            expressions: that.$scope.expressions,
                                                            filters: queryFilters,
                                                            top: that.$scope.loadAllRowsFlag ? null : (numberOfItems + 1),
                                                            select: null,
                                                            condition: condition,
                                                            expandResult: true,
                                                            validate: true
                                                        }).toPromise();
                                                    }
                                                }
                                                else if (that.$scope.isScriptSourceList && that.$scope.listName) {
                                                    query = that.dataContextService.selectByList(that.$scope.listName, {
                                                        parameters: parameters,
                                                        expressions: that.$scope.expressions,
                                                        validate: true,
                                                        condition: null,
                                                        filters: null,
                                                        expandResult: null,
                                                        top: that.$scope.loadAllRowsFlag ? null : (numberOfItems + 1),
                                                        select: null
                                                    }).toPromise();
                                                }
                                                query.then((response) => {
                                                    that.$scope.validationManager.setParameters(that.getFilterParameters());
                                                    that.data = response.map((item) => that.$scope.validationManager.createItem(item, null, true));
                                                    that.$scope.lastExecutionDuration = moment().diff(that.$scope.lastExecutionStartTime, "ms");
                                                    var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                                                    appInsightsService.trackEvent("load list", { "path": window.location.pathname }, { "loadTime": that.$scope.lastExecutionDuration });
                                                    that.cofxBusyIndicatorService.removeJob(that.$scope, "updatedata");
                                                    that.cofxBusyIndicatorService.addJob(that.$scope, "renderdata", "Render data");
                                                    that.$timeout(() => {
                                                        try {
                                                            if (!that.$scope.destroyed) {
                                                                if (!that.$scope.loadAllRowsFlag && that.data.length > numberOfItems) {
                                                                    that.data = that.data.slice(0, numberOfItems);
                                                                    that.$scope.allItemsLoaded = false;
                                                                }
                                                                that.$scope.numberOfItems = that.data.length;
                                                                that.$scope.numberOfUnfilteredItems = that.data.length;
                                                                that.$scope.numberOfUnfilteredSelectableItems = that.data.filter(d => d.entity[that.$scope.editProperty]).length;
                                                                that.updateEntityObjects().then(() => {
                                                                    that.updateDataSource();
                                                                    that.calculateFooterAggregates();
                                                                    that.updateSelectedItems();
                                                                    that.$scope.itemsLoaded = true;
                                                                    that.$scope.htmlLoaded = true;
                                                                    that.$scope.lastRenderingDuration = moment().diff(that.$scope.lastExecutionStartTime, "ms") - that.$scope.lastExecutionDuration;
                                                                    var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                                                                    appInsightsService.trackEvent("render list", { "path": window.location.pathname }, { "loadTime": that.$scope.lastRenderingDuration });
                                                                    that.cofxBusyIndicatorService.removeJob(that.$scope, "renderdata");
                                                                });
                                                            }
                                                            else {
                                                                that.$scope.lastRenderingDuration = moment().diff(that.$scope.lastExecutionStartTime, "ms") - that.$scope.lastExecutionDuration;
                                                                var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                                                                appInsightsService.trackEvent("render list", { "path": window.location.pathname }, { "loadTime": that.$scope.lastRenderingDuration });
                                                                that.cofxBusyIndicatorService.removeJob(that.$scope, "renderdata");
                                                            }
                                                        }
                                                        catch (e) {
                                                            that.cofxBusyIndicatorService.removeJob(that.$scope, "renderdata");
                                                            throw e;
                                                        }
                                                    });
                                                    defer.resolve();
                                                }, (error) => {
                                                    that.cofxBusyIndicatorService.removeJob(that.$scope, "updatedata");
                                                    that.cofxBusyIndicatorService.removeJob(that.$scope, "renderdata");
                                                    defer.resolve();
                                                }).finally(() => that.$scope.isLoading = false);
                                            }
                                        }
                                    }).finally(() => {
                                        that.cofxBusyIndicatorService.removeJob(that.$scope, "updatedata");
                                    });
                                }
                            });
                        }, 0);
                    }
                    return defer.promise;
                }
                /**
                * Sets that.entityObjects to the data loaded from the web service grouped according to that.$scope.groupManager.groupState.
                */
                updateEntityObjects() {
                    var that = this;
                    var defer = that.$q.defer();
                    if (that.$scope.groupManager.groupState && that.$scope.groupManager.groupState.length > 0) {
                        var hotkeys = [
                            "cofx.data.list.true",
                            "cofx.data.list.false"
                        ];
                        that.$translate(hotkeys).then(translations => {
                            that.entityObjects = that.cofxArrayService.groupBy(that.data, that.$scope.groupManager.groupState, { trueText: translations["cofx.data.list.true"], falseText: translations["cofx.data.list.false"] });
                            that.flattenedEntityObjects = that.cofxArrayService.flatten(that.entityObjects);
                            defer.resolve();
                        });
                    }
                    else {
                        that.entityObjects = that.data;
                        that.flattenedEntityObjects = that.cofxArrayService.flatten(that.entityObjects);
                        defer.resolve();
                    }
                    return defer.promise;
                }
                getExpandLevel() {
                    var that = this;
                    // evaluate expand level
                    var expandToLevel = 0;
                    if (that.$scope.groupManager.groupState && that.$scope.groupManager.groupState.length > 0) {
                        if (!that.$scope.dataSourceInitialized) {
                            if (that.$scope.groupManager.groupState[that.$scope.groupManager.groupState.length - 1].autoExpand) {
                                expandToLevel = null;
                            }
                            else {
                                that.$scope.groupManager.groupState.forEach((group, level) => {
                                    if (group.autoExpand) {
                                        expandToLevel = level + 1;
                                    }
                                });
                            }
                        }
                        else {
                            expandToLevel = that.$scope.expandLevel;
                        }
                    }
                    return expandToLevel;
                }
                /**
                * Sorts the displyedEntityObjects and uses them as datasource for the grid.
                */
                updateDataSource() {
                    var that = this;
                    if (that.$scope.destroyed) {
                        return;
                    }
                    that.saveGridState();
                    that.removeTooltipFromGrid(".k-grid");
                    // filter items
                    var filteredDataSource = that.getFilteredItems();
                    // calculate aggregates for footer
                    that.calculateAggregates(filteredDataSource.filter(item => item.level == 0));
                    // sort items
                    if (that.$scope.sortState) {
                        var sortColumns = that.$scope.columns.filter(c => c.field == that.$scope.sortState.field);
                        if (sortColumns.length > 0) {
                            var sortColumn = sortColumns[0];
                            filteredDataSource = that.cofxArrayService.sort(filteredDataSource, sortColumn, that.$scope.groupManager.groupState, that.$scope.sortState.dir);
                        }
                    }
                    var pageSize = 50;
                    if (that.$scope.pageSize) {
                        pageSize = that.$scope.pageSize;
                    }
                    if (that.$scope.grid.pager) {
                        var page = that.$scope.grid.pager.page();
                        if (page) {
                            that.currentPage = that.$scope.grid.pager.page();
                        }
                        pageSize = that.$scope.grid.pager.pageSize();
                        if (pageSize == 0) {
                            if (that.$scope.pageSize) {
                                pageSize = that.$scope.pageSize;
                            }
                            else {
                                pageSize = 50;
                            }
                        }
                        else if (pageSize != 50 && pageSize != 100 && pageSize != 200) {
                            pageSize = filteredDataSource.length;
                        }
                        while (that.currentPage > 1 && (that.currentPage - 1) * pageSize >= filteredDataSource.length) {
                            that.currentPage--;
                        }
                    }
                    else {
                        this.currentPage = 0;
                    }
                    // set datasource of grid
                    var dataSource = kendo.data.DataSource.create({
                        data: filteredDataSource,
                        aggregate: that.$scope.aggregate,
                        pageSize: that.$scope.grid.options.scrollable.virtual == true ? Math.round(window.screen.height / 30) : pageSize,
                        page: that.currentPage,
                        change: (e) => {
                            if (!e.field || e.field != "changedPropertyNamesSinceLastSave") {
                                that.$scope.dataItems = dataSource.data().map(item => item);
                                if (that.$scope.allRowsEditable) {
                                    that.$scope.validationManager.updateWatchExpression(e.items);
                                }
                            }
                        }
                    });
                    that.currentPage = null;
                    try {
                        that.$scope.grid.setDataSource(dataSource);
                    }
                    catch (error) {
                        var errorText = "Could not initialize data source: " + JSON.stringify(error);
                        that.$log.error(errorText);
                        if (error) {
                            var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                            messageService.error("couldnotinitializedatasource", "Could not Initialize Data Source", errorText, error);
                        }
                    }
                    that.loadGridState();
                    that.updateGroupableColumns();
                    that.updateSortIndicator();
                    that.updateGridTooltips();
                    that.updateSelectAllStatus();
                    that.$scope.dataSourceInitialized = true;
                    if (!that.$scope.initialGroupState) {
                        that.$scope.initialGroupState = this.$scope.groupManager.groupState.slice();
                    }
                    that.$timeout(() => that.checkImages());
                    that.dataLoaded(that.$scope.grid);
                }
                checkImages() {
                    // check if images are loaded
                    var that = this;
                    if (!that.$scope.grid || !that.$scope.grid.wrapper) {
                        return;
                    }
                    var newNumberOfUnloadedImages = that.$scope.grid.wrapper.find("img").toArray().filter((img) => !img.complete).length;
                    if (newNumberOfUnloadedImages > 0) {
                        that.$timeout(() => that.checkImages(), 500);
                    }
                    that.numberOfUnloadedImages = newNumberOfUnloadedImages;
                }
                updateGridTooltips() {
                    this.addTooltipToGrid(".k-grid", "th[role=columnheader], td[role=gridcell]");
                    this.updateRowSelectorTooltip();
                }
                updateRowSelectorTooltip() {
                    this.$translate("cofx.data.list.selectUnselectAllItems").then(value => {
                        this.addTooltipToGrid(".k-grid", "th.cofx-row-selector", value);
                    });
                }
                getFilteredItems() {
                    var that = this;
                    that.setDataSourceExpandLevel(that.getExpandLevel());
                    var entityObjects = [];
                    var lastExpandLevel = -1;
                    var lastLevel = 0;
                    var lastGroups = [];
                    var lastGroupsAdded = false;
                    var itemCount = 0;
                    that.flattenedEntityObjects.forEach(item => {
                        if (item.isGroup) {
                            if (item.level < lastLevel) {
                                lastGroups = lastGroups.slice(0, lastGroups.length - (lastLevel - item.level));
                            }
                            lastGroups.push(item);
                            lastGroupsAdded = false;
                            item.numberOfItems = 0;
                            item.filteredItems = [];
                            if (!item.isExpanded && that.listContains(that.expandedItems, item)) {
                                item.isExpanded = true;
                            }
                            else if (item.isExpanded && that.listContains(that.collapsedItems, item)) {
                                item.isExpanded = false;
                            }
                        }
                        if (!item.isGroup && that.itemContainsSearchExpression(item, that.$scope.fullTextSearchExpression)) {
                            var visible = true;
                            if (lastGroups.length > 0) {
                                if (!lastGroupsAdded) {
                                    var index = 0;
                                    var isCollapsed = false;
                                    lastGroups.forEach(group => {
                                        if (!isCollapsed && entityObjects.indexOf(group) < 0) {
                                            entityObjects.push(group);
                                        }
                                        isCollapsed = isCollapsed || !group.isExpanded;
                                    });
                                    lastGroupsAdded = true;
                                }
                                lastGroups.forEach(groupItem => {
                                    groupItem.numberOfItems++;
                                    groupItem.filteredItems.push(item);
                                    visible = visible && groupItem.isExpanded;
                                });
                            }
                            if (visible) {
                                entityObjects.push(item);
                            }
                            itemCount++;
                        }
                        if (item.isGroup) {
                            if (item.isExpanded) {
                                lastExpandLevel = item.level;
                            }
                            else {
                                lastExpandLevel = item.level - 1;
                            }
                        }
                        lastLevel = item.level;
                    });
                    that.flattenedEntityObjects.filter(item => item.isGroup).forEach(item => {
                        that.$scope.groupManager.groupState[item.level].aggregates.forEach(aggregate => {
                            var fieldParts = aggregate.field.split(".");
                            var currentItem = item;
                            for (var i = 0; i < fieldParts.length - 1; i++) {
                                if (currentItem[fieldParts[i]] === undefined) {
                                    var newObject = {};
                                    currentItem[fieldParts[i]] = newObject;
                                    currentItem = newObject;
                                }
                                else {
                                    currentItem = currentItem[fieldParts[i]];
                                }
                            }
                            currentItem[fieldParts[fieldParts.length - 1]] = that.cofxArrayService.aggregate(item.filteredItems, aggregate.aggregateField ? aggregate.aggregateField : aggregate.field, aggregate.aggregate);
                        });
                    });
                    that.$scope.numberOfItems = itemCount;
                    return entityObjects;
                }
                itemContainsSearchExpression(item, searchExpression) {
                    if (!searchExpression) {
                        return true;
                    }
                    var that = this;
                    var isMatch = false;
                    that.$scope.columns.forEach((column) => {
                        if (column.tcDataType && column.field && column.tcDataType == "String") {
                            var properties = column.field.split(".");
                            var value = item;
                            properties.forEach((property) => {
                                if (value) {
                                    value = value[property];
                                }
                            });
                            if (value || angular.isString(value)) {
                                isMatch = isMatch || (value && value.toString().toLowerCase().indexOf(searchExpression.toLowerCase()) >= 0);
                            }
                        }
                    });
                    return isMatch;
                }
                setDataSourceExpandLevel(expandToLevel) {
                    var that = this;
                    that.$scope.expandLevel = expandToLevel;
                    if (that.$scope.groupManager.groupState && that.$scope.groupManager.groupState.length > 0) {
                        that.flattenedEntityObjects.forEach((item) => {
                            if (item.isGroup) {
                                item.isExpanded = (expandToLevel === null || expandToLevel === undefined) || item.level < expandToLevel;
                            }
                        });
                    }
                }
                updateExpandLevel(expandToLevel) {
                    var that = this;
                    that.expandedItems = [];
                    that.collapsedItems = [];
                    that.$scope.expandLevel = expandToLevel;
                    that.updateDataSource();
                }
                listContains(listOfItems, item) {
                    var that = this;
                    return that.getIndexInList(listOfItems, item) >= 0;
                }
                getIndexInList(listOfItems, item) {
                    var filteredItems = listOfItems.filter(eo => eo.ObjectUuid == item.ObjectUuid && eo.level == item.level && eo.fullHeader == item.fullHeader);
                    if (filteredItems.length > 0) {
                        return listOfItems.indexOf(filteredItems[0]);
                    }
                    return -1;
                }
                /**
                * Calculates the footer aggregates after reloading data.
                */
                calculateAggregates(items) {
                    var that = this;
                    var gridColumns = that.$scope.grid.columns;
                    if (gridColumns.length == 0 && that.$scope.columns.length > 0) {
                        gridColumns = that.$scope.columns;
                    }
                    that.$scope.aggregate.forEach((aggregate) => {
                        var columns = gridColumns.filter((column) => column.field == aggregate.field);
                        if (columns.length > 0) {
                            var index = gridColumns.indexOf(columns[0]);
                            var value = that.cofxArrayService.aggregate(items, aggregate.field, aggregate.aggregate);
                            aggregate.formattedValue = kendo.toString(value, columns[0].format.replace(/{0:/, '').replace(/}/, ''));
                        }
                    });
                }
                /**
                * Calculates the displayed footer aggregates as kendo changes them during scrolling to their own calculates aggregates,
                * which are wrong because we add the group rows to the normal result rows.
                */
                calculateFooterAggregates() {
                    var that = this;
                    that.$scope.footerAggregates = null;
                    that.$scope.grid.wrapper.removeClass("cofx-grouped-grid");
                    if (that.$scope.groupManager.groupState.length > 0 && that.$scope.grid && that.$scope.grid.footer) {
                        var footerRow = that.$scope.grid.footer.find("tr.k-footer-template");
                        footerRow.addClass("cofx-grouped-list-footer");
                        if (footerRow.length > 0) {
                            that.$scope.footerAggregates = [];
                            that.$scope.grid.wrapper.addClass("cofx-grouped-grid");
                            var footerCells = $(footerRow).find("td");
                            var gridColumns = that.$scope.grid.columns;
                            if (gridColumns.length == 0 && that.$scope.columns.length > 0) {
                                gridColumns = that.$scope.columns;
                            }
                            that.$scope.aggregate.forEach((aggregate) => {
                                var columns = gridColumns.filter((column) => column.field === aggregate.field);
                                if (columns.length > 0) {
                                    var index = gridColumns.indexOf(columns[0]);
                                    if (footerCells.length > index) {
                                        that.$scope.footerAggregates[index] = aggregate.formattedValue;
                                    }
                                }
                            });
                        }
                        this.displayFooterAggregates();
                    }
                }
                /**
                 * Displays the footer aggregates as kendo changes them during scrolling to their own calculates aggregates,
                 * which are wrong because we add the group rows to the normal result rows.
                 */
                displayFooterAggregates() {
                    var that = this;
                    if (that.$scope.footerAggregates && that.$scope.grid.footer) {
                        var footerRow = that.$scope.grid.footer.find("tr.k-footer-template");
                        if (footerRow.length > 0) {
                            var footerCells = $(footerRow).find("td");
                            that.$scope.footerAggregates.forEach((aggregate, index) => {
                                if (that.$scope.footerAggregates[index]) {
                                    var cell = footerCells.eq(index).children("div");
                                    cell.addClass("footerCalculated");
                                    cell.text(aggregate);
                                }
                            });
                        }
                    }
                }
                /**
                * Try to find the currrently selected items in the grid and mark them as selected.
                */
                updateSelectedItems() {
                    var that = this;
                    if (that.$scope.selectedItems) {
                        var itemsToRemove = [];
                        // select items in grid
                        var availableObjectUuids = that.flattenedEntityObjects.filter(e => this.getUuid(e)).map(e => this.getUuid(e));
                        that.$scope.selectedItems.forEach((item) => {
                            if (!that.selectItem(item, true, availableObjectUuids)) {
                                itemsToRemove.push(item);
                            }
                        });
                        // remove items that are not available in grid from selected items collection
                        itemsToRemove.forEach((item) => {
                            var index = that.$scope.selectedItems.indexOf(item);
                            if (index >= 0) {
                                that.$scope.selectedItems = that.$scope.selectedItems.splice(index + 1, 1);
                            }
                        });
                    }
                }
                /**
                * Try to find the specified item in the grid and mark them as selected.
                */
                selectItem(item, addToSelection, availableObjectUuids) {
                    var that = this;
                    if (availableObjectUuids.indexOf(this.getUuid(item)) > -1) {
                        return true;
                    }
                    return false;
                }
                openForm(url, editFormName, editModelEntityName, editModelEntityFriendlyName, editFormExpression, uuid, clone, useFilterDefaultValues, defaultValues) {
                    var that = this;
                    that.removeFocus();
                    if (useFilterDefaultValues) {
                        if (!defaultValues) {
                            defaultValues = {};
                        }
                        defaultValues = $.extend(defaultValues, that.buildDefaultValues());
                    }
                    // TODO: fix hyperlinks to forms
                    that.cofxEditEntityService.edit(uuid, url, editFormName, editFormExpression, editModelEntityName, editModelEntityFriendlyName, defaultValues, clone, undefined, undefined)
                        .then((changed) => {
                        if (changed) {
                            if (changed.hasChanges) {
                                that.applyFilter(true);
                            }
                            that.setFocus();
                        }
                    });
                }
                deleteObjects() {
                    var that = this;
                    if (that.$scope.canDelete()) {
                        that.removeFocus();
                        var objectUuids = [];
                        for (var i = 0; i < that.$scope.selectedItems.length; i++) {
                            var objectUuid = that.getProperty(that.$scope.selectedItems[i], that.$scope.editProperty);
                            objectUuids.push(objectUuid);
                        }
                        that.cofxEditEntityService.delete(that.$scope, that.$scope.editModelEntityName, objectUuids)
                            .then((changed) => {
                            if (changed) {
                                that.applyFilter(true);
                            }
                        }).finally(() => {
                            that.setFocus();
                        });
                    }
                }
                loadAllRows() {
                    var that = this;
                    that.$scope.loadAllRowsFlag = true;
                    that.applyFilter(true);
                }
                saveGridState() {
                    // TODO: group status (expanded / collapsed), selected items
                    var that = this;
                    if (that.$scope.dataSourceInitialized) {
                        that.$scope.columnState = that.$scope.grid.columns;
                        if (that.$scope.grid.wrapper) {
                            var verticalScrollbar = that.$scope.grid.wrapper.find(".k-scrollbar");
                            if (verticalScrollbar.length > 0) {
                                that.$scope.verticalScrollbarState = verticalScrollbar.scrollTop();
                            }
                            var horizontalScrollbar = that.$scope.grid.wrapper.find(".k-virtual-scrollable-wrap");
                            if (horizontalScrollbar.length > 0) {
                                that.$scope.horizontalScrollbarState = horizontalScrollbar.scrollLeft();
                            }
                            var autoScrollable = that.$scope.grid.wrapper.find(".k-grid-content.k-auto-scrollable");
                            if (autoScrollable.length > 0) {
                                that.$scope.autoScrollableStateLeft = autoScrollable.scrollLeft();
                                that.$scope.autoScrollableStateTop = autoScrollable.scrollTop();
                            }
                        }
                    }
                }
                loadGridState() {
                    var that = this;
                    var columns = that.$scope.columns;
                    if (that.$scope.dataSourceInitialized) {
                        columns = that.$scope.columnState;
                    }
                    // set column state
                    columns[0].width = that.$scope.groupManager.groupState.length > 0 ? that.$scope.groupManager.groupState.length * 30 + 10 : 1;
                    if (!that.$scope.dataSourceInitialized) {
                        that.hideGroupedColumns(columns);
                    }
                    that.$scope.grid.setOptions({ columns: columns, columnMenu: true });
                    that.$scope.grid.dataSource.fetch();
                    // set scrollbar position
                    if (that.$scope.dataSourceInitialized) {
                        var verticalScrollbar = that.$scope.grid.wrapper.find(".k-scrollbar");
                        if (verticalScrollbar.length > 0) {
                            verticalScrollbar.scrollTop(that.$scope.verticalScrollbarState);
                        }
                        var horizontalScrollbar = that.$scope.grid.wrapper.find(".k-virtual-scrollable-wrap");
                        if (horizontalScrollbar.length > 0) {
                            horizontalScrollbar.scrollLeft(that.$scope.horizontalScrollbarState);
                        }
                        var autoScrollable = that.$scope.grid.wrapper.find(".k-grid-content.k-auto-scrollable");
                        if (autoScrollable.length > 0) {
                            autoScrollable.scrollLeft(that.$scope.autoScrollableStateLeft);
                            autoScrollable.scrollTop(that.$scope.autoScrollableStateTop);
                        }
                    }
                }
                hideGroupedColumns(columns) {
                    var that = this;
                    columns.forEach((c) => {
                        var hidden = that.$scope.groupManager.groupState.filter((g) => g.field == c.field && !g.showWhenGrouped).length > 0 && !c.tcEditable;
                        if (!hidden && c.hidden) {
                            that.$scope.grid.showColumn(c.field);
                        }
                        c.hidden = hidden;
                    });
                }
                loadParameters() {
                    var that = this;
                    var parameterString = that.$location.search().parameters;
                    if (parameterString) {
                        var parameters = parameterString.split("&");
                        parameters.forEach(p => {
                            var parameter = p.split("=");
                            var name = parameter[0];
                            var value = null;
                            if (parameter.length > 1 && parameter[1]) {
                                value = urlDecode(parameter[1]);
                            }
                            var filters = that.$scope.filters.filter(f => f.filterParameterName == name);
                            if (filters.length > 0) {
                                that.$scope.filterEntity[filters[0].filterName] = that.httpService.transformResponseValue(value);
                                if (!that.$scope.filterEntity.appliedFilterParameters) {
                                    that.$scope.filterEntity.appliedFilterParameters = [];
                                }
                                that.$scope.filterEntity.appliedFilterParameters.push(name);
                            }
                            // TODO: handle RelationCells with FilterValue property
                        });
                    }
                }
                canAdd() {
                    var that = this;
                    return that.$scope.allowAdd;
                }
                canEdit() {
                    var that = this;
                    var canEdit = false;
                    if (that.$scope.selectedItems) {
                        var canEdit = that.$scope.allowEdit && that.$scope.selectedItems.length == 1;
                        canEdit = canEdit && that.isGuid(that.getProperty(that.$scope.selectedItems[0], that.$scope.editProperty));
                    }
                    return canEdit;
                }
                canDelete() {
                    var that = this;
                    var canDelete = false;
                    if (that.$scope.selectedItems) {
                        canDelete = that.$scope.allowDelete && that.$scope.selectedItems.length >= 1;
                        var guidValid = true;
                        that.$scope.selectedItems.forEach((item) => {
                            guidValid = guidValid && that.isGuid(that.getProperty(item, that.$scope.editProperty));
                            guidValid = guidValid && !that.isReadOnly(item);
                        });
                    }
                    return canDelete && guidValid;
                }
                canCopy() {
                    var that = this;
                    var canCopy = false;
                    if (that.$scope.selectedItems) {
                        canCopy = that.$scope.allowCopy && that.$scope.selectedItems.length == 1 && that.$scope.editFormName !== 'TimeCockpit.UI.Import.ImportDefinitionView';
                        var guidValid = true;
                        that.$scope.selectedItems.forEach((item) => {
                            guidValid = guidValid && that.isGuid(that.getProperty(item, that.$scope.editProperty));
                        });
                    }
                    return canCopy && guidValid;
                }
                isReadOnly(item) {
                    var that = this;
                    if (that.$scope.readOnlyExpression) {
                        var value = item;
                        var path = that.$scope.readOnlyExpression.split(".");
                        path.forEach((pathItem) => {
                            if (value) {
                                value = value[pathItem];
                            }
                        });
                        if (typeof (value) === "boolean") {
                            return value;
                        }
                        return false;
                    }
                    else {
                        return that.$scope.readOnly;
                    }
                }
                isGuid(guid) {
                    return guid && angular.isString(guid) && guid != CockpitFramework.Guid.empty && ListController.guidPattern.test(guid);
                }
                getProperty(item, property) {
                    var result = item.entity;
                    property.split(".").forEach((value, index, array) => {
                        if (result) {
                            result = result[value];
                        }
                    });
                    return result;
                }
                removeTooltipFromGrid(selector) {
                    var that = this;
                    if (that.$scope.dataSourceInitialized) {
                        try {
                            $(selector).kendoTooltip("destroy");
                        }
                        catch (error) {
                        }
                    }
                }
                addTooltipToGrid(selector, filter, tooltipContent) {
                    $(selector).kendoTooltip({
                        filter: filter,
                        content: (e) => {
                            var text = "";
                            var target = e.target;
                            var tooltip = e.sender;
                            if (tooltipContent) {
                                text = tooltipContent;
                            }
                            else {
                                var element = target[0];
                                while (element.children && element.children.length > 0) {
                                    element = element.children[0];
                                }
                                if (element.nodeName == "A" && !element.className) {
                                    element = element.parentElement;
                                }
                                if (element.offsetWidth < element.scrollWidth) {
                                    var $sanitize = CockpitFramework.Application.ApplicationService.getInjector().get("$sanitize");
                                    text = $sanitize(target.text()).replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;').replace(/</g, '&lt;').replace(/\\>/g, '&gt;').replace(/(\\r\\n|\\r|\\n)/g, '<br/>');
                                }
                                tooltip.popup.unbind("open");
                                tooltip.popup.bind("open", function (arg) {
                                    tooltip.refreshTooltip = false;
                                    if (!text) {
                                        arg.preventDefault();
                                    }
                                    else if (text != $(target).text()) {
                                        tooltip.refreshTooltip = true;
                                    }
                                });
                            }
                            return text;
                        }
                    });
                }
                filterToggled(expanded) {
                    var that = this;
                    that.$timeout(() => {
                        if (expanded) {
                            CockpitFramework.Controls.FormHelperFunctions.setFocusedElement($(that.$scope.grid.table).parents(".cofx-list"));
                        }
                        else {
                            if (that.$scope && that.$scope.grid) {
                                var parents = $(that.$scope.grid.table).parents(".cofx-list");
                                if (parents.length > 0) {
                                    var input = parents.find("input,select,textarea");
                                    if (input.length > 0) {
                                        input[0].blur();
                                    }
                                }
                            }
                        }
                    }, 100);
                }
                toggleColumnVisibility(column) {
                    var that = this;
                    if (column.hidden) {
                        that.$scope.grid.showColumn(column.field);
                    }
                    else {
                        that.$scope.grid.hideColumn(column.field);
                    }
                    column.hidden = !column.hidden;
                    this.$scope.hasConfigurationProfileChanges = true;
                }
                toggleRow(item) {
                    var that = this;
                    if (that.$scope.grid.pager) {
                        this.currentPage = that.$scope.grid.pager.page();
                    }
                    else {
                        this.currentPage = 0;
                    }
                    if (item.isExpanded) {
                        that.collapseRow(item);
                    }
                    else {
                        that.expandRow(item);
                    }
                }
                expandRow(item) {
                    var that = this;
                    that.cofxBusyIndicatorService.addJob(that.$scope, "expandRow", "Expand row");
                    that.$timeout(() => {
                        try {
                            var rows = that.flattenedEntityObjects.filter(eo => eo.ObjectUuid == item.ObjectUuid && eo.level == item.level && eo.fullHeader == item.fullHeader);
                            if (rows.length > 0) {
                                var row = rows[0];
                                var indexInList = that.getIndexInList(that.collapsedItems, item);
                                if (indexInList >= 0) {
                                    that.collapsedItems.splice(indexInList, 1);
                                }
                                else {
                                    that.expandedItems.push(row);
                                }
                            }
                            that.updateDataSource();
                        }
                        finally {
                            that.cofxBusyIndicatorService.removeJob(that.$scope, "expandRow");
                        }
                    });
                }
                collapseRow(item) {
                    var that = this;
                    that.cofxBusyIndicatorService.addJob(that.$scope, "collapseRow", "Collapse row");
                    that.$timeout(() => {
                        // update changed items
                        if (that.$scope.allRowsEditable) {
                            that.$scope.grid.dataSource.data().forEach((item) => {
                                if (item.changedPropertyNamesSinceLastSave && item.changedPropertyNamesSinceLastSave.length > 0) {
                                    var rows = that.flattenedEntityObjects.filter(eo => eo.isGroup == false && this.getUuid(eo) == this.getUuid(item));
                                    if (rows.length > 0) {
                                        rows[0].entity = item.entity;
                                        rows[0].changedPropertyNamesSinceLastSave = item.changedPropertyNamesSinceLastSave;
                                    }
                                }
                            });
                        }
                        try {
                            var rows = that.flattenedEntityObjects.filter(eo => eo.ObjectUuid == item.ObjectUuid && eo.level == item.level && eo.fullHeader == item.fullHeader);
                            if (rows.length > 0) {
                                var row = rows[0];
                                var indexInList = that.getIndexInList(that.expandedItems, item);
                                if (indexInList >= 0) {
                                    that.expandedItems.splice(indexInList, 1);
                                }
                                else {
                                    that.collapsedItems.push(row);
                                }
                            }
                            that.updateDataSource();
                        }
                        finally {
                            that.cofxBusyIndicatorService.removeJob(that.$scope, "collapseRow");
                        }
                    });
                }
                groupsChanged(expandLevel) {
                    var that = this;
                    if (!expandLevel) {
                        expandLevel = that.getExpandLevel();
                    }
                    that.expandedItems = [];
                    that.collapsedItems = [];
                    that.updateEntityObjects().then(() => {
                        that.updateExpandLevel(expandLevel);
                    });
                    that.$scope.hasConfigurationProfileChanges = true;
                }
                actionExecuted(result) {
                    var that = this;
                    that.applyFilter(true);
                    that.setFocus();
                }
                updateGroupableColumns() {
                    var that = this;
                    that.$scope.groupableColumns = angular.copy(that.$scope.columns)
                        .filter((c) => {
                        return c.title != null && c.title.trim() != ""; // && that.$scope.groupManager.groupState.filter(g => g.field == c.field).length == 0;
                    })
                        .sort((a, b) => {
                        if (a.title > b.title) {
                            return 1;
                        }
                        else {
                            return -1;
                        }
                        ;
                    });
                }
                sortItems(field) {
                    var that = this;
                    var columns = that.$scope.columns.filter(c => c.field == field);
                    if (columns.length > 0) {
                        var column = columns[0];
                        if (column.tcSortable) {
                            that.cofxBusyIndicatorService.addJob(that.$scope, "sortColumn", "Sort column");
                            that.$timeout(() => {
                                try {
                                    var dir = "asc";
                                    if (that.$scope.sortState && field == that.$scope.sortState.field) {
                                        if (that.$scope.sortState.dir == "asc") {
                                            dir = "desc";
                                        }
                                        else if (that.$scope.sortState.dir == "desc") {
                                            dir = "";
                                        }
                                    }
                                    that.$scope.sortState = { field: field, dir: dir };
                                    that.updateDataSource();
                                }
                                finally {
                                    that.cofxBusyIndicatorService.removeJob(that.$scope, "sortColumn");
                                }
                            }, 10);
                        }
                    }
                }
                updateSortIndicator() {
                    var that = this;
                    that.$scope.grid.thead.find("th").removeClass("cofx-list-header-asc cofx-list-header-desc");
                    if (that.$scope.sortState && that.$scope.sortState.dir && that.$scope.sortState.field) {
                        var header = $(that.$scope.grid.thead.find("th[data-field='" + that.$scope.sortState.field + "']"));
                        if (that.$scope.sortState.dir == "asc") {
                            header.addClass("cofx-list-header-asc");
                        }
                        else if (that.$scope.sortState.dir == "desc") {
                            header.addClass("cofx-list-header-desc");
                        }
                    }
                }
                showHtml() {
                    var that = this;
                    that.$scope.viewMode = Data.ListViewMode.List;
                    var listContainer = that.$scope.rootElement.find(".list-container");
                    listContainer[0].style.gridTemplateRows = "auto auto auto auto 1fr";
                    var frameContainer = that.$scope.rootElement.find("#cofx-list-result-iframe-container");
                    frameContainer[0].style.height = "0";
                    that.$scope.views.forEach(v => {
                        v.isActive = false;
                    });
                    if (!that.$scope.htmlLoaded) {
                        that.applyFilter(true);
                    }
                }
                showPdf(view, inline = false) {
                    var that = this;
                    if (!inline && !that.$scope.showRawReport) {
                        that.downloadReport(view, "pdf", inline);
                    }
                    else {
                        var frameContainer = that.$scope.rootElement.find("#cofx-list-result-iframe-container");
                        if (!view.loaded) {
                            var frameName = "cofx-list-report-iframe-" + view.uuid + "-" + Date.now().toString();
                            if (!that.$scope.showRawReport) {
                                var iframe = document.createElement("iframe");
                                iframe.id = frameName;
                                iframe.name = frameName;
                                iframe.className = "cofx-list-report-iframe";
                                var viewIndex = that.$scope.views.indexOf(view);
                                iframe.setAttribute("ng-hide", "!views[" + viewIndex.toString() + "].isActive");
                                frameContainer.append(iframe);
                                that.$compile(iframe)(that.$scope);
                            }
                            var impersonationUsername = CockpitFramework.Application.ApplicationService.getCurrentApplication().impersonationUsername;
                            that.$scope.reportForm.attr("action", "/report/show?format=pdf" + (impersonationUsername ? "&cofx-impersonated-account=" + impersonationUsername : ""));
                            if (that.$scope.showRawReport) {
                                that.$scope.reportForm.attr("target", "_self");
                            }
                            else {
                                that.$scope.reportForm.attr("target", frameName);
                            }
                            that.submitReportForm(view, inline);
                            view.loaded = true;
                        }
                        frameContainer[0].style.height = "100%";
                        var listContainer = that.$scope.rootElement.find(".list-container");
                        listContainer[0].style.gridTemplateRows = "auto auto auto 1fr auto";
                        that.$scope.views.forEach(v => {
                            v.isActive = false;
                        });
                        if (inline) {
                            that.$scope.viewMode = Data.ListViewMode.Pdf;
                            view.isActive = true;
                        }
                    }
                }
                showExcel(view, inline = false) {
                    var that = this;
                    if (inline && !that.$scope.showRawReport) {
                        that.$scope.viewMode = Data.ListViewMode.Excel;
                    }
                    that.downloadReport(view, "excelopenxml", inline);
                }
                showWord(view, inline = false) {
                    var that = this;
                    if (inline && !that.$scope.showRawReport) {
                        that.$scope.viewMode = Data.ListViewMode.Word;
                    }
                    that.downloadReport(view, "wordopenxml", inline);
                }
                downloadReport(view, format, inline) {
                    var that = this;
                    // TODO: find way to detect when report has been downloaded
                    // that.cofxBusyIndicatorService.addJob(that.$scope, "openReport", "Open report");
                    var impersonationUsername = CockpitFramework.Application.ApplicationService.getCurrentApplication().impersonationUsername;
                    that.$scope.reportForm.attr("action", "/report/show?format=" + format + (impersonationUsername ? "&cofx-impersonated-account=" + impersonationUsername : ""));
                    that.$scope.reportForm.attr("target", "_self");
                    that.submitReportForm(view, inline);
                    var contextMenu = $(".cofx-list-export-context-menu div").closest(".cofx-list-context-menu-root").data("kendoContextMenu");
                    if (contextMenu) {
                        contextMenu.close();
                    }
                }
                submitReportForm(view, inline) {
                    var that = this;
                    var request = null;
                    var parameters = that.getFilterParameters();
                    var queryFilters = that.getQueryFilters();
                    var contentDisposition = (that.$scope.showRawReport || inline ? "inline" : "attachment");
                    var filterEntityObject = angular.copy(that.$scope.filterEntity);
                    if (filterEntityObject.appliedFilterParameters) {
                        delete filterEntityObject.appliedFilterParameters;
                    }
                    if (!that.$scope.isScriptSourceList && that.$scope.query) {
                        request = { listname: that.$scope.listName, query: that.$scope.query, parameters: that.getFilterParameters(), filters: that.getQueryFilters(), filterEntityObject: filterEntityObject, condition: that.getCondition(), contentDisposition: contentDisposition };
                    }
                    else if (that.$scope.isScriptSourceList && that.$scope.listName) {
                        request = { listname: that.$scope.listName, parameters: that.getFilterParameters(), filterEntityObject: filterEntityObject, contentDisposition: contentDisposition };
                    }
                    request.groupState = that.$scope.groupManager.groupState;
                    request.reportuuid = view.uuid;
                    // get accent color
                    let mainColor = '#25a0da';
                    const themeColorMeta = document.querySelector('meta[name=theme-color]');
                    if (themeColorMeta) {
                        const color = themeColorMeta.getAttribute('content');
                        if (color) {
                            mainColor = themeColorMeta.getAttribute('content');
                        }
                    }
                    request.configuration = { Title: that.$scope.title, MainColor: mainColor };
                    convertToODataObject(request.parameters);
                    convertToODataObject(request.filters, ["operand"]);
                    that.$scope.reportForm.find("#data").val(JSON.stringify(that.httpService.transformRequestObject(request)));
                    that.$scope.reportForm.submit();
                    that.cofxBusyIndicatorService.removeJob(that.$scope, "loadreport");
                    var translateKeyTitle = "cofx.data.list.downloadStartedTitle";
                    var translateKey = "cofx.data.list.downloadStarted";
                    if (inline) {
                        translateKey = "cofx.data.list.downloadStartedInline";
                    }
                    var notificationService = CockpitFramework.Application.ApplicationService.getInjector().get("notificationService");
                    notificationService.info(translateKeyTitle, translateKey, null, "downloadStarted", null, { timeOut: 5000, showProgressBar: false });
                }
                groupRowOperation(e) {
                    var that = this;
                    var level = undefined;
                    var scope = that.$scope.$root.groupOperationScope;
                    if (!scope) {
                        scope = that.$scope;
                    }
                    if (scope.groupOperationTarget) {
                        level = $(scope.groupOperationTarget).find(".cofx-group-header-title").data("level");
                    }
                    if (level !== undefined) {
                        var operation = $(e.item).find("i").data("operation");
                        switch (operation) {
                            case "collapse":
                                scope.collapseGroup(level);
                                this.$scope.hasConfigurationProfileChanges = true;
                                break;
                            case "expand":
                                scope.collapseGroup(level + 1);
                                this.$scope.hasConfigurationProfileChanges = true;
                                break;
                            case "movedown":
                                scope.groupManager.moveGroupDown(scope.groupManager.groupState[level]);
                                this.$scope.hasConfigurationProfileChanges = true;
                                break;
                            case "moveup":
                                scope.groupManager.moveGroupUp(scope.groupManager.groupState[level]);
                                this.$scope.hasConfigurationProfileChanges = true;
                                break;
                            case "remove":
                                var columns = scope.columns.filter((col) => col.field == scope.groupManager.groupState[level].field);
                                if (columns.length > 0 && columns[0].hidden) {
                                    that.toggleColumnVisibility(columns[0]);
                                }
                                scope.groupManager.removeGroup(scope.groupManager.groupState[level]);
                                scope.views.forEach((v) => v.loaded = false);
                                that.calculateFooterAggregates();
                                this.$scope.hasConfigurationProfileChanges = true;
                                break;
                        }
                    }
                    that.$scope.groupOperationTarget = null;
                    that.$scope.$root.groupOperationScope = null;
                }
                showFullTextSearch() {
                    var that = this;
                    if (that.$scope.rootElement) {
                        that.removeFocus(true);
                        that.$scope.rootElement.find(".cofx-list-full-text-search > input").focus();
                    }
                }
                resizeColumns() {
                    var that = this;
                    if (that.$scope.grid.dataSource.data().filter(item => !item.isGroup).length > 0) {
                        that.columnsResized = true;
                    }
                    that.cofxBusyIndicatorService.addJob(that.$scope, "autofitcolumns", "Adjust column size");
                    that.$timeout(() => {
                        if (!that.$scope.destroyed) {
                            that.columnResizeInProgress = true;
                            var columnsToAutoFit = [];
                            for (var i = 0; i < that.$scope.grid.columns.length; i++) {
                                if (that.$scope.grid.columns[i].tcAutoFitColumn && !that.$scope.grid.columns[i].tcColumnWidthAdjusted) {
                                    columnsToAutoFit.push(i);
                                }
                            }
                            that.autoFitColumns(columnsToAutoFit);
                            that.columnResizeInProgress = false;
                            that.cofxBusyIndicatorService.removeJob(that.$scope, "autofitcolumns");
                            // required to show scrollbar in backreference tabs of forms
                            that.$scope.grid.resize(true);
                        }
                    });
                }
                autoFitColumns(columnIndexes) {
                    var that = this, options = that.$scope.grid.options, columns = that.$scope.grid.columns, index, th, headerTable, lockedHeaderTable, unlockedHeaderTable, isLocked, 
                    // TODO: handle locked columns
                    ////visibleLocked = that.$scope.grid.lockedHeader ? leafDataCells(that.$scope.grid.lockedHeader.find(">table>thead")).filter(isCellVisible).length : 0,
                    visibleLocked = 0, col, contentDiv, scrollLeft, notGroupOrHierarchyCol = "col:not(.k-group-col):not(.k-hierarchy-col)", notGroupOrHierarchyVisibleCell = "td:visible:not(.k-group-cell):not(.k-hierarchy-cell)";
                    var columnsToResize = [];
                    var tables = $();
                    if (options.scrollable) {
                        contentDiv = that.$scope.grid.table.parent();
                        scrollLeft = contentDiv.scrollLeft();
                    }
                    var unlockedFooter = that.$scope.grid.footer.children(".k-grid-footer-wrap");
                    var lockedFooter = that.$scope.grid.footer.children(".k-grid-footer-locked");
                    if (that.$scope.grid.columns.filter(c => c.locked).length > 0) {
                        lockedHeaderTable = that.$scope.grid.lockedHeader.children("table");
                        tables = tables.add(lockedHeaderTable);
                    }
                    unlockedHeaderTable = that.$scope.grid.thead.parent();
                    tables = tables.add(unlockedHeaderTable);
                    columnIndexes.forEach(i => {
                        var column = columns[i];
                        if (!column || !that.isVisible(column)) {
                            return;
                        }
                        index = $.inArray(column, this.leafColumns(columns));
                        isLocked = column.locked;
                        if (isLocked) {
                            headerTable = lockedHeaderTable;
                        }
                        else {
                            headerTable = unlockedHeaderTable;
                        }
                        th = headerTable.find("[data-index=\"" + index + "\"]");
                        var contentTable = isLocked ? that.$scope.grid.lockedTable : that.$scope.grid.table, footer = that.$scope.grid.footer || $();
                        tables = tables.add(contentTable);
                        if (that.$scope.grid.footer && that.$scope.grid.lockedContent) {
                            footer = isLocked ? lockedFooter : unlockedFooter;
                        }
                        var footerTable = footer.find("table").first();
                        tables = tables.add(footerTable);
                        if (that.$scope.grid.lockedHeader && !isLocked) {
                            index -= visibleLocked;
                        }
                        for (var j = 0; j < columns.length; j++) {
                            if (columns[j] === column) {
                                break;
                            }
                            else {
                                if (columns[j].hidden) {
                                    index--;
                                }
                            }
                        }
                        if (options.scrollable) {
                            col = headerTable.find(notGroupOrHierarchyCol).eq(index).add(contentTable.children("colgroup").find(notGroupOrHierarchyCol).eq(index)).add(footerTable.find("colgroup").find(notGroupOrHierarchyCol).eq(index));
                        }
                        else {
                            col = contentTable.children("colgroup").find(notGroupOrHierarchyCol).eq(index);
                        }
                        var oldColumnWidth = th.outerWidth();
                        col.width("");
                        columnsToResize.push({ column: column, col: col, index: index, contentTable: contentTable, headerTable: headerTable, footerTable: footerTable, th: th });
                    });
                    tables.css("table-layout", "fixed");
                    columnsToResize.forEach(resizeColumn => {
                        resizeColumn.col.width("auto");
                    });
                    tables.addClass("k-autofitting");
                    tables.css("table-layout", "");
                    if (columnsToResize.length > 0) {
                        var contentRowCells = columnsToResize[0].contentTable.find("tr:not(.k-grouping-row)").eq(0).children(notGroupOrHierarchyVisibleCell);
                        var footerRowCells = columnsToResize[0].footerTable.find("tr").eq(0).children(notGroupOrHierarchyVisibleCell);
                        columnsToResize.forEach(resizeColumn => {
                            var newColumnWidth = resizeColumn.th.outerWidth();
                            if (contentRowCells.length > 0) {
                                newColumnWidth = Math.max(newColumnWidth, contentRowCells.eq(resizeColumn.index).outerWidth());
                            }
                            if (footerRowCells.length > 0) {
                                newColumnWidth = Math.max(newColumnWidth, footerRowCells.eq(resizeColumn.index).outerWidth());
                            }
                            newColumnWidth = Math.ceil(newColumnWidth) + 1;
                            if (newColumnWidth > 500) {
                                newColumnWidth = 500;
                            }
                            resizeColumn.col.width(newColumnWidth);
                            resizeColumn.column.width = newColumnWidth;
                        });
                    }
                    // TODO: check if neccessary when locking columns
                    ////if (options.scrollable) {
                    ////	// TODO: also required for locked header table
                    ////	var headerTable = that.$scope.grid.thead.parent();
                    ////	var cols = headerTable.find("col"), colWidth: string, totalWidth = 0;
                    ////	for (var idx = 0, length = cols.length; idx < length; idx += 1) {
                    ////		colWidth = cols[idx].style.width;
                    ////		if (colWidth && colWidth.indexOf("%") == -1) {
                    ////			totalWidth += parseInt(colWidth, 10);
                    ////		} else {
                    ////			totalWidth = 0;
                    ////			break;
                    ////		}
                    ////	}
                    ////	if (totalWidth) {
                    ////		tables.each((index, elem) => {
                    ////			elem.style.width = totalWidth + "px";
                    ////		});
                    ////	}
                    ////}
                    tables.removeClass("k-autofitting");
                    if (contentDiv && scrollLeft) {
                        contentDiv.scrollLeft(scrollLeft);
                    }
                    var grid = that.$scope.grid;
                    //that.$scope.grid.trigger(grid.COLUMNRESIZE, {
                    //	column: column,
                    //	oldWidth: oldColumnWidth,
                    //	newWidth: newColumnWidth
                    //});
                    //const wrapperWidth = grid.wrapper.find('.k-virtual-scrollable-wrap')[0].offsetWidth;
                    //const columnsWidth = grid.columns.slice(0, -1).map((c: any) => c.width).reduce((result: number, current: number) => result + current, 0);
                    //grid.columns[grid.columns.length - 1].width = wrapperWidth - columnsWidth;
                    //const gridTables = grid.wrapper.find('table');
                    //table.width = grid.columns.map((c: any) => c.width).reduce((result: number, current: number) => result + current, 0);
                    //gridTables[1].width = gridTables[0].width;
                    //console.log('table.width', gridTables[0].width, gridTables[1].width);
                    setTimeout(() => {
                        grid._applyLockedContainersWidth();
                        grid._syncLockedContentHeight();
                        grid._syncLockedHeaderHeight();
                    });
                }
                isVisible(column) {
                    return this.visibleColumns([column]).length > 0;
                }
                visibleColumns(columns) {
                    return $.grep(columns, function (column) {
                        var result = !column.hidden;
                        if (result && column.columns) {
                            result = this.visibleColumns(column.columns).length > 0;
                        }
                        return result;
                    });
                }
                leafColumns(columns) {
                    var result = [];
                    for (var idx = 0; idx < columns.length; idx++) {
                        if (!columns[idx].columns) {
                            result.push(columns[idx]);
                            continue;
                        }
                        result = result.concat(this.leafColumns(columns[idx].columns));
                    }
                    return result;
                }
                getChangedItems() {
                    var changedItems = this.$scope.dataItems.filter(i => i.changedPropertyNamesSinceLastSave && i.changedPropertyNamesSinceLastSave.length > 0);
                    var changedFlattenedItems = this.flattenedEntityObjects.filter(i => changedItems.filter(c => this.getUuid(c) == this.getUuid(i)).length == 0 && i.changedPropertyNamesSinceLastSave && i.changedPropertyNamesSinceLastSave.length > 0);
                    changedItems = changedItems.concat(changedFlattenedItems);
                    return changedItems;
                }
                getUuid(item) {
                    var that = this;
                    return (that.$scope.editProperty ? item.entity[that.$scope.editProperty] : item.entity.ObjectUuid);
                }
                registerHotkeys() {
                    var that = this;
                    if (that.$scope.registeredHotkeys.length) {
                        that.hotkeysService.add(that.$scope.registeredHotkeys);
                    }
                    else {
                        var hotkeys = [
                            "cofx.data.list.addItemTooltip",
                            "cofx.data.list.editItemTooltip",
                            "cofx.data.list.deleteItemTooltip",
                            "cofx.data.list.reloadDataTooltip",
                            "cofx.data.list.searchTooltip",
                            "cofx.keyboard.ctrl"
                        ];
                        that.$translate(hotkeys).then(translations => {
                            var ctrl = translations["cofx.keyboard.ctrl"];
                            if (!that.$scope.isIncludeList) {
                                that.$scope.registeredHotkeys.push(that.hotkeysService.createHotkey('return', translations["cofx.data.list.reloadDataTooltip"], (event, hotkeys) => that.$scope.applyFilter(true), ['INPUT', 'SELECT']));
                                that.$scope.registeredHotkeys.push(that.hotkeysService.createHotkey(ctrl + '+return', translations["cofx.data.list.reloadDataTooltip"], (event, hotkeys) => that.$scope.applyFilter(true)));
                            }
                            // TODO: move hotkey to Filter.ts
                            //CockpitFramework.Controls.FormHelperFunctions.registerHotkey(that.$scope, that.$scope.registeredHotkeys, that.hotkeys, "ctrl+q", "Show / hide filter area", that.$scope.toggleFilter);
                            that.$scope.registeredHotkeys.push(that.hotkeysService.createHotkey(ctrl + '+i', translations["cofx.data.list.addItemTooltip"], () => that.$scope.addObject()));
                            that.$scope.registeredHotkeys.push(that.hotkeysService.createHotkey(ctrl + '+e', translations["cofx.data.list.editItemTooltip"], () => that.$scope.editSelectedEntity()));
                            that.$scope.registeredHotkeys.push(that.hotkeysService.createHotkey(ctrl + '+f', translations["cofx.data.list.searchTooltip"], () => that.$scope.showFullTextSearch()));
                            that.$scope.registeredHotkeys.push(that.hotkeysService.createHotkey('del', translations["cofx.data.list.deleteItemTooltip"], () => that.$scope.deleteObjects()));
                            that.hotkeysService.add(that.$scope.registeredHotkeys);
                        });
                    }
                }
                preventSelection(e) {
                    e.preventDefault();
                    return false;
                }
                rowClick(event, that) {
                    if (event.target.nodeName == "INPUT") {
                        event.stopPropagation();
                        return;
                    }
                    that.$scope.$apply(() => {
                        if (event.target.parentElement.classList.contains("cofx-row-selector")) {
                            // handle selector
                            var dataItem = that.$scope.grid.dataItem(event.currentTarget);
                            if (dataItem) {
                                that.$timeout(() => {
                                    var clickedItem = that.$scope.selectedItems.filter(item => that.itemsAreEqual(item, dataItem));
                                    if (clickedItem.length) {
                                        that.$scope.selectedItems.splice(that.$scope.selectedItems.indexOf(clickedItem[0]), 1);
                                        that.unselectRow($(event.target).parents("tr").first());
                                    }
                                    else {
                                        that.$scope.selectedItems.push(dataItem);
                                        that.selectRow($(event.target).parents("tr").first());
                                    }
                                    if (that.$scope.change) {
                                        that.$scope.change(that.$scope.selectedItems);
                                    }
                                });
                                event.stopPropagation();
                            }
                        }
                        else if (event.target.parentElement.classList.contains("cofx-action-button")) {
                            event.stopPropagation();
                        }
                        else if (!event.target.classList.contains("cofx-group-header-context-menu")) {
                            // handle group rows
                            var dataItem = that.$scope.grid.dataItem(event.currentTarget);
                            if (dataItem && dataItem.isGroup) {
                                that.toggleRow(dataItem);
                                event.stopPropagation();
                            }
                            else {
                                if (event.ctrlKey) {
                                    var clickedItem = that.$scope.selectedItems.filter(item => that.itemsAreEqual(item, dataItem));
                                    if (clickedItem.length) {
                                        that.$scope.selectedItems.splice(that.$scope.selectedItems.indexOf(clickedItem[0]), 1);
                                        that.unselectRow($(event.target).parents("tr").first());
                                    }
                                    else {
                                        that.$scope.selectedItems.push(dataItem);
                                        that.selectRow($(event.target).parents("tr").first());
                                    }
                                }
                                else if (event.shiftKey && that.$scope.selectedItems.length > 0) {
                                    var clickedItem = that.$scope.selectedItems.filter(item => that.itemsAreEqual(item, dataItem));
                                    if (!clickedItem.length) {
                                        var dataSource = that.$scope.grid.dataSource.data();
                                        var clickedTr = $(event.target).parents("tr").first();
                                        var clickedTrIndex = clickedTr.parent().children("tr").index(clickedTr);
                                        var rows = clickedTr.parent().children("tr");
                                        var clickedDataItem = that.$scope.grid.dataItem(rows[clickedTrIndex]);
                                        var index1 = dataSource.indexOf(clickedDataItem);
                                        var index2 = dataSource.indexOf(that.$scope.selectedItems[0]);
                                        if (index1 > index2) {
                                            var temp = index1;
                                            index1 = index2;
                                            index2 = temp;
                                        }
                                        for (var i = index1; i <= index2; i++) {
                                            var currentDataItem = dataSource[i];
                                            if (!currentDataItem.isGroup) {
                                                var clickedItem = that.$scope.selectedItems.filter(item => that.itemsAreEqual(item, currentDataItem));
                                                if (!clickedItem.length) {
                                                    that.$scope.selectedItems.push(currentDataItem);
                                                    var index = that.$scope.grid.dataItems().indexOf(currentDataItem);
                                                    if (index > -1) {
                                                        that.selectRow($(rows.get(index)));
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (event.button === 2 && that.$scope.selectedItems.filter(item => that.itemsAreEqual(item, dataItem)).length) {
                                    }
                                    else {
                                        that.$scope.selectedItems = [];
                                        that.unselectAllRows();
                                        that.$scope.selectedItems.push(dataItem);
                                        that.selectRow($(event.target).parents("tr").first());
                                    }
                                }
                                event.stopPropagation();
                            }
                        }
                        if (that.$scope.change) {
                            that.$scope.change(that.$scope.selectedItems);
                        }
                    });
                }
            }
            ListController.guidPattern = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/;
            Data.ListController = ListController;
        })(Data = UI.Data || (UI.Data = {}));
    })(UI = CockpitFramework.UI || (CockpitFramework.UI = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../../typings/tsd.d.ts" />
/// <reference path="GroupManager.ts" />

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../Navigation/HttpRequestInterceptor.ts" />
/// <reference path="../HelperFunctions/DataContextHelperFunctions.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        class EditEntityService {
            constructor($rootScope, $q, $location, $timeout, $log, $translate, cofxViewService, cofxBusyIndicatorService) {
                this.$rootScope = $rootScope;
                this.$q = $q;
                this.$location = $location;
                this.$timeout = $timeout;
                this.$log = $log;
                this.$translate = $translate;
                this.cofxViewService = cofxViewService;
                this.cofxBusyIndicatorService = cofxBusyIndicatorService;
                this.dataContextService = CockpitFramework.Application.ApplicationService.getInjector().get("dataContextService");
                this.applicationService = CockpitFramework.Application.ApplicationService.getInjector().get("applicationService");
            }
            allowEdit(modelEntityName, entityUuid) {
                var that = this;
                var deferred = that.$q.defer();
                // check if model entity is APP_UserDetail
                if (!that.applicationService.supportsUserManagement && modelEntityName == "APP_UserDetail" && !entityUuid) {
                    that.$translate(["cofx.controls.editEntity.userCannotBeAddedTitle", "cofx.controls.editEntity.userCannotBeAddedDescription"]).then((translations) => {
                        var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                        messageService.alert("usercannotbeadded", translations["cofx.controls.editEntity.userCannotBeAddedTitle"], translations["cofx.controls.editEntity.userCannotBeAddedDescription"]);
                        deferred.resolve(false);
                    });
                }
                else if (!that.applicationService.isTenantAdmin && modelEntityName == "APP_UserDetail" && !entityUuid) {
                    that.$translate(["cofx.controls.editEntity.onlyAdminsCanAddUsersTitle", "cofx.controls.editEntity.onlyAdminsCanAddUsersDescription"]).then((translations) => {
                        var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                        messageService.alert("usercannotbeadded", translations["cofx.controls.editEntity.onlyAdminsCanAddUsersTitle"], translations["cofx.controls.editEntity.onlyAdminsCanAddUsersDescription"]);
                        deferred.resolve(false);
                    });
                }
                else {
                    deferred.resolve(true);
                }
                return deferred.promise;
            }
            allowDelete(modelEntityName, entityUuids) {
                var that = this;
                var deferred = that.$q.defer();
                // check if model entity is APP_UserDetail
                if (modelEntityName == "APP_UserDetail") {
                    that.$translate(["cofx.controls.editEntity.userCannotBeDeletedTitle", "cofx.controls.editEntity.userCannotBeDeletedDescription", "cofx.controls.editEntity.userCanOnlyBeHiddenOrDisabledTitle", "cofx.controls.editEntity.userCanOnlyBeHiddenOrDisabledDescription"]).then((translations) => {
                        var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                        if (that.applicationService.supportsUserManagement) {
                            messageService.alert("usercannotbedeleted", translations["cofx.controls.editEntity.userCanOnlyBeHiddenOrDisabledTitle"], translations["cofx.controls.editEntity.userCanOnlyBeHiddenOrDisabledDescription"]);
                        }
                        else {
                            messageService.alert("usercannotbedeleted", translations["cofx.controls.editEntity.userCannotBeDeletedTitle"], translations["cofx.controls.editEntity.userCannotBeDeletedDescription"]);
                        }
                        deferred.resolve(false);
                    });
                }
                else {
                    deferred.resolve(true);
                }
                return deferred.promise;
            }
            edit(entityUuid, url, formName, formExpression, modelEntityName, modelEntityFriendlyName, defaultValues, clone, formActions, valuesForUpdate, handleMessages) {
                var that = this;
                var deferred = that.$q.defer();
                var currentUrl = url;
                var loadStartTime = moment();
                that.allowEdit(modelEntityName, entityUuid).then((allowEdit) => {
                    if (!allowEdit) {
                        deferred.reject();
                    }
                    else {
                        if (currentUrl === "/app/import/importdefinition") {
                            formName = "TimeCockpit.UI.Import.ImportDefinitionView";
                            currentUrl = "";
                        }
                        // build url
                        if (currentUrl) {
                            that.openForm(deferred, currentUrl.replace(/^\/app/, ''), modelEntityFriendlyName, entityUuid, defaultValues, clone, loadStartTime, formActions, valuesForUpdate, handleMessages);
                        }
                        else if (formExpression && modelEntityName && entityUuid) {
                            var query = "From C In " + modelEntityName + " Where C." + modelEntityName + "Uuid = @EditObjectUuid Select New With { .FormName = " + formExpression + " }";
                            var parameters = {};
                            parameters["EditObjectUuid"] = entityUuid;
                            that.dataContextService.selectByQuery(query, { parameters: parameters }).toPromise().then((response) => {
                                if (response && response.length > 0 && response[0].USR_FormName) {
                                    formName = response[0].USR_FormName;
                                }
                                that.openForm(deferred, "/forms/" + formName, modelEntityFriendlyName, entityUuid, defaultValues, clone, loadStartTime, formActions, valuesForUpdate, handleMessages);
                            });
                        }
                        else if (formName) {
                            var url = "";
                            if (formName == "TimeCockpit.UI.Import.ImportDefinitionView") {
                                //url = "/import/importdefinition";
                                //that.openForm(deferred, url, modelEntityFriendlyName, entityUuid, defaultValues, clone, loadStartTime, formActions);
                                var navigationService = CockpitFramework.Application.ApplicationService.getInjector().get("navigationService");
                                var route = ["app", "import", "importdefinition"];
                                navigationService.openDialog(null, route, { entityUuid: entityUuid, clone: clone }, { width: 1400 }).then((hasChanges) => {
                                    deferred.resolve({ hasChanges: hasChanges, entityUuid: entityUuid });
                                });
                            }
                            else if (formName.indexOf("web:") == 0) {
                                var navigationService = CockpitFramework.Application.ApplicationService.getInjector().get("navigationService");
                                var route = formName.replace(/web:/, '').split('/');
                                route.unshift('app');
                                navigationService.openDialog(null, route, { entityUuid: entityUuid }).then((hasChanges) => {
                                    deferred.resolve({ hasChanges: hasChanges, entityUuid: entityUuid });
                                });
                            }
                            else {
                                url = "/forms/" + formName;
                                that.openForm(deferred, url, modelEntityFriendlyName, entityUuid, defaultValues, clone, loadStartTime, formActions, valuesForUpdate, handleMessages);
                            }
                        }
                        else if (modelEntityName) {
                            that.openForm(deferred, "/forms/entity/" + modelEntityName, modelEntityFriendlyName, entityUuid, defaultValues, clone, loadStartTime, formActions, valuesForUpdate, handleMessages);
                        }
                        else {
                            throw new Controls.FormError("Either url, formName or modelEntityName must be set.", true);
                        }
                    }
                });
                return deferred.promise;
            }
            delete(scope, modelEntityName, uuids, busyIndicatorOptions = null, confirmed = null) {
                var that = this;
                var deferred = that.$q.defer();
                that.allowDelete(modelEntityName, uuids).then((allowDelete) => {
                    if (!allowDelete) {
                        deferred.reject();
                    }
                    else {
                        if (uuids && uuids.length > 0) {
                            var confirmTitle = "cofx.controls.editEntity.confirmDeleteSingleItemTitle";
                            var confirmDescription = "cofx.controls.editEntity.confirmDeleteSingleItemDescription";
                            if (uuids.length > 1) {
                                confirmTitle = "cofx.controls.editEntity.confirmDeleteMultipleItemsTitle";
                                confirmDescription = "cofx.controls.editEntity.confirmDeleteMultipleItemsDescription";
                            }
                            that.$translate([confirmTitle, confirmDescription]).then((translations) => {
                                var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                                messageService.confirm("deleteselecteditems", translations[confirmTitle], translations[confirmDescription])
                                    .then((result) => {
                                    if (result == CockpitFramework.Controls.MessageResult.Confirm) {
                                        if (confirmed) {
                                            confirmed();
                                        }
                                        that.cofxBusyIndicatorService.addJob(scope, "deletedata", "Delete data", busyIndicatorOptions);
                                        var objectUuids = [];
                                        that.dataContextService.deleteObjects(modelEntityName, uuids).toPromise().then(() => {
                                            deferred.resolve(true);
                                            scope.$root.$broadcast("entityObjectSaved", { modelEntity: modelEntityName });
                                            that.cofxBusyIndicatorService.removeJob(scope, "deletedata");
                                        }, (error) => {
                                            console.error('could not delete object', error);
                                            if (error.status == 404) {
                                                deferred.resolve(true);
                                            }
                                            else {
                                                deferred.resolve(false);
                                            }
                                            that.cofxBusyIndicatorService.removeJob(scope, "deletedata");
                                        });
                                    }
                                    else {
                                        deferred.resolve(false);
                                    }
                                });
                            });
                        }
                        else {
                            deferred.resolve(false);
                        }
                    }
                });
                return deferred.promise;
            }
            update(scope, modelEntityName, uuid, data, busyIndicatorOptions = null) {
                var that = this;
                var deferred = that.$q.defer();
                that.cofxBusyIndicatorService.addJob(scope, "updatedata", "Update data", busyIndicatorOptions);
                var objectUuids = [];
                that.dataContextService.updateObject(modelEntityName, uuid, data, null).toPromise().then(() => {
                    deferred.resolve(true);
                    scope.$root.$broadcast("entityObjectSaved", { modelEntity: modelEntityName });
                    that.cofxBusyIndicatorService.removeJob(scope, "updatedata");
                }, (error) => {
                    that.$log.error("Could not update object.", error);
                    deferred.resolve(false);
                    that.cofxBusyIndicatorService.removeJob(scope, "updatedata");
                });
                return deferred.promise;
            }
            /**
             *  Opens a lookup list and returns the selected uuid.
             */
            showLookupList(lookupListUrl, targetFriendlyName, lookupCondition, useDefaultValuesInFilterOfRelationList = true) {
                var that = this;
                var deferred = that.$q.defer();
                // use view service
                var view = new CockpitFramework.Controls.View();
                view.registeredHotkeys = [];
                view.title = targetFriendlyName;
                view.content = `
<div class="cofx-content cofx-form-view">
<div class="cofx-form">
	<div class="cofx-form-container">
		<div class="cofx-form-content">
			<div class="cofx-form-wrapper cofx-lookup-list-wrapper" ng-class="{'cofx-form-has-errors': errors.length > 0}">
				<div class="cofx-lookup-list-header"></div>
				<div cofx-include-list change="change" select="select" src="'${lookupListUrl}'" auto-load="true" filter-condition="'${lookupCondition ? lookupCondition.replace(/'/g, '\\\'') : ''}'" ignore-filter-default-values="${useDefaultValuesInFilterOfRelationList ? false : true}" title="'${targetFriendlyName}'"></div>
			</div>

			<div class="cofx-form-top-icons">
				<div class="cofx-form-save" ng-show="(formActions|filter:{isPrimary:true}).length > 0"><button ng-click="(formActions|filter:{isPrimary:true})[0].execute($parent)" class="cofx-icon" ng-disabled="data.selectedItems.length != 1 && !formAction.allowForReadOnly"><i class="fi-check" /></button></div>
				<div class="cofx-form-close" ng-show="(formActions|filter:{isCancel:true}).length > 0"><button ng-click="(formActions|filter:{isCancel:true})[0].execute($parent)" class="cofx-icon"><i class="fi-x" /></button></div>
			</div>
		</div>

		<div class="cofx-form-footer" ng-class="{'cofx-form-footer-has-errors': errors.length > 0}">
			<table>
				<tr>
					<td width="auto" class="cofx-form-buttons-cell">
						<div class="cofx-form-buttons">
    						<div ng-repeat="formAction in formActions" class="cofx-hotkey-tooltip" data-tooltip="{{formAction.hotkey}}">
								<kendo-button class="k-button k-button-md k-rounded-md k-button-rectangle k-button-solid-base k-button-solid" ng-click="formAction.execute($parent.$parent)" ng-class="{'k-primary': formAction.isPrimary}" ng-disabled="data.selectedItems.length != 1 && !formAction.allowForReadOnly">{{formAction.friendlyName}}</kendo-button>
							</div>
						</div>
					</td>
				</tr>
			</table>
		</div>
	</div>
</div>
</div>`;
                var formActions = [];
                that.$translate(["cofx.controls.combobox.lookupListSelect", "cofx.controls.combobox.lookupListCancel"]).then((translations) => {
                    const viewData = { selectedItems: [] };
                    formActions.push({
                        friendlyName: translations["cofx.controls.combobox.lookupListSelect"],
                        execute: (formScope) => { that.closeLookupList(); deferred.resolve(viewData.selectedItems); /*that.selectItemFromLookupList(scope);*/ },
                        isPrimary: true,
                        hotkey: "ctrl+shift+enter",
                        hotkeyDescription: "Select item",
                        hotkeyFunction: (event, hotkeys, formScope) => { that.closeLookupList(); deferred.resolve(viewData.selectedItems); /*that.selectItemFromLookupList(scope);*/ }
                    });
                    formActions.push({
                        friendlyName: translations["cofx.controls.combobox.lookupListCancel"],
                        execute: (formScope) => { that.closeLookupList(); deferred.resolve(null); /*that.closeLookupList(scope);*/ },
                        isCancel: true,
                        allowForReadOnly: true,
                        hotkey: "esc",
                        hotkeyDescription: "Close form without selecting an item",
                        hotkeyFunction: (event, hotkeys, formScope) => { that.closeLookupList(); deferred.resolve(null); /*that.closeLookupList(scope);*/ }
                    });
                    const includeListScope = {
                        formActions: formActions,
                        lookupSelectedItems: [],
                        data: viewData,
                        change: null,
                        select: null
                    };
                    var changeFunction = (selectedItems) => {
                        includeListScope.data.selectedItems = selectedItems.map(s => s.entity);
                    };
                    var selectFunction = (selectedItems) => {
                        includeListScope.data.selectedItems = selectedItems.map(s => s.entity);
                        deferred.resolve(includeListScope.data.selectedItems);
                        that.closeLookupList();
                        //that.selectItemFromLookupList(scope);
                    };
                    includeListScope.change = changeFunction;
                    includeListScope.select = selectFunction;
                    view.scopeParameters = includeListScope;
                    view.onLoaded = () => {
                        //if (includeListScope.formActions) {
                        //	view.registeredHotkeys = [];
                        //	includeListScope.formActions.forEach((formAction: any) => {
                        //		if (formAction.hotkey) {
                        //			CockpitFramework.Controls.FormHelperFunctions.registerHotkey(
                        //				that.$rootScope,
                        //				(<any>view).registeredHotkeys,
                        //				that.$rootScope.hotkeys,
                        //				formAction.hotkey,
                        //				formAction.hotkeyDescription,
                        //				(event: any, hotkeys: any) => {
                        //					formAction.hotkeyFunction(event, hotkeys, that.$rootScope);
                        //					event.preventDefault();
                        //				},
                        //				["INPUT", "SELECT", "TEXTAREA"]);
                        //		}
                        //	});
                        //}
                    };
                    view.onClosed = (eventArgs) => {
                        //that.$timeout(() => {
                        //	if (view.registeredHotkeys) {
                        //		CockpitFramework.Controls.FormHelperFunctions.unregisterHotkeys((<any>view).registeredHotkeys, that.$rootScope.hotkeys);
                        //		var currentScope = <any>that.$rootScope;
                        //		while (currentScope) {
                        //			if (currentScope.setFocus && !currentScope.filterEntityListName) {
                        //				currentScope.setFocus();
                        //				break;
                        //			}
                        //			currentScope = currentScope.$parent;
                        //		}
                        //	}
                        //});
                    };
                    var currentScope = that.$rootScope;
                    while (currentScope) {
                        if (currentScope.removeFocus) {
                            currentScope.removeFocus();
                            break;
                        }
                        currentScope = currentScope.$parent;
                    }
                    that.cofxViewService.addView(view);
                });
                return deferred.promise;
            }
            /**
             *  Opens a list in a dialog window.
             */
            openList(listUrl, targetFriendlyName, filterParameters, width) {
                var that = this;
                var deferred = that.$q.defer();
                // use view service
                var view = new CockpitFramework.Controls.View();
                view.registeredHotkeys = [];
                view.title = targetFriendlyName;
                view.content = `
<div class="cofx-content cofx-form-view">
<div class="cofx-form">
    <div class="cofx-form-wrapper cofx-lookup-list-wrapper" ng-class="{'cofx-form-has-errors': errors.length > 0}">
        <div class="cofx-lookup-list-header"></div>
		<div cofx-include-list src="'${listUrl}'" auto-load="true" filter-parameters="filterParameters" ignore-filter-default-values="true" title="'${targetFriendlyName}'"></div>
	</div>

    <div class="cofx-form-top-icons">
		<div class="cofx-form-close" ng-show="(formActions|filter:{isCancel:true}).length > 0"><button ng-click="(formActions|filter:{isCancel:true})[0].execute($parent)" class="cofx-icon"><i class="fi-x" /></button></div>
	</div>

    <div class="cofx-form-footer" ng-class="{'cofx-form-footer-has-errors': errors.length > 0}">
		<table>
			<tr>
				<td width="auto" class="cofx-form-buttons-cell">
					<div class="cofx-form-buttons">
    					<div ng-repeat="formAction in formActions" class="cofx-hotkey-tooltip" data-tooltip="{{formAction.hotkey}}">
                            <kendo-button class="k-button k-button-md k-rounded-md k-button-rectangle k-button-solid-base k-button-solid" ng-click="formAction.execute($parent.$parent)" ng-class="{'k-primary': formAction.isPrimary}" ng-disabled="data.selectedItems.length != 1 && !formAction.allowForReadOnly">{{formAction.friendlyName}}</kendo-button>
                        </div>
					</div>
				</td>
			</tr>
		</table>
	</div>
</div>
</div>`;
                var formActions = [];
                that.$translate(["cofx.controls.dialog.close"]).then((translations) => {
                    const viewData = { selectedItems: [] };
                    formActions.push({
                        friendlyName: translations["cofx.controls.dialog.close"],
                        execute: (formScope) => { that.closeLookupList(); deferred.resolve(); /*that.closeLookupList(scope);*/ },
                        isCancel: true,
                        allowForReadOnly: true,
                        hotkey: "esc",
                        hotkeyDescription: "Close form",
                        hotkeyFunction: (event, hotkeys, formScope) => { that.closeLookupList(); deferred.resolve(); /*that.closeLookupList(scope);*/ }
                    });
                    const includeListScope = {
                        formActions: formActions,
                        lookupSelectedItems: [],
                        data: viewData,
                        filterParameters: filterParameters,
                        change: null,
                        select: null
                    };
                    var changeFunction = (selectedItems) => {
                        alert('change');
                        includeListScope.data.selectedItems = selectedItems.map(s => s.entity);
                    };
                    var selectFunction = (selectedItems) => {
                        alert('select');
                        includeListScope.data.selectedItems = selectedItems.map(s => s.entity);
                        //that.selectItemFromLookupList(scope);
                    };
                    includeListScope.change = changeFunction;
                    includeListScope.select = selectFunction;
                    view.scopeParameters = includeListScope;
                    view.onLoaded = () => {
                        //if (includeListScope.formActions) {
                        //	view.registeredHotkeys = [];
                        //	includeListScope.formActions.forEach((formAction: any) => {
                        //		if (formAction.hotkey) {
                        //			CockpitFramework.Controls.FormHelperFunctions.registerHotkey(
                        //				that.$rootScope,
                        //				(<any>view).registeredHotkeys,
                        //				that.$rootScope.hotkeys,
                        //				formAction.hotkey,
                        //				formAction.hotkeyDescription,
                        //				(event: any, hotkeys: any) => {
                        //					formAction.hotkeyFunction(event, hotkeys, that.$rootScope);
                        //					event.preventDefault();
                        //				},
                        //				["INPUT", "SELECT", "TEXTAREA"]);
                        //		}
                        //	});
                        //}
                    };
                    view.onClosed = (eventArgs) => {
                        //that.$timeout(() => {
                        //	if (view.registeredHotkeys) {
                        //		CockpitFramework.Controls.FormHelperFunctions.unregisterHotkeys((<any>view).registeredHotkeys, that.$rootScope.hotkeys);
                        //		var currentScope = <any>that.$rootScope;
                        //		while (currentScope) {
                        //			if (currentScope.setFocus && !currentScope.filterEntityListName) {
                        //				currentScope.setFocus();
                        //				break;
                        //			}
                        //			currentScope = currentScope.$parent;
                        //		}
                        //	}
                        //});
                    };
                    var currentScope = that.$rootScope;
                    while (currentScope) {
                        if (currentScope.removeFocus) {
                            currentScope.removeFocus();
                            break;
                        }
                        currentScope = currentScope.$parent;
                    }
                    if (width) {
                        view.width = width;
                    }
                    that.cofxViewService.addView(view);
                });
                return deferred.promise;
            }
            openForm(onClosed, url, title, entityUuid, defaultValues, clone, loadStartTime, formActions, valuesForUpdate, handleMessages) {
                var that = this;
                // use view service
                that.$translate(["cofx.controls.editEntity.saveAndClose", "cofx.controls.editEntity.save", "cofx.controls.editEntity.cancel"]).then((translations) => {
                    if (formActions == null) {
                        formActions = [];
                        formActions.push({ friendlyName: translations["cofx.controls.editEntity.saveAndClose"], type: "saveAndClose", execute: (formScope) => { that.saveAndCloseForm(formScope); }, isPrimary: true, hotkey: "ctrl+enter", hotkeyDescription: "Save & close form", hotkeyFunction: (event, hotkeys, formScope) => { that.saveAndCloseForm(formScope); } });
                        formActions.push({ friendlyName: translations["cofx.controls.editEntity.save"], type: "save", execute: (formScope) => { that.saveForm(formScope).catch(() => { }); }, hotkey: "ctrl+shift+enter", hotkeyDescription: "Save form", hotkeyFunction: (event, hotkeys, formScope) => { that.saveForm(formScope).catch(() => { }); } });
                        formActions.push({ friendlyName: translations["cofx.controls.editEntity.cancel"], execute: (formScope) => { that.closeFormWithoutSave(formScope); }, isCancel: true, allowForReadOnly: true, hotkey: "esc", hotkeyDescription: "Close form without saving", hotkeyFunction: (event, hotkeys, formScope) => { that.closeFormWithoutSave(formScope); } });
                    }
                    var view = new CockpitFramework.Controls.View();
                    view.title = title;
                    view.url = url;
                    view.scopeParameters = { entityUuid: entityUuid, defaultValuesFromFilter: defaultValues, formActions: formActions, clone: clone, loadStartTime: loadStartTime, valuesForUpdate: valuesForUpdate, handleMessages: handleMessages };
                    view.onLoaded = () => { };
                    view.onClosed = (eventArgs) => {
                        onClosed.resolve(eventArgs);
                    };
                    that.cofxViewService.addView(view);
                });
            }
            saveAndCloseForm(scope) {
                var that = this;
                if (!scope.isSaving) {
                    that.$timeout(() => {
                        that.saveForm(scope).then(() => that.closeForm(scope)).catch(() => { });
                    });
                }
            }
            closeLookupList() {
                var that = this;
                var activeElement = document.activeElement;
                if (activeElement && typeof activeElement.blur == "function") {
                    activeElement.blur();
                }
                that.$rootScope.$broadcast("viewClosed", null);
            }
            saveForm(scope) {
                var that = this;
                var deferred = that.$q.defer();
                if (scope.isSaving !== true) {
                    scope.isSaving = true;
                    console.log('save', scope);
                    that.$timeout(() => {
                        var activeElement = document.activeElement;
                        if (activeElement && typeof activeElement.blur == "function") {
                            activeElement.blur();
                            activeElement.focus();
                        }
                        // add .ng-touched class
                        scope.element.find('.ng-invalid.ng-untouched').removeClass('ng-untouched').addClass('ng-touched');
                        scope.element.find('.tc-validation-error.ng-untouched').removeClass('ng-untouched').addClass('ng-touched');
                        that.$timeout(() => {
                            that.cofxBusyIndicatorService.addJob(scope, "savedata", "Save data");
                            scope.validate([]).then((isValid) => {
                                this.$timeout(() => {
                                    if (isValid) {
                                        that.cofxBusyIndicatorService.addJob(scope, "savedata", "Save data");
                                        scope.dataItems[0].errors = [];
                                        ////if (scope.$root.$$phase != "$apply" && scope.$root.$$phase != "$digest") {
                                        ////	scope.$apply();
                                        ////}
                                        let errorHandeled = false;
                                        let resolve = false;
                                        if (scope.saveAction) {
                                            // use action to save form
                                            if (scope.actionManager) {
                                                scope.actionManager.executeActionByName(scope.saveAction, scope.modelEntity, [scope.dataItems[0]], null, scope.calculatedProperties, true, true, undefined, scope.$parent.handleMessages)
                                                    .then((error) => {
                                                    if (error) {
                                                        scope.isSaving = false;
                                                        that.cofxBusyIndicatorService.removeJob(scope, "savedata");
                                                        deferred.reject();
                                                    }
                                                    else {
                                                        // reload entity
                                                        that.dataContextService.selectByQuery("From C In " + scope.modelEntity + " Where C." + scope.modelEntity + "Uuid = @CurrentObjectUuid Select C", { parameters: { CurrentObjectUuid: scope.dataItems[0].entity[scope.modelEntity + "Uuid"] } }).toPromise().then((response) => {
                                                            scope.isNew = false;
                                                            scope.hasChanges = true;
                                                            if (response.length) {
                                                                var newEntity = response.data;
                                                                scope.updateValues(newEntity);
                                                            }
                                                            scope.entityUuid = scope.dataItems[0].entity[scope.modelEntity + "Uuid"];
                                                            that.broadcastSave(scope);
                                                            this.saveManyToManyRelationValues(scope).then(() => {
                                                                scope.isSaving = false;
                                                                deferred.resolve();
                                                            });
                                                        });
                                                    }
                                                }).catch(() => {
                                                    scope.isSaving = false;
                                                    deferred.reject();
                                                });
                                            }
                                        }
                                        else {
                                            // use odata to save form
                                            if (scope.isNew) {
                                                that.dataContextService.addObject(scope.modelEntity, scope.dataItems[0].entity, scope.calculatedProperties.concat(scope.dataItems[0].missingWritePermissions)).toPromise().then((response) => {
                                                    scope.isNew = false;
                                                    scope.hasChanges = true;
                                                    var newEntity = response[0];
                                                    scope.updateValues(newEntity);
                                                    scope.entityUuid = scope.dataItems[0].entity[scope.modelEntity + "Uuid"];
                                                    that.broadcastSave(scope);
                                                    this.saveManyToManyRelationValues(scope).then(() => {
                                                        scope.isSaving = false;
                                                        deferred.resolve();
                                                    });
                                                }, (error) => {
                                                    var data = error.error;
                                                    if (typeof (data) == "string") {
                                                        try {
                                                            data = JSON.parse(data);
                                                        }
                                                        catch (e) { }
                                                    }
                                                    if (data && data["odata.error"] && data["odata.error"] && data["odata.error"].code === 'TimeCockpit.Data.DataModel.ExecuteActionException') {
                                                        if (scope.actionManager) {
                                                            scope.actionManager.executeActionByName(data["odata.error"]["cofx.executeaction"], scope.modelEntity, [scope.dataItems[0]], null, scope.calculatedProperties, true, true)
                                                                .then(() => {
                                                                // reload entity
                                                                that.dataContextService.selectByQuery("From C In " + scope.modelEntity + " Where C." + scope.modelEntity + "Uuid = @CurrentObjectUuid Select C", { parameters: { CurrentObjectUuid: scope.dataItems[0].entity[scope.modelEntity + "Uuid"] } }).toPromise().then((response) => {
                                                                    scope.isNew = false;
                                                                    scope.hasChanges = true;
                                                                    if (response.length) {
                                                                        var newEntity = response.data;
                                                                        scope.updateValues(newEntity);
                                                                    }
                                                                    scope.entityUuid = scope.dataItems[0].entity[scope.modelEntity + "Uuid"];
                                                                    that.broadcastSave(scope);
                                                                    this.saveManyToManyRelationValues(scope).then(() => {
                                                                        scope.isSaving = false;
                                                                        deferred.resolve();
                                                                    });
                                                                });
                                                            }).catch(() => {
                                                                scope.isSaving = false;
                                                                deferred.reject();
                                                            });
                                                        }
                                                    }
                                                    else if (data && data["odata.error"] && data["odata.error"].message && data["odata.error"].message.value) {
                                                        scope.dataItems[0].errors = [new Controls.FormError(data["odata.error"].message.value, false)];
                                                        if (CockpitFramework.Navigation.HttpRequestInterceptorFactory.handeledExceptions.indexOf(data["odata.error"].code) >= 0) {
                                                            errorHandeled = true;
                                                        }
                                                        if (!errorHandeled) {
                                                            that.showErrors(scope);
                                                        }
                                                        scope.isSaving = false;
                                                        deferred.reject();
                                                    }
                                                }).finally(() => that.cofxBusyIndicatorService.removeJob(scope, "savedata"));
                                            }
                                            else {
                                                let delta = {};
                                                for (let property of scope.dataItems[0].changedPropertyNamesSinceLastSave) {
                                                    delta[property] = scope.dataItems[0].entity[property];
                                                }
                                                that.dataContextService.updateObject(scope.modelEntity, scope.dataItems[0].entity[scope.modelEntity + "Uuid"], removePropertiesFromObject(delta, ["odata.metadata"]), scope.calculatedProperties.concat(scope.dataItems[0].missingWritePermissions)).toPromise().then(() => {
                                                    scope.hasChanges = true;
                                                    that.broadcastSave(scope);
                                                    this.saveManyToManyRelationValues(scope).then(() => {
                                                        scope.isSaving = false;
                                                        deferred.resolve();
                                                    });
                                                }, (error) => {
                                                    if (error.status == 404) {
                                                        scope.hasChanges = true;
                                                        that.broadcastSave(scope);
                                                        scope.isSaving = false;
                                                        deferred.resolve();
                                                    }
                                                    else {
                                                        var data = error.error;
                                                        if (typeof (data) == "string") {
                                                            try {
                                                                data = JSON.parse(data);
                                                            }
                                                            catch (e) { }
                                                        }
                                                        if (data && data["odata.error"] && data["odata.error"] && data["odata.error"].code === 'TimeCockpit.Data.DataModel.ExecuteActionException') {
                                                            if (scope.actionManager) {
                                                                scope.actionManager.executeActionByName(data["odata.error"]["cofx.executeaction"], scope.modelEntity, [scope.dataItems[0]], null, scope.calculatedProperties, true, true)
                                                                    .then(() => {
                                                                    // reload entity
                                                                    that.dataContextService.selectByQuery("From C In " + scope.modelEntity + " Where C." + scope.modelEntity + "Uuid = @CurrentObjectUuid Select C", { parameters: { CurrentObjectUuid: scope.dataItems[0].entity[scope.modelEntity + "Uuid"] } }).toPromise().then((response) => {
                                                                        scope.isNew = false;
                                                                        scope.hasChanges = true;
                                                                        if (response.length) {
                                                                            var newEntity = response[0];
                                                                            scope.updateValues(newEntity);
                                                                        }
                                                                        scope.entityUuid = scope.dataItems[0].entity[scope.modelEntity + "Uuid"];
                                                                        that.broadcastSave(scope);
                                                                        this.saveManyToManyRelationValues(scope).then(() => {
                                                                            scope.isSaving = false;
                                                                            deferred.resolve();
                                                                        });
                                                                    }).catch(() => {
                                                                        scope.isSaving = false;
                                                                        deferred.reject();
                                                                    });
                                                                });
                                                            }
                                                        }
                                                        else if (data && data["odata.error"] && data["odata.error"].message && data["odata.error"].message.value) {
                                                            scope.dataItems[0].errors = [new Controls.FormError(data["odata.error"].message.value, false)];
                                                            if (CockpitFramework.Navigation.HttpRequestInterceptorFactory.handeledExceptions.indexOf(data["odata.error"].code) >= 0) {
                                                                errorHandeled = true;
                                                            }
                                                            if (!errorHandeled) {
                                                                that.showErrors(scope);
                                                            }
                                                            scope.isSaving = false;
                                                            if (resolve) {
                                                                deferred.resolve();
                                                            }
                                                            else {
                                                                deferred.reject();
                                                            }
                                                        }
                                                    }
                                                }).finally(() => that.cofxBusyIndicatorService.removeJob(scope, "savedata"));
                                            }
                                        }
                                    }
                                    else {
                                        that.showErrors(scope);
                                        scope.isSaving = false;
                                        deferred.reject();
                                    }
                                });
                            }).finally(() => that.cofxBusyIndicatorService.removeJob(scope, "savedata"));
                        });
                    });
                }
                else {
                    deferred.resolve();
                }
                return deferred.promise;
            }
            saveManyToManyRelationValues(scope) {
                var that = this;
                var deferred = that.$q.defer();
                const requests = [];
                scope.dataItems[0].manyToManyChangedValues.forEach((value, key) => {
                    for (let addedItems of value.targetUuidsToAdd) {
                        const newObject = {};
                        newObject[value.sourceRelation + 'Uuid'] = value.sourceUuid;
                        newObject[value.targetRelation + 'Uuid'] = addedItems;
                        requests.push(that.dataContextService.addObject(value.entity, newObject, []).toPromise());
                    }
                    requests.push(that.dataContextService.deleteObjects(value.entity, value.targetUuidsToRemove).toPromise());
                });
                that.$q.all(requests).finally(() => {
                    deferred.resolve();
                });
                return deferred.promise;
            }
            showErrors(scope) {
                var that = this;
                that.$translate(["cofx.controls.editEntity.dataNotValid"]).then((translations) => {
                    var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                    messageService.alert("datanotvalid", translations["cofx.controls.editEntity.dataNotValid"], scope.dataItems[0].errors.map(e => e.message).join("\r\n\r\n"));
                });
            }
            closeFormWithoutSave(scope) {
                this.closeForm(scope);
            }
            closeForm(scope) {
                var activeElement = document.activeElement;
                if (activeElement && typeof activeElement.blur == "function") {
                    activeElement.blur();
                }
                scope.$root.$broadcast("viewClosed", { hasChanges: scope.hasChanges, entityUuid: scope.entityUuid });
            }
            broadcastSave(scope) {
                scope.onEntitySaved();
                scope.$root.$broadcast("entityObjectSaved", { modelEntity: scope.modelEntity, entity: scope.dataItems[0].entity });
            }
        }
        Controls.EditEntityService = EditEntityService;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../../typings/tsd.d.ts" />
/// <reference path="FormControllerScope.ts" />
/// <reference path="../../../TypeScript/Controls/EditEntityService.ts" />
/// <reference path="../../../TypeScript/Controls/FormScope.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var UI;
    (function (UI) {
        var Data;
        (function (Data) {
            class FormController {
                constructor($scope, $routeParms, cofxEditEntityService) {
                    this.$scope = $scope;
                    this.$routeParms = $routeParms;
                    this.cofxEditEntityService = cofxEditEntityService;
                    var that = this;
                    that.$scope.entityUuid = $routeParms.entityuuid;
                    that.$scope.formActions = [];
                    that.$scope.formActions.push({
                        friendlyName: "Save",
                        execute: (formScope) => { cofxEditEntityService.saveForm(formScope).catch(() => { }); },
                        hotkey: "ctrl+enter", hotkeyDescription: "Save form",
                        hotkeyFunction: (event, hotkeys, formScope) => { cofxEditEntityService.saveForm(formScope).catch(() => { }); }
                    });
                    that.$scope.$on("$destroy", () => {
                        that.$scope.formActions = [];
                    });
                }
                setFocus(ignoreHotkeys = false) {
                }
                removeFocus(ignoreHotkeys = false) {
                }
            }
            Data.FormController = FormController;
        })(Data = UI.Data || (UI.Data = {}));
    })(UI = CockpitFramework.UI || (CockpitFramework.UI = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../../typings/tsd.d.ts" />
/// <reference path="../../../TypeScript/Navigation/HttpRequestInterceptor.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var UI;
    (function (UI) {
        var Error;
        (function (Error) {
            class ErrorController {
                constructor($scope, $location, httpRequestInterceptor) {
                    this.$scope = $scope;
                    this.$location = $location;
                    this.httpRequestInterceptor = httpRequestInterceptor;
                    var that = this;
                    that.$scope.error = httpRequestInterceptor.getLastError();
                    if (!that.$scope.error) {
                        that.$location.url("/");
                    }
                    else {
                        var message = "";
                        if (that.$scope.error["odata.error"] && that.$scope.error["odata.error"].message) {
                            message = that.$scope.error["odata.error"].message.value;
                        }
                        else if (that.$scope.error.message) {
                            message = that.$scope.error.message;
                        }
                        that.$scope.error.message = message.replace(/\r\n/g, "<br />");
                    }
                }
            }
            Error.ErrorController = ErrorController;
        })(Error = UI.Error || (UI.Error = {}));
    })(UI = CockpitFramework.UI || (CockpitFramework.UI = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        class BusyIndicatorService {
            constructor($timeout, $log) {
                this.$timeout = $timeout;
                this.$log = $log;
                this.jobs = [];
            }
            addJob(scope, name, description, options = null) {
                var that = this;
                options = $.extend({}, BusyIndicatorService.defaultOptions, options);
                that.jobs.push(new Job(scope.$id, name, description, options));
                if (options.delay) {
                    that.$timeout(() => that.broadcastState(scope), options.delay);
                }
                else {
                    that.broadcastState(scope);
                }
            }
            removeJob(scope, name) {
                var that = this;
                var items = that.jobs.filter(j => j.name == name && j.scopeId == scope.$id);
                if (items.length > 0) {
                    var index = that.jobs.indexOf(items[0]);
                    if (index >= 0) {
                        that.jobs.splice(index, 1);
                        that.$timeout(() => that.broadcastState(scope), 50);
                    }
                }
            }
            hasJob(name) {
                return this.jobs.filter(j => j.name == name).length > 0;
            }
            removeAllJobs(scope, name) {
                var that = this;
                var items = that.jobs.filter(j => j.name == name && j.scopeId == scope.$id);
                if (items.length > 0) {
                    var index = that.jobs.indexOf(items[0]);
                    if (index >= 0) {
                        that.jobs.splice(index, 1);
                    }
                    items = that.jobs.filter(j => j.name == name && j.scopeId == scope.$id);
                }
                that.broadcastState(scope);
            }
            isBusy(scope) {
                var that = this;
                return that.jobs.filter(j => j.options.isBlocking && j.scopeId == scope.$id).length > 0;
            }
            broadcastState(scope) {
                var that = this;
                scope.$broadcast("busyIndicatorServiceMessage", new BusyIndicatorServiceMessageEventArgs(that.isBusy(scope), that.getMessage(scope)));
                scope.$broadcast("busyIndicatorServiceNonBlockingMessage", new BusyIndicatorServiceMessageEventArgs(that.isNonBlockingBusy(scope), that.getNonBlockingMessage(scope)));
            }
            getMessage(scope) {
                var that = this;
                var currentJobs = that.jobs.filter(j => j.options.isBlocking && j.options.showMessage);
                var result = currentJobs.filter(j => j.scopeId == scope.$id).map(j => j.description).join("<br />");
                if (currentJobs.length > 3) {
                    result += "<br />...";
                }
                return result;
            }
            getNonBlockingMessage(scope) {
                var that = this;
                var currentJobs = that.jobs.filter(j => !j.options.isBlocking);
                var result = currentJobs.slice(0, 1).filter(j => j.scopeId == scope.$id).map(j => j.description).join("<br />");
                return result;
            }
            isNonBlockingBusy(scope) {
                var that = this;
                return that.jobs.filter(j => !j.options.isBlocking && j.scopeId == scope.$id).length > 0;
            }
        }
        BusyIndicatorService.defaultOptions = {
            isBlocking: true,
            delay: 0,
            showMessage: false
        };
        Controls.BusyIndicatorService = BusyIndicatorService;
        class BusyIndicatorServiceMessageEventArgs {
            constructor(isBusy, message) {
                this.isBusy = isBusy;
                this.message = message;
            }
        }
        Controls.BusyIndicatorServiceMessageEventArgs = BusyIndicatorServiceMessageEventArgs;
        class Job {
            constructor(scopeId, name, description, options) {
                this.scopeId = scopeId;
                this.name = name;
                this.description = description;
                this.options = options;
            }
        }
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../../typings/tsd.d.ts" />
/// <reference path="../../../TypeScript/Controls/BusyIndicatorService.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Shell;
    (function (Shell) {
        class ShellController {
            constructor($scope, $rootScope, $location, $templateCache, $window, $route, $log, $timeout, $translate, $mdDialog, cofxBusyIndicatorService, cofxViewService) {
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.$location = $location;
                this.$templateCache = $templateCache;
                this.$window = $window;
                this.$route = $route;
                this.$log = $log;
                this.$timeout = $timeout;
                this.$translate = $translate;
                this.$mdDialog = $mdDialog;
                this.cofxBusyIndicatorService = cofxBusyIndicatorService;
                this.cofxViewService = cofxViewService;
                var that = this;
                that.$scope.impersonationUsername = null;
                that.$scope.versionHasChanged = false;
                this.$scope.serverUnavailable = false;
                // show busy indicator during routing
                that.$rootScope.$on("$routeChangeStart", function (event, next, current) {
                    that.cofxBusyIndicatorService.removeAllJobs(that.$scope, "loadroute");
                    that.cofxBusyIndicatorService.addJob(that.$scope, "loadroute", "Load page");
                    that.cofxViewService.closeAllViews();
                });
                that.$rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
                    that.cofxBusyIndicatorService.removeJob(that.$scope, "loadroute");
                    var search = that.$location.search();
                    if (search.title) {
                        that.$window.document.title = CockpitFramework.Application.ApplicationService.getCurrentApplication().configuration.title + " - " + that.$location.search().title;
                    }
                    else {
                        that.$window.document.title = CockpitFramework.Application.ApplicationService.getCurrentApplication().configuration.title;
                    }
                    var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                    appInsightsService.trackPageView(that.$window.document.title, that.$location.path());
                });
                that.$rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
                    that.cofxBusyIndicatorService.removeJob(that.$scope, "loadroute");
                    var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                    appInsightsService.trackException(new Error("Could not load page " + that.$location.path() + ", rejection: " + JSON.stringify(rejection)));
                });
                var impersonationUsername = CockpitFramework.Application.ApplicationService.getCurrentApplication().impersonationUsername;
                if (impersonationUsername) {
                    var username = window.atob(impersonationUsername);
                    var parameters = {};
                    parameters["Username"] = username;
                    var dataContextService = CockpitFramework.Application.ApplicationService.getInjector().get("dataContextService");
                    dataContextService.selectByQuery("From U In APP_UserDetail Where U.APP_Username = @Username Select New With { U.APP_Fullname }", parameters).toPromise().then((users) => {
                        if (users.length > 0) {
                            that.$scope.impersonationUsername = users[0].USR_Fullname;
                        }
                        else {
                            console.error("Could not load user: " + username);
                        }
                    }, (error) => {
                        console.error("Could not load users: " + JSON.stringify(error));
                    });
                }
            }
        }
        Shell.ShellController = ShellController;
    })(Shell = CockpitFramework.Shell || (CockpitFramework.Shell = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="ApplicationConfiguration.ts" />
/// <reference path="../../TypeScript/Navigation/HttpRequestInterceptor.ts" />
/// <reference path="../../TypeScript/Controls/MessageService.ts" />
/// <reference path="../../Areas/Data/Scripts/ListController.ts" />
/// <reference path="../../Areas/Data/Scripts/FormController.ts" />
/// <reference path="../../Areas/Error/Scripts/ErrorController.ts" />
/// <reference path="../../Areas/Shell/Scripts/ShellController.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Application;
    (function (Application) {
        class ControllerProviderConfiguration {
            constructor(name, dependencyAnnotatedConstructor) {
                var that = this;
                that.name = name;
                that.dependencyAnnotatedConstructor = dependencyAnnotatedConstructor;
            }
        }
        Application.ControllerProviderConfiguration = ControllerProviderConfiguration;
        class Route {
            constructor(path, route) {
                var that = this;
                that.path = path;
                that.route = route;
            }
        }
        Application.Route = Route;
        class ApplicationService {
            constructor() {
                this.beforePreviousPage = null;
                this.previousPage = null;
                this.externalModules = [];
                var that = this;
                that.configuration = new Application.ApplicationConfiguration();
            }
            static getCurrentApplication() {
                var that = this;
                if (!that.currentApplication) {
                    that.currentApplication = new ApplicationService();
                }
                return that.currentApplication;
            }
            static getInjector() {
                var that = this;
                if (!that.currentInjector) {
                    var domElement = document.getElementById("cofx-app");
                    that.currentInjector = angular.element(domElement).injector();
                }
                return that.currentInjector;
            }
            initializeApplication() {
                var that = this;
                var modules = ["ng", "ngRoute", "ngSanitize", "pascalprecht.translate", "kendo.directives", "LocalStorageModule", "cockpitframework.application", "cockpitframework.data", "cockpitframework.navigation", "cockpitframework.controls", "ngMaterial", "rx"];
                modules = modules.concat(that.configuration.modules);
                that.angularApplication = angular.module("cofxApp", modules);
                that.angularApplication.config([
                    "$routeProvider",
                    "$controllerProvider",
                    "$httpProvider",
                    "$provide",
                    "localStorageServiceProvider",
                        ($routeProvider, $controllerProvider, $httpProvider, $provide, localStorageServiceProvider) => {
                        // register controllers
                        $controllerProvider.register("ShellController", ["$scope", "$rootScope", "$location", "$templateCache", "$window", "$route", "$log", "$timeout", "$translate", "$mdDialog", "cofxBusyIndicatorService", "cofxViewService", CockpitFramework.Shell.ShellController]);
                        $controllerProvider.register("ListController", ["$scope", "$rootScope", "$q", "$timeout", "$templateCache", "$compile", "$location", "$window", "$log", "$translate", "cofxBusyIndicatorService", "cofxArrayService", "cofxViewService", "cofxEditEntityService", CockpitFramework.UI.Data.ListController]);
                        $controllerProvider.register("FormController", ["$scope", "$routeParams", "cofxEditEntityService", CockpitFramework.UI.Data.FormController]);
                        $controllerProvider.register("ErrorController", ["$scope", "$location", "cofxHttpRequestInterceptor", CockpitFramework.UI.Error.ErrorController]);
                        that.configuration.controllerProviders.forEach((provider) => {
                            $controllerProvider.register(provider.name, provider.dependencyAnnotatedConstructor);
                        });
                        // handle routing errors
                        $httpProvider.interceptors.push("cofxHttpRequestInterceptor");
                        // configure routes
                        that.configuration.routes.forEach((route) => {
                            $routeProvider.when(route.path, route.route);
                        });
                        $routeProvider
                            .when("/app/error/:errorcode", { templateUrl: function (params) { return "/error/" + params.errorcode; }, controller: "ErrorController" })
                            .when("/app/forms/entity/:entityname/:entityuuid?", { templateUrl: function (params) { return "/forms/entity/" + params.entityname; }, controller: "FormController" })
                            .when("/app/forms/:formname/:entityuuid?", { templateUrl: function (params) { return "/forms/" + params.formname; }, controller: "FormController" })
                            .when("/app/lists/entity/:entityname", {
                            templateUrl: function (params) {
                                var application = ApplicationService.getCurrentApplication();
                                if (application.previousPage && application.previousPage.indexOf(window.location.pathname) == 0 && application.beforePreviousPage != null && application.beforePreviousPage.indexOf(application.previousPage + "(") == 0) {
                                    return null;
                                }
                                else {
                                    return "/lists/entity/" + params.entityname + that.getListUrl(params);
                                }
                            }, controller: "ListController"
                        })
                            .when("/app/lists/:listname", {
                            templateUrl: function (params) {
                                var application = ApplicationService.getCurrentApplication();
                                if (application.previousPage && application.previousPage.indexOf(window.location.pathname) == 0 && application.beforePreviousPage != null && application.beforePreviousPage.indexOf(application.previousPage + "(") == 0) {
                                    return null;
                                }
                                else {
                                    return "/lists/" + params.listname + "/" + that.getListUrl(params);
                                }
                            }, controller: "ListController"
                        });
                        ApplicationService.getCurrentApplication().configuration.angularRoutes.forEach(route => {
                            $routeProvider.when(route, { templateUrl: function (params) { return "/shell/empty"; } });
                        });
                        $routeProvider.otherwise({
                            redirectTo: function (params) {
                                if (location.pathname.indexOf("/app/") == 0) {
                                    ////return "/shell/empty";
                                    return null;
                                }
                                else {
                                    return that.configuration.defaultUrl;
                                }
                            }
                        });
                        // handle exceptions
                        $provide.decorator("$exceptionHandler", ["$delegate", "$injector", "$log", function ($delegate, $injector, $log) {
                                that.$injector = $injector;
                                return function (exception, cause) {
                                    var $window = $injector.get("$window");
                                    var $location = $injector.get("$location");
                                    var cofxHttpRequestInterceptor = $injector.get("cofxHttpRequestInterceptor");
                                    $log.error(exception.message + ": " + exception.stack);
                                    var appInsightsService = $injector.get("appInsightsService");
                                    appInsightsService.trackException(exception);
                                    // do not raise new error when error view is already displayed
                                    if ($location.url().indexOf("/app/error/") != 0) {
                                        cofxHttpRequestInterceptor.raiseError({ errorCode: "unknown", message: exception.message, source: $location.url() });
                                    }
                                    $delegate(exception, cause);
                                };
                            }]);
                        localStorageServiceProvider
                            .setPrefix("timecockpit." + that.configuration.username)
                            .setStorageType("localStorage")
                            .setNotify(false, false);
                    }
                ]);
                // configure logger
                that.angularApplication.config(['$provide', function ($provide) {
                        $provide.decorator('$log', ['$delegate', function ($delegate) {
                                var origError = $delegate.error;
                                $delegate.error = function () {
                                    var args = [].slice.call(arguments);
                                    var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                                    appInsightsService.trackException({ name: "logError", message: args.join(', ') });
                                    origError.apply(null, args);
                                };
                                return $delegate;
                            }]);
                    }]);
                // enable html5Mode for pushstate ("#"-less URLs)
                that.angularApplication.config(["$locationProvider", ($locationProvider) => {
                        // <base href="/" /> does not work with svg clip-path
                        $locationProvider.html5Mode({ enabled: true, requireBase: false });
                        $locationProvider.hashPrefix("!");
                    }]);
                // configure material design colors
                that.angularApplication.config(["$mdThemingProvider", ($mdThemingProvider) => {
                        $mdThemingProvider.definePalette("cofxprimary", that.configuration.primaryPalette);
                        $mdThemingProvider.definePalette("cofxaccent", that.configuration.accentPalette);
                        $mdThemingProvider.definePalette("cofxwarn", that.configuration.warnPalette);
                        $mdThemingProvider.theme("default")
                            .primaryPalette("cofxprimary")
                            .accentPalette("cofxaccent")
                            .warnPalette("cofxwarn");
                    }]);
                // configure localization
                that.angularApplication.config(["$translateProvider", ($translateProvider) => {
                        var language = that.configuration.language;
                        if (language != "de") {
                            language = "en";
                        }
                        $translateProvider.useSanitizeValueStrategy("escapeParameters");
                        $translateProvider.preferredLanguage(language);
                        $translateProvider.fallbackLanguage("en");
                        $translateProvider.useLoader("cofxLocalizationLoader", {});
                    }]);
                // configure debug mode
                that.angularApplication.config(["$compileProvider", ($compileProvider) => {
                        $compileProvider.debugInfoEnabled(false);
                        $compileProvider.commentDirectivesEnabled(false);
                        $compileProvider.cssClassDirectivesEnabled(false);
                    }]);
                // configure promise provider
                that.angularApplication.config(["$qProvider", function ($qProvider) {
                        // TODO: find unhandled rejections
                        $qProvider.errorOnUnhandledRejections(false);
                    }]);
                // application is now bootstrapped by angular 5+
                ////angular.bootstrap(document, ["cofxApp"], { strictDi: true });
                that.angularApplication.run(["$location", "$rootScope", ($location, $rootScope) => {
                        // set impersonation user
                        ////if ($location.search().impersonate) {
                        ////	that.impersonationUsername = $location.search().impersonate;
                        ////	$location.search("impersonate", null)
                        ////}
                        // set previous pages, required for angular 5+ routes  with named router outlets
                        $rootScope.$on("$locationChangeStart", (event, newUrl) => {
                            var application = ApplicationService.getCurrentApplication();
                            application.beforePreviousPage = application.previousPage;
                            application.previousPage = location.pathname;
                        });
                    }]);
            }
            getListUrl(params) {
                var that = this;
                var url = "";
                if (params.scope) {
                    url = "/" + params.scope;
                }
                if (params.autoGenerateColumns) {
                    url += "?autoGenerateColumns=" + params.autoGenerateColumns;
                }
                return url;
            }
        }
        Application.ApplicationService = ApplicationService;
    })(Application = CockpitFramework.Application || (CockpitFramework.Application = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../TypeScript/Application/ApplicationService.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        class FormHelperFunctions {
            static setFocusedElement(rootElementSelector, focusedElement = null) {
                var $timeout = CockpitFramework.Application.ApplicationService.getInjector().get("$timeout");
                $timeout(() => {
                    if (focusedElement && focusedElement.nodeName != "BUTTON") {
                        $(focusedElement).focus().blur();
                        $(focusedElement).focus().select();
                    }
                    else {
                        var rootElement = $(rootElementSelector);
                        if (rootElement) {
                            var defaultFocusElements = rootElement.find("*[data-hasdefaultfocus='true']:not(.ng-hide)");
                            if (defaultFocusElements.length > 0) {
                                rootElement = defaultFocusElements.first();
                            }
                            var input = rootElement.find("input:enabled,textarea:enabled");
                            try {
                                input.first().focus().blur();
                                input.first().focus().select();
                            }
                            catch (e) {
                                console.warn("Could not select first input element.");
                            }
                        }
                    }
                });
            }
        }
        Controls.FormHelperFunctions = FormHelperFunctions;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

var CockpitFramework;
(function (CockpitFramework) {
    var Navigation;
    (function (Navigation) {
        var cockpitFrameworkNavigationModule = angular.module("cockpitframework.navigation", ["cockpitframework.data", "cockpitframework.controls"]);
        cockpitFrameworkNavigationModule.factory("cofxHttpRequestInterceptor", ["$q", "$location", "$window", "$injector", "$log", "localStorageService",
                ($q, $location, $window, $injector, $log, localStorageService) => {
                return Navigation.HttpRequestInterceptorFactory.Create($q, $location, $window, $injector, $log, localStorageService);
            }]);
    })(Navigation = CockpitFramework.Navigation || (CockpitFramework.Navigation = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Application;
    (function (Application) {
        class LocalizationLoader {
            constructor($q, $log, $http) {
                var _$q = $q;
                var _$log = $log;
                var _$http = $http;
                return (options) => {
                    var deferred = _$q.defer();
                    var lang = options.key;
                    if (lang !== 'en' && lang !== 'de') {
                        console.warn(`localizations for ${lang} are not available, fallback en is used`);
                        lang = 'en';
                    }
                    var url = `/assets/i18n/messages-cofx-${lang}.json?v=${APP_VERSION}`;
                    if (options.serviceUrl) {
                        url = options.serviceUrl + url;
                    }
                    var urls = [url];
                    var results = [];
                    urls.forEach(url => results.push($http.get(url)));
                    var result = {};
                    $q.all(results).then(values => {
                        values.forEach(value => {
                            var currentResult = value.data;
                            if (angular.isString(currentResult)) {
                                currentResult = JSON.parse(value.data);
                            }
                            result = $.extend(result, currentResult);
                        });
                        deferred.resolve(result);
                    }).catch((error) => {
                        _$log.error(`Could not load localizations for ${lang}: ` + JSON.stringify(error.config));
                        //deferred.reject(error);
                        deferred.resolve({});
                    });
                    return deferred.promise;
                };
            }
        }
        Application.LocalizationLoader = LocalizationLoader;
    })(Application = CockpitFramework.Application || (CockpitFramework.Application = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="ApplicationService.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Application;
    (function (Application) {
        var cockpitFrameworkControlModule = angular.module("cockpitframework.application", ["ng", "pascalprecht.translate", "kendo.directives", "cockpitframework.data", "cockpitframework.controls"]);
        cockpitFrameworkControlModule.service("cofxApplicationService", [Application.ApplicationService]);
        cockpitFrameworkControlModule.service("cofxLocalizationLoader", ["$q", "$log", "$http", "cofxApplicationService", Application.LocalizationLoader]);
    })(Application = CockpitFramework.Application || (CockpitFramework.Application = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        class BusyIndicator {
            static Create($timeout) {
                var newBusyIndicator = new BusyIndicator();
                newBusyIndicator.restrict = "EA";
                newBusyIndicator.transclude = true;
                newBusyIndicator.template = `
<div class=\"cofx-busy-indicator-outerdiv\" ng-transclude></div>

<div ng-show=\"isBusy\" class=\"cofx-busy-indicator\">
	<div layout="row" layout-align="center center">
		<div>
			<div class="cofx-busy-indicator-inner">
				<svg ng-class="{rotate: isBusy}" width="44" height="44" viewBox="0 0 44 44"
                    xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" fill-rule="evenodd">
                        <g transform="translate(1 1)" stroke-width="6">
                            <circle cx="21" cy="21" r="18" />
                            <path stroke="#fff" stroke-opacity=".5" d="M 39 21 A 18 18 0 0 1 21 39"></path>
                        </g>
                    </g>
                </svg>
			</div>
			<div ng-show="busyMessage" class=\"cofx-busy-indicator-message\" ng-bind-html=\"busyMessage\" /></div>
		</div>
	</div>
</div>

<div ng-show=\"isNonBlockingBusy && !isBusy\" class=\"cofx-non-blocking-busy-indicator\">
	<div>
		<div class=\"cofx-non-blocking-busy-indicator-message\">
			<div ng-bind-html=\"nonBlockingBusyMessage\" /></div>	
		</div>
	</div>
</div>`;
                // Initialize component
                newBusyIndicator.link = function (scope, element, attrs) {
                    element.addClass("cofx-busy-indicator-directive");
                    scope.$on("busyIndicatorServiceMessage", (event, args) => {
                        if (!event.defaultPrevented) {
                            scope.isBusy = args.isBusy;
                            scope.busyMessage = args.message;
                            event.preventDefault();
                            if (event.stopPropagation) {
                                event.stopPropagation();
                            }
                        }
                    });
                    scope.$on("busyIndicatorServiceNonBlockingMessage", (event, args) => {
                        if (!event.defaultPrevented) {
                            scope.isNonBlockingBusy = args.isBusy;
                            scope.nonBlockingBusyMessage = args.message;
                            event.preventDefault();
                            if (event.stopPropagation) {
                                event.stopPropagation();
                            }
                        }
                    });
                };
                return newBusyIndicator;
            }
        }
        Controls.BusyIndicator = BusyIndicator;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
"use strict";
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        /**
        * Filter for for lists.
        * @class
        */
        class Filter {
            /**
            * Creates a new Filter directive.
            * @param {ng.ITimeoutService} $timeout - AngularJS timeout service.
            */
            static Create($timeout, $compile, $sce, $log, $q, $translate) {
                var filter = new Filter();
                filter.$timeout = $timeout;
                filter.$sce = $sce;
                filter.$log = $log;
                filter.$q = $q;
                filter.$translate = $translate;
                filter.restrict = "EA";
                filter.transclude = {
                    "title": "?filterTitle",
                    "content": "filterContent",
                    "commands": "?filterCommands",
                    "info": "?filterInfo"
                };
                // TODO: add hotkey to filter
                //<md-tooltip>
                //	<span translate-once="cofx.controls.filter.toggleFilter"></span>
                //	<div ng-show="toggleButtonKey" class="cfp-hotkeys"><div class="cfp-hotkeys-key"><span translate-once="cofx.keyboard.ctrl"></span> + {{toggleButtonKey}}</div></div>
                //</md-tooltip>
                filter.template = `<div class="cofx-list-filter" ng-class="showFilter ? '' : 'cofx-list-filter-hidden'">
	<h1 ng-transclude="title"></h1>
	<div class="cofx-list-filter-options">
		<md-button ng-click="toggleFilter()" class="cofx-md-button-small" ng-show="showToggleButton" aria-label="{{cofx.controls.filter.showFilter | translate}}">
			<i class="fa" ng-class="showFilter ? 'fa-angle-up' : 'fa-angle-down'" /><span ng-hide="showFilter" translate-once="cofx.controls.filter.showFilter"></span><span ng-hide="!showFilter" translate-once="cofx.controls.filter.hideFilter"></span>
		</md-button>
	</div>
	<div class="cofx-list-filter-info">
		<div ng-transclude="info"></div>
	</div>
	<div class="cofx-filter-area" ng-show="showFilter">
		<div ng-transclude="content"></div>
	</div>
	<div class="cofx-form-buttons" ng-show="showFilter">
		<div ng-transclude="commands"></div>
	</div>

    <ul kendo-context-menu k-filter="'.cofx-add-custom-filter'" k-show-on="'click'" class="cofx-filter-context-menu">
		<li ng-repeat="property in ::filterProperties">
		    <div class="cofx-list-context-menu-hover">{{property.friendlyName}}</div>
			<ul ng-if="property.name == 'test'">
				<li>test 1</li>
			</ul>
	    </li>
	</ul>
</div>`;
                // custom filter (after <div ng-transclude="content"></div>)
                //<div class="cofx-custom-filters" ng- show="::modelEntity" > <a class="cofx-add-custom-filter" > <i class="fa fa-filter" aria- hidden="true" > </i> Add filter</a> </div>
                filter.scope = {
                    showToggleButton: "=?",
                    toggleButtonKey: "=?",
                    filterToggled: "&?",
                    modelEntity: "@"
                };
                // Initialize component
                filter.link = function (scope, element, attrs) {
                    scope.showFilter = $(window).width() > 600;
                    if (scope.showToggleButton === null || scope.showToggleButton === undefined) {
                        scope.showToggleButton = true;
                    }
                    scope.toggleFilter = () => {
                        scope.showFilter = !scope.showFilter;
                        if (scope.filterToggled) {
                            scope.filterToggled({ expanded: scope.showFilter });
                        }
                    };
                    filter.$timeout(() => {
                        scope.filterProperties = [
                            {
                                "name": "test",
                                "friendlyName": "test"
                            },
                            {
                                "name": "test 2",
                                "friendlyName": "test 2"
                            },
                            {
                                "name": "test 3",
                                "friendlyName": "test 3"
                            }
                        ];
                    });
                };
                return filter;
            }
        }
        Controls.Filter = Filter;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/css-element-queries/ResizeSensor.d.ts" />
/// <reference path="ActionManager.ts" />
/// <reference path="BusyIndicatorService.ts" />
/// <reference path="FormScope.ts" />
/// <reference path="IncludeList.ts" />
/// <reference path="MessageService.ts" />
/// <reference path="ViewService.ts" />
/// <reference path="../HelperFunctions/FormHelperFunctions.ts" />
/// <reference path="../../Areas/Data/Scripts/ListControllerScope.ts" />
"use strict";
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        /** Workflow
        *	- load entity object (new or existing)
        *	- initializeForm (validate, add $watch for entity object)
        *	- load comboboxes with autoLoad="false"
        *   - load BackReferenceCells if isNew="false"
        */
        class Form {
            static Create($timeout, $compile, $sce, $log, $q, $translate, cofxHttp, cofxBusyIndicatorService, cofxViewService) {
                var newForm = new Form();
                var navigationService = CockpitFramework.Application.ApplicationService.getInjector().get("navigationService");
                newForm.restrict = "EA";
                newForm.transclude = true;
                newForm.template = "<div class=\"cofx-form\"><div kendo-validator class=\"cofx-form-validator\"></div></div>";
                newForm.scope = Controls.FormScope.createScopeDeclaration();
                newForm.cofxHttp = cofxHttp;
                newForm.$timeout = $timeout;
                newForm.$sce = $sce;
                newForm.$log = $log;
                newForm.$q = $q;
                newForm.$translate = $translate;
                newForm.hotkeysService = CockpitFramework.Application.ApplicationService.getInjector().get("hotkeysService");
                newForm.dataContextService = CockpitFramework.Application.ApplicationService.getInjector().get("dataContextService");
                // Initialize component
                newForm.link = function ($scope, element, attrs, controller, transclude) {
                    $scope.registeredHotkeys = [];
                    $scope.changedProperties = [];
                    $scope.showAllErrors = false;
                    // register at comboBoxService
                    CockpitFramework.Application.ApplicationService.getInjector().get("comboBoxService").addFormScope($scope);
                    $scope.allComboboxesInitialized = false;
                    $scope.resizeHandlerAdded = false;
                    //console.log("form initializing 1: " + moment().format("HH:mm:ss.SS"));
                    $scope.updateValues = (entityObject) => newForm.updateValues($scope, entityObject, null);
                    $scope.validate = (changedPropertyNames) => { return $scope.validationManager.validate($scope, $scope.dataItems[0], changedPropertyNames); };
                    $scope.fileUploaded = (e) => newForm.fileUploaded($scope, e);
                    $scope.removeFile = (file) => newForm.removeFile($scope, file);
                    $scope.activateTab = (e) => newForm.activateTab($scope, e);
                    $scope.scrollTabsLeft = () => newForm.scrollTabsLeft($scope);
                    $scope.scrollTabsRight = () => newForm.scrollTabsRight($scope);
                    $scope.getEntityMissingWritePermissions = (dataItems, showAllErrors = true) => {
                        if (dataItems && dataItems.length) {
                            const result = dataItems[0].entityMissingWritePermissions.map((p) => p.message).filter((value, i, self) => self.indexOf(value) === i);
                            if (showAllErrors) {
                                return result;
                            }
                            else {
                                return result.slice(0, 1);
                            }
                        }
                        else {
                            return [];
                        }
                    };
                    $scope.getErrors = (dataItems, showAllErrors = true) => {
                        if (!dataItems || !dataItems.length) {
                            return [];
                        }
                        if (showAllErrors) {
                            return dataItems[0].errors;
                        }
                        else {
                            return dataItems[0].errors.slice(0, 1);
                        }
                    };
                    $scope.width = element.width();
                    $scope.element = element;
                    $scope.formWidth = window.innerWidth;
                    $scope.sizeS = CockpitFramework.Application.ApplicationService.getCurrentApplication().configuration.formSizeS;
                    $scope.sizeXS = CockpitFramework.Application.ApplicationService.getCurrentApplication().configuration.formSizeXS;
                    if ($scope.element[0].clientWidth) {
                        new ResizeSensor($scope.element[0], function () {
                            //console.log('View size changed', $scope.modelEntity, $scope.$id, $scope.element[0].clientWidth);
                            $scope.formWidth = $scope.element[0].clientWidth;
                            $scope.resizeHandlerAdded = true;
                        });
                    }
                    $scope.errorMessage = kendo.template("<ul class=\"cofx-form-error-summary-tooltip\"><li ng-repeat=\"error in dataItems[0].errors\">{{error.message}}</li></ul>");
                    $scope.permissionMessage = kendo.template("<ul class=\"cofx-form-error-summary-tooltip\"><li ng-repeat=\"permission in getEntityMissingWritePermissions(dataItems) track by $index\">{{permission}}</li></ul>");
                    $scope.isValidating = false;
                    $scope.formLoaded = false;
                    $scope.formValidated = false;
                    $scope.hasChanges = false;
                    $scope.isFirstValidationRequest = true;
                    $scope.cofxBusyIndicatorService = cofxBusyIndicatorService;
                    $scope.editModelEntityName = $scope.modelEntity;
                    $scope.expressions = $scope.$eval(attrs["expressions"]);
                    $scope.numberOfComboboxes = 0;
                    $scope.numberOfAutoLoadComboboxes = 0;
                    //newForm.updateFormWidth($scope);
                    // add readOnlyExpression to expressions
                    if ($scope.readOnlyExpression) {
                        $scope.expressions["readOnlyExpression"] = { expression: $scope.readOnlyExpression, value: false };
                    }
                    $scope.hasMissingReadPermission = (dataItem, property) => dataItem && dataItem.missingReadPermissions && dataItem.missingReadPermissions.indexOf(property) >= 0;
                    $scope.hasMissingWritePermission = (dataItem, property) => {
                        return dataItem && dataItem.missingWritePermissions && dataItem.missingWritePermissions.indexOf(property) >= 0;
                    };
                    $scope.entityHasMissingWritePermission = (dataItem) => dataItem && dataItem.entityMissingWritePermissions && dataItem.entityMissingWritePermissions.length > 0;
                    $scope.onEntitySaved = () => {
                        $scope.dataItems[0].changedPropertyNamesSinceLastSave = [];
                    };
                    $scope.actionManager = new Controls.ActionManager();
                    $scope.actionManager.initialize(null, $scope, $log, $translate, $q, $timeout, cofxBusyIndicatorService, cofxViewService, null, null, null);
                    $scope.actionManager.actionExecuted = (result) => newForm.actionExecuted($scope, result);
                    $scope.actionManager.actions = $scope.actions;
                    $scope.validationManager = new Controls.ValidationManager();
                    $scope.validationManager.initialize(null, $scope, $log, $translate, $q, cofxBusyIndicatorService, cofxViewService, () => {
                        const elements = Array.from($scope.element[0].querySelectorAll('[name]')).map(e => ({
                            element: e,
                            property: e.localName === 'cofx-combo-box' || e.localName === 'cofx-tree-view-combo-box' ? e.getAttribute('name') + 'Uuid' : e.getAttribute('name')
                        }));
                        for (const element of elements) {
                            if (element.element.classList.contains('tc-validation-error')) {
                                if (!$scope.dataItems[0].errors.some(e => e.participatingMembers.includes(element.property))) {
                                    element.element.classList.remove('tc-validation-error');
                                    // only remove yellow background, when field is empty
                                    if (!$scope.dataItems[0].entity[element.property]) {
                                        element.element.classList.remove('tc-validation-background');
                                    }
                                    element.element.title = '';
                                }
                                else {
                                    element.element.title = $scope.dataItems[0].errors.filter(e => e.participatingMembers.includes(element.property)).map(e => e.message).join('\x0A');
                                }
                            }
                            else {
                                if ($scope.dataItems[0].errors.some(e => e.participatingMembers.includes(element.property))) {
                                    element.element.classList.add('tc-validation-error');
                                    element.element.classList.add('tc-validation-background');
                                    element.element.title = $scope.dataItems[0].errors.filter(e => e.participatingMembers.includes(element.property)).map(e => e.message).join('\x0A');
                                }
                            }
                        }
                    });
                    $scope.navigate = ($event, url, target = null) => navigationService.navigate($event, url, target);
                    $scope.encodeUrl = (url) => { return urlEncode(url); };
                    $scope.clearShellCache = () => newForm.clearShellCache($scope);
                    $scope.removeFocus = () => newForm.hotkeysService.remove($scope.registeredHotkeys);
                    $scope.setFocus = () => newForm.registerHotkeys($scope);
                    $scope.decodeString = ((encodedString) => newForm.decodeString(encodedString));
                    $scope.copyToClipboard = (text, isBinary = false) => {
                        try {
                            if (isBinary) {
                                text = window.atob(text);
                            }
                            navigator.clipboard.writeText(text);
                        }
                        catch (error) {
                            var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                            appInsightsService.trackException(error);
                        }
                    };
                    //$scope.comboboxes = [];
                    $scope.backreferenceTabLists = [];
                    $scope.backreferenceCellLists = [];
                    $scope.windowResizeFunction = null;
                    //console.log("form initializing 2: " + moment().format("HH:mm:ss.SS"));
                    $scope.$on("$destroy", () => {
                        ResizeSensor.detach(element[0]);
                        $scope.validationManager.destroy();
                        if ($scope.windowResizeFunction) {
                            $(window).off("resize", null, $scope.windowResizeFunction);
                        }
                        // unregister at comboBoxService
                        CockpitFramework.Application.ApplicationService.getInjector().get("comboBoxService").removeFormScope($scope);
                        newForm.hotkeysService.remove($scope.registeredHotkeys);
                        if ($scope.unregisterWatch) {
                            $scope.unregisterWatch();
                        }
                        if ($scope.unregisterWatchIsNew1) {
                            $scope.unregisterWatchIsNew1();
                        }
                        if ($scope.unregisterWatchIsNew2) {
                            $scope.unregisterWatchIsNew2();
                        }
                        if ($scope.unregisterWatchFilterEntity) {
                            $scope.unregisterWatchFilterEntity();
                        }
                        $scope.destroyed = true;
                    });
                    if ($scope.control) {
                        $scope.control.getEntity = () => { return $scope.dataItems[0]; };
                        $scope.control.validate = (changedPropertyNames) => { return $scope.validate(changedPropertyNames); };
                    }
                    newForm.registerHotkeys($scope);
                    $scope.$on("viewLoaded", (event, scopeId) => {
                        if (!$scope.resizeHandlerAdded) {
                            //console.log("view loaded", $scope.element[0].clientWidth, $scope.modelEntity);
                            $timeout(() => {
                                new ResizeSensor($scope.element[0], function () {
                                    //console.log("view size changed", $scope.modelEntity, $scope.$id, $scope.element[0].clientWidth);
                                    $scope.formWidth = $scope.element[0].clientWidth;
                                    $scope.resizeHandlerAdded = true;
                                });
                            }, 0);
                        }
                    });
                    // update form if autoRefreshOnDataUpdates is set to true
                    $scope.$on("entityObjectSaved", (event, params) => {
                        var scope = event.currentScope;
                        if (!scope.filterEntityListName && scope.autoRefreshOnDataUpdates) {
                            // update backreference tabs
                            if (scope.modelEntity == params.modelEntity) {
                                newForm.reloadTabsAndBackReferenceCells(scope);
                            }
                            // update form
                            if (scope.dataItems && !scope.isNew && scope.modelEntity != params.modelEntity) {
                                $scope.validationManager.validate(scope, $scope.dataItems[0], [], true);
                            }
                            else if (scope.dataItems[0].entity && !scope.isNew && scope.modelEntity == params.modelEntity) {
                                $scope.validationManager.validate(scope, $scope.dataItems[0], [], true);
                            }
                        }
                    });
                    //console.log("form initializing 3: " + moment().format("HH:mm:ss.SS"));
                    for (var property in $scope.defaultValues) {
                        if ($scope.defaultValues.hasOwnProperty(property) && $scope.defaultValues[property]) {
                            $scope.defaultValues[property] = newForm.cofxHttp.transformResponseValue($scope.defaultValues[property]);
                        }
                    }
                    //console.log("form initializing 4: " + moment().format("HH:mm:ss.SS"));
                    newForm.loadEntity($scope);
                    // var startLog = new Date();
                    //console.log("transclude starting: " + moment().format("HH:mm:ss.SS"));
                    transclude($scope, function (clone, scope) {
                        element.find(".cofx-form-validator").first().append(clone);
                        // console.log("transclude finished: " + moment().format("HH:mm:ss.SS"));
                        $timeout(() => {
                            //console.log("transclude finished: " + moment().format("HH:mm:ss.SS"), $scope.modelEntity, "comboboxes: ", $scope.numberOfComboboxes, "autoload comboboxes: ", $scope.numberOfAutoLoadComboboxes);
                            if (!$scope.numberOfComboboxes) {
                                //console.log("initialize form - no comboboxes", $scope.modelEntity);
                                newForm.initializeForm($scope);
                            }
                            else if (!$scope.numberOfAutoLoadComboboxes && $scope.dataItems) {
                                //console.log("validate form - no autoload comboboxes", $scope.modelEntity);
                                $scope.validationManager.validate($scope, $scope.dataItems[0], [], true).then(() => {
                                    //console.log('validated', $scope.modelEntity);
                                    $timeout(() => {
                                        newForm.checkUnloadedComboboxes($scope);
                                    });
                                });
                            }
                        });
                    });
                    // var endLog = new Date();
                    // console.log("TRANSCLUDE: " + (endLog.getTime() - startLog.getTime()));
                    // console.log("form initializing 5: " + moment().format("HH:mm:ss.SS"));
                    $scope.unregisterWatchIsNew1 = $scope.$watch("isNew", (newValue, oldValue) => {
                        if (oldValue != newValue && newValue === false) {
                            newForm.updateTabItems($scope, true);
                        }
                    });
                    $scope.unregisterWatchFilterEntity = $scope.$watch("filterEntity", (newValue, oldValue) => {
                        if (newValue && (oldValue != newValue || !$scope.dataItems)) {
                            $scope.dataItems = [$scope.validationManager.createItem(newValue)];
                            $scope.validationManager.updateWatchExpression();
                            newForm.initializeForm($scope);
                        }
                    });
                    var updateElement = element;
                    $scope.comboboxesToLoad = 0;
                    //console.log("form initialized: " + moment().format("HH:mm:ss.SS"));
                    $timeout(() => {
                        //console.log("start $timeout: " + moment().format("HH:mm:ss.SS"));
                        if ($scope.destroyed)
                            return;
                        var tabStripDiv = $scope.element.find("div[kendo-tabstrip]");
                        tabStripDiv.kendoTabStrip({ scrollable: false });
                        $scope.allowScrollTabs = false;
                        // TODO: find better way to scroll tabs
                        $timeout(() => newForm.updateAllowScrollTabs($scope), 10);
                        $scope.windowResizeFunction = () => newForm.updateAllowScrollTabs($scope);
                        $(window).on("resize", null, null, $scope.windowResizeFunction);
                        $scope.validator = updateElement.find(".cofx-form-validator").data("kendoValidator");
                    });
                    $scope.$on("comboBoxAddedToScope", function (sender, eventArgs) {
                        if ($scope.destroyed)
                            return;
                        if (sender.targetScope.$id == $scope.$id) {
                            $scope.numberOfComboboxes++;
                            if (eventArgs.autoLoad) {
                                $scope.numberOfAutoLoadComboboxes++;
                            }
                        }
                    });
                    $scope.$on("comboBoxValuesLoading", (sender, eventArgs) => {
                        if ($scope.destroyed)
                            return;
                        ////if ($scope.numberOfAutoLoadComboboxes === null) {
                        ////    $scope.numberOfAutoLoadComboboxes = $scope.comboboxes.filter(c => c.autoLoad).length;
                        ////}
                        // console.log("start loadComboBoxValues " + eventArgs + ": " + moment().format("HH:mm:ss.SS"));
                        if (sender.targetScope.$id == $scope.$id) {
                            $scope.cofxBusyIndicatorService.addJob($scope, "loadComboBoxValues", "Load combobox " + eventArgs, { isBlocking: !$scope.formValidated });
                            $scope.comboboxesToLoad++;
                        }
                    });
                    $scope.$on("comboBoxValuesLoaded", (sender, eventArgs) => {
                        if ($scope.destroyed)
                            return;
                        if (sender.targetScope.$id == $scope.$id) {
                            $scope.cofxBusyIndicatorService.removeJob($scope, "loadComboBoxValues");
                            $scope.comboboxesToLoad--;
                        }
                        // console.log("finished loadComboBoxValues " + eventArgs + ": " + moment().format("HH:mm:ss.SS"), "remaining", $scope.comboboxesToLoad);
                    });
                    $scope.$on("comboBoxValuesReset", (sender, eventArgs) => {
                        if ($scope.destroyed)
                            return;
                        // console.log("finished loadComboBoxValues " + eventArgs + ": " + moment().format("HH:mm:ss.SS"));
                        if (sender.targetScope.$id == $scope.$id) {
                            $scope.cofxBusyIndicatorService.removeJob($scope, "loadComboBoxValues");
                            $scope.comboboxesToLoad--;
                        }
                        newForm.initializeForm($scope);
                    });
                    $scope.$on("allAutoLoadComboBoxesInitialized", (sender, eventArgs) => {
                        if ($scope.destroyed)
                            return;
                        if (sender.targetScope.$id == $scope.$id) {
                            //console.log("allAutoLoadComboBoxesInitialized", $scope.modelEntity);
                            //console.log('validate', $scope.modelEntity);
                            $scope.validationManager.validate($scope, $scope.dataItems[0], [], true).then(() => {
                                //console.log('validated', $scope.modelEntity);
                                $timeout(() => {
                                    this.checkUnloadedComboboxes($scope);
                                });
                            });
                        }
                    });
                    $scope.$on("allComboBoxesInitialized", (sender, eventArgs) => {
                        if ($scope.destroyed)
                            return;
                        if (sender.targetScope.$id == $scope.$id) {
                            //console.log("allComboBoxesInitialized", $scope.modelEntity);
                            $scope.allComboboxesInitialized = true;
                            if ($scope.formLoaded) {
                                // console.log("validate - allComboBoxesInitialized");
                                $scope.validationManager.validate($scope, $scope.dataItems[0], [], true);
                            }
                            newForm.initializeForm($scope);
                        }
                    });
                    $scope.$on("finishFormInitialization", (sender, eventArgs) => {
                        if ($scope.destroyed)
                            return;
                        if (sender.targetScope.$id == $scope.$id) {
                            newForm.finishInitialization($scope);
                        }
                    });
                };
                return newForm;
            }
            loadEntity($scope) {
                var deferred = this.$q.defer();
                // load entity
                //console.log("start load entity: ", $scope.modelEntity);
                if ($scope.entityUuid && !$scope.clone) {
                    $scope.isNew = false;
                    $scope.cofxBusyIndicatorService.addJob($scope, "loadEntity", "Load data");
                    var parameters = {};
                    parameters["EntityUuid"] = $scope.entityUuid;
                    this.dataContextService.selectByQuery($scope.query, { parameters: parameters, expandResult: false }).toPromise().then((response) => {
                        const changedPropertyNamesSinceLastSave = [];
                        // set values for update
                        if (response.length && $scope.valuesForUpdate) {
                            for (const key of Object.getOwnPropertyNames($scope.valuesForUpdate)) {
                                response[0][key] = $scope.valuesForUpdate[key];
                                changedPropertyNamesSinceLastSave.push(key);
                            }
                        }
                        //console.log("\entity loaded: ", $scope.modelEntity);
                        $scope.dataItems = [$scope.validationManager.createItem(response[0], $scope.entityUuid)];
                        $scope.validationManager.updateWatchExpression();
                        $scope.dataItems[0].changedPropertyNamesSinceLastSave = changedPropertyNamesSinceLastSave;
                        this.initializeForm($scope);
                        $scope.cofxBusyIndicatorService.removeJob($scope, "loadEntity");
                        //console.log("finished load entity: " + moment().format("HH:mm:ss.SS"));
                        deferred.resolve();
                    }, (error) => {
                        this.$log.error("Could not load entity object: " + JSON.stringify(error));
                        $scope.cofxBusyIndicatorService.removeJob($scope, "loadEntity");
                        deferred.reject();
                    });
                }
                else {
                    $scope.isNew = true;
                    // create entity
                    if (!$scope.dataItems) {
                        // check if model entity is set, otherwise this is a destroyed filter form
                        if ($scope.modelEntity) {
                            $scope.cofxBusyIndicatorService.addJob($scope, "loadEntity", "Load data");
                            var loadEntityPromise;
                            if ($scope.clone) {
                                if ($scope.entityUuid) {
                                    loadEntityPromise = this.dataContextService.cloneObject($scope.modelEntity, $scope.entityUuid).toPromise();
                                }
                                else {
                                    loadEntityPromise = this.dataContextService.getNewObjectFromTemplate($scope.modelEntity, this.buildDefaultValues($scope)).toPromise();
                                }
                            }
                            else {
                                loadEntityPromise = this.dataContextService.getNewObject($scope.modelEntity, this.buildDefaultValues($scope)).toPromise();
                            }
                            loadEntityPromise.then((result) => {
                                //console.log("\entity loaded: ", $scope.modelEntity);
                                $scope.dataItems = [$scope.validationManager.createItem(result)];
                                $scope.validationManager.updateWatchExpression();
                                $scope.dataItems[0].changedPropertyNamesSinceLastSave = [];
                                //console.log("finished load entity: " + moment().format("HH:mm:ss.SS"));
                                this.initializeForm($scope);
                                $scope.cofxBusyIndicatorService.removeJob($scope, "loadEntity");
                                deferred.resolve();
                            }, (error) => {
                                this.$log.error("Could not create entity: " + JSON.stringify(error));
                                $scope.cofxBusyIndicatorService.removeJob($scope, "loadEntity");
                                deferred.reject();
                            });
                        }
                        else {
                            deferred.resolve();
                        }
                    }
                    else {
                        this.initializeForm($scope);
                        deferred.resolve();
                    }
                }
                return deferred.promise;
            }
            buildDefaultValues(scope) {
                var that = this;
                var defaultValues = {};
                if (scope.defaultValuesFromFilter) {
                    for (var d in scope.defaultValuesFromFilter) {
                        if (scope.defaultValuesFromFilter.hasOwnProperty(d) && scope.defaultValuesFromFilter[d]) {
                            var property = scope.properties.filter(p => getNonPrefixedName(p) == getNonPrefixedName(d));
                            if (property.length > 0) {
                                if (scope.defaultValuesFromFilter[d] === CockpitFramework.Application.ApplicationService.getCurrentApplication().formConstants.Null) {
                                    defaultValues[property[0]] = null;
                                }
                                else {
                                    defaultValues[property[0]] = scope.defaultValuesFromFilter[d];
                                }
                            }
                            var relation = scope.relations.filter(r => getNonPrefixedName(r) + "Uuid" == getNonPrefixedName(d));
                            if (relation.length > 0) {
                                defaultValues[relation[0] + "Uuid"] = scope.defaultValuesFromFilter[d];
                            }
                        }
                    }
                }
                if (scope.defaultValues) {
                    for (var d in scope.defaultValues) {
                        if (scope.defaultValues.hasOwnProperty(d) && scope.defaultValues[d]) {
                            var property = scope.properties.filter(p => getNonPrefixedName(p) == getNonPrefixedName(d));
                            if (property.length > 0) {
                                defaultValues[property[0]] = scope.defaultValues[d];
                            }
                            var relation = scope.relations.filter(r => getNonPrefixedName(r) + "Uuid" == getNonPrefixedName(d));
                            if (relation.length > 0) {
                                defaultValues[relation[0] + "Uuid"] = scope.defaultValues[d];
                            }
                        }
                    }
                }
                return defaultValues;
            }
            initializeForm(scope) {
                var that = this;
                if (!scope.formLoaded) {
                }
                if (!scope.formLoaded && scope.dataItems && (scope.allComboboxesInitialized || !scope.numberOfAutoLoadComboboxes)) {
                    //console.log("initialize form", scope.modelEntity);
                    // disable backreference tabs
                    if (scope.isNew) {
                        this.updateTabItems(scope, false);
                    }
                    if (!scope.formValidated) {
                        // console.log("validate - initializeForm");
                        scope.validationManager.validate(scope, scope.dataItems[0], [], true).then((isValid) => {
                            if (scope.validator) {
                                scope.validator.validate();
                            }
                            that.$timeout(() => {
                                scope.formValidated = true;
                                that.checkUnloadedComboboxes(scope);
                            });
                        });
                    }
                    else {
                        that.checkUnloadedComboboxes(scope);
                    }
                }
            }
            checkUnloadedComboboxes(scope) {
                var that = this;
                CockpitFramework.Application.ApplicationService.getInjector().get("comboBoxService").checkUnloadedComboboxes(scope);
                // load remaining comboboxs with autoLoad="false"
                ////var unloadedComboboxes = 0;
                ////scope.comboboxes.forEach(c => { initializeForm
                ////    if (!c.autoLoad && !c.initialized) {
                ////        unloadedComboboxes++;
                ////        if (c.initializeDataSource) {
                ////            c.initializeDataSource();
                ////        } else {
                ////            c.forceAutoLoad = true;
                ////        }
                ////    }
                ////});
                ////if (unloadedComboboxes == 0) {
                ////    that.finishInitialization(scope);
                ////}
                // console.log("checkUnloadedComboboxes", "comboboxes to load", scope.comboboxesToLoad);
                ////if (scope.comboboxesToLoad === 0) {
                ////	that.finishInitialization(scope);
                ////}
            }
            finishInitialization(scope) {
                var that = this;
                console.log("finish initialize form", scope.modelEntity);
                if (scope.editModelEntityName && !scope.filterEntity) {
                    var loadTime = moment().diff(scope.loadStartTime, "ms");
                    var message = "form load time (" + window.location.pathname + ", " + scope.modelEntity + "): " + loadTime.toString();
                    var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                    appInsightsService.trackEvent("load form", { "path": window.location.pathname }, { "loadTime": loadTime });
                    that.$log.info(message);
                }
                scope.$emit("formLoaded", null);
                scope.formLoaded = true;
                that.setFocus(scope);
                that.setWatchFunction(scope);
                // load backreferencecells if isNew has changed to false
                scope.unregisterWatchIsNew2 = scope.$watch("isNew", (newValue, oldValue, scope) => {
                    if (oldValue && !newValue) {
                        that.loadBackReferenceCells(scope);
                    }
                });
                // load backreferencecells
                if (!scope.isNew) {
                    that.loadBackReferenceCells(scope);
                }
            }
            setWatchFunction(scope) {
                var that = this;
                scope.unregisterWatch = scope.$watch((scope) => angular.toJson(scope.dataItems[0].entity), (newValue, oldValue, scope) => {
                    if (newValue && oldValue && oldValue != newValue) {
                        var changedProperties = [];
                        var oldObject = angular.fromJson(oldValue);
                        var newObject = angular.fromJson(newValue);
                        // check if entity has changed
                        for (var property in scope.dataItems[0].entity) {
                            if (!oldObject || (scope.dataItems[0].entity.hasOwnProperty(property) && scope.calculatedProperties.indexOf(property) < 0 && !angular.isObject(newObject[property]) && newObject[property] != oldObject[property])) {
                                changedProperties.push(property);
                                if (scope.changedProperties.includes(property)) {
                                    scope.changedProperties.push(property);
                                }
                                if (scope.dataItems[0].changedPropertyNamesSinceLastSave.indexOf(property) < 0 && (!scope.ignoreUpdatedPropertiesFromValidationManager || scope.ignoreUpdatedPropertiesFromValidationManager.indexOf(property) < 0)) {
                                    scope.dataItems[0].changedPropertyNamesSinceLastSave.push(property);
                                }
                            }
                        }
                        if (!scope.ignoreUpdatedPropertiesFromValidationManager) {
                            scope.ignoreUpdatedPropertiesFromValidationManager = [];
                        }
                        // check if validationTriggerProperties are affected
                        if (changedProperties.length > 0) {
                            var validate = false;
                            changedProperties.forEach((p, index) => validate = scope.validationTriggerProperties.indexOf(p) >= 0 || validate);
                            if (validate) {
                                scope.validationManager.validate(scope, scope.dataItems[0], changedProperties);
                            }
                        }
                    }
                });
            }
            loadBackReferenceCells(scope) {
                var that = this;
                that.$translate(["cofx.data.form.loadBackReferenceCells", "cofx.data.form.loadBackReferenceTabs"]).then((translate) => {
                    if (scope.backreferenceCellLists.length > 0) {
                        var cellPromises = [];
                        var hasBackReferenceCellOnFirstTab = scope.element.find("div[kendo-tabstrip] div.k-content").first().find("div[cofx-include-list]").length > 0;
                        scope.cofxBusyIndicatorService.addJob(scope, "loadBackReferenceCells", translate["cofx.data.form.loadBackReferenceCells"], { isBlocking: hasBackReferenceCellOnFirstTab });
                        that.$timeout(() => {
                            scope.backreferenceCellLists.forEach((item) => {
                                cellPromises.push(item.loadData(true));
                                if (scope.autoRefreshOnDataUpdates) {
                                    item.actionExecuted = (result) => {
                                        // update backreference tabs
                                        this.reloadTabsAndBackReferenceCells(scope);
                                        // update form
                                        if (scope.dataItems && scope.dataItems.length && !scope.isNew) {
                                            scope.validationManager.validate(scope, scope.dataItems[0], [], true);
                                        }
                                    };
                                }
                                ;
                            });
                            that.$q.all(cellPromises).finally(() => {
                                scope.cofxBusyIndicatorService.removeJob(scope, "loadBackReferenceCells");
                            });
                        });
                    }
                    if (scope.backreferenceTabLists.length > 0) {
                        var tabPromises = [];
                        scope.cofxBusyIndicatorService.addJob(scope, "loadBackReferenceTabs", translate["cofx.data.form.loadBackReferenceCells"], { isBlocking: false });
                        that.$timeout(() => {
                            scope.backreferenceTabLists.forEach((item) => {
                                if (item && !item.initialized) {
                                    item.initialized = true;
                                    tabPromises.push(item.loadData(true));
                                    if (scope.autoRefreshOnDataUpdates) {
                                        item.actionExecuted = (result) => {
                                            // update backreference tabs
                                            this.reloadTabsAndBackReferenceCells(scope);
                                            // update form
                                            if (scope.dataItems && scope.dataItems.length && !scope.isNew) {
                                                scope.validationManager.validate(scope, scope.dataItems[0], [], true);
                                            }
                                        };
                                    }
                                    ;
                                }
                            });
                            that.$q.all(tabPromises).finally(() => {
                                scope.cofxBusyIndicatorService.removeJob(scope, "loadBackReferenceTabs");
                            });
                        });
                    }
                });
            }
            fileUploaded(scope, e) {
                var that = this;
                var fileReader = new FileReader();
                var size = e.files[0].size;
                var name = e.files[0].name;
                var options = e.sender.options;
                var extension = e.files[0].extension;
                var mimeType = e.files[0].rawFile.type;
                e.preventDefault();
                if (size > options.validation.maxFileSize) {
                    that.$translate(["cofx.data.form.fileTooLarge.title", "cofx.data.form.fileTooLarge.description"], { size: Math.round(options.validation.maxFileSize / 1024).toString() }).then(values => {
                        var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                        messageService.alert("filetoolarge", values["cofx.data.form.fileTooLarge.title"], values["cofx.data.form.fileTooLarge.description"]);
                    });
                    return;
                }
                if (options.validation.allowedExtensions && options.validation.allowedExtensions.length > 0 && options.validation.allowedExtensions.map((e) => e.toLowerCase()).indexOf(extension.toLowerCase()) < 0) {
                    that.$translate(["cofx.data.form.extensionNotValid.title", "cofx.data.form.extensionNotValid.description"], { extensions: options.validation.allowedExtensions.join(", ") }).then(values => {
                        var messageService = CockpitFramework.Application.ApplicationService.getInjector().get("messageService");
                        messageService.alert("extensionnotvalid", values["cofx.data.form.extensionNotValid.title"], values["cofx.data.form.extensionNotValid.description"]);
                    });
                    return;
                }
                scope.$apply(() => {
                    scope.cofxBusyIndicatorService.addJob(scope, "fileupload", "File Upload");
                });
                fileReader.onload = (event) => {
                    scope.$apply(() => {
                        var result = event.target.result.split(";");
                        var mimeType = result[0].replace(/^data:/, "");
                        var file = result[1].replace(/^base64,/, "");
                        scope.dataItems[0].entity[options.tcFileNameProperty] = name;
                        scope.dataItems[0].entity[options.tcFileSizeProperty] = size;
                        scope.dataItems[0].entity[options.tcFileMimeTypeProperty] = mimeType;
                        scope.dataItems[0].entity[options.tcFileProperty] = file;
                        scope.cofxBusyIndicatorService.removeJob(scope, "fileupload");
                    });
                };
                fileReader.readAsDataURL(e.files[0].rawFile);
            }
            removeFile(scope, file) {
                scope.dataItems[0].entity[file.fileNameProperty] = null;
                scope.dataItems[0].entity[file.fileSizeProperty] = 0;
                scope.dataItems[0].entity[file.fileMimeTypeProperty] = null;
                scope.dataItems[0].entity[file.fileProperty] = null;
            }
            activateTab(scope, e) {
                var index = e.item.getAttribute("backreference-tab-index");
                if (index) {
                    var backreferenceTabIndex = parseInt(index);
                    var backreferenceTabs = scope.element.find(".cofx-form-backreference-tab div[cofx-include-list]");
                    if (scope.backreferenceTabLists.length > backreferenceTabIndex) {
                        var backreferenceTabScope = scope.backreferenceTabLists[backreferenceTabIndex];
                        this.$translate("cofx.data.form.loadBackReferenceTabs").then((translate) => {
                            scope.cofxBusyIndicatorService.addJob(scope, "loadBackReferenceTab", translate, { isBlocking: !backreferenceTabScope.dataLoaded });
                            this.$timeout(() => {
                                backreferenceTabScope.$broadcast("viewLoaded");
                                backreferenceTabScope.loadData(false).then(() => {
                                    if (backreferenceTabScope.list) {
                                        backreferenceTabScope.list.resizeColumns();
                                    }
                                    scope.cofxBusyIndicatorService.removeJob(scope, "loadBackReferenceTab");
                                });
                            });
                        });
                    }
                }
                else {
                    if (scope.backreferenceCellLists.length > 0) {
                        this.$timeout(() => {
                            scope.backreferenceCellLists.forEach((item) => {
                                if (item.list) {
                                    item.list.resizeColumns();
                                }
                            });
                        });
                    }
                }
            }
            reloadTabsAndBackReferenceCells(scope) {
                var that = this;
                that.$translate(["cofx.data.form.loadBackReferenceCells", "cofx.data.form.loadBackReferenceTabs"]).then((translate) => {
                    if (scope.backreferenceCellLists.length > 0) {
                        var cellPromises = [];
                        scope.cofxBusyIndicatorService.addJob(scope, "loadBackReferenceCells", translate["cofx.data.form.loadBackReferenceCells"]);
                        that.$timeout(() => {
                            scope.backreferenceCellLists.forEach((item) => {
                                if (item.list) {
                                    cellPromises.push(item.list.applyFilter(false));
                                }
                            });
                            that.$q.all(cellPromises).finally(() => {
                                scope.cofxBusyIndicatorService.removeJob(scope, "loadBackReferenceCells");
                            });
                        });
                    }
                    if (scope.backreferenceTabLists.length > 0) {
                        var tabPromises = [];
                        scope.cofxBusyIndicatorService.addJob(scope, "loadBackReferenceTabs", translate["cofx.data.form.loadBackReferenceTabs"]);
                        that.$timeout(() => {
                            scope.backreferenceTabLists.forEach((item) => {
                                if (item.list) {
                                    tabPromises.push(item.list.applyFilter(false));
                                }
                            });
                            that.$q.all(tabPromises).finally(() => {
                                scope.cofxBusyIndicatorService.removeJob(scope, "loadBackReferenceTabs");
                            });
                        });
                    }
                });
            }
            updateAllowScrollTabs(scope) {
                var tabStrip = scope.element.find("ul.k-tabstrip-items");
                if (tabStrip.length > 0) {
                    scope.allowScrollTabs = tabStrip[0].scrollWidth > tabStrip[0].clientWidth;
                }
                //this.updateFormWidth(scope);
            }
            /*private updateFormWidth(scope: IFormScope) {
                if (scope.element) {
                    scope.formWidth = scope.element.width();
                    if (!scope.formWidth) {
                        var parentForm = scope.element.parents(".cofx-form");
                        if (parentForm.length > 0) {
                            scope.formWidth = parentForm.width();
    
                            if (!scope.formWidth) {
                                scope.formWidth = window.innerWidth;
                            }
                        }
                    }
    
                    console.log('set form width', scope.modelEntity, scope.formWidth);
                }
            }*/
            scrollTabsLeft(scope) {
                var item = scope.element.find("ul.k-tabstrip-items");
                if (item.length == 1) {
                    var left = item.scrollLeft();
                    scope.element.find("ul.k-tabstrip-items").scrollLeft(Math.max(0, left - 30));
                }
            }
            scrollTabsRight(scope) {
                var item = scope.element.find("ul.k-tabstrip-items");
                if (item.length == 1) {
                    var left = item.scrollLeft();
                    scope.element.find("ul.k-tabstrip-items").scrollLeft(Math.min(item[0].scrollWidth - item[0].clientWidth, left + 30));
                }
            }
            updateValues(scope, entityObject, originalEntityObject, ignorePropertyChanges = false) {
                var that = this;
                var hasWatchFunction = scope.unregisterWatch != null;
                if (ignorePropertyChanges && hasWatchFunction) {
                    scope.unregisterWatch();
                }
                if (!originalEntityObject) {
                    originalEntityObject = scope.dataItems[0].entity;
                }
                try {
                    for (var property in scope.dataItems[0].entity) {
                        if (scope.dataItems[0].entity.hasOwnProperty(property) && entityObject.hasOwnProperty(property) && property != "odata.metadata") {
                            var entityValue = scope.dataItems[0].entity[property];
                            var entityObjectValue = entityObject[property];
                            var originalEntityObjectValue = originalEntityObject[property];
                            if (angular.isDate(entityValue)) {
                                entityValue = moment(entityValue).unix();
                            }
                            if (angular.isDate(entityObjectValue)) {
                                entityObjectValue = moment(entityObjectValue).unix();
                            }
                            if (angular.isDate(originalEntityObjectValue)) {
                                originalEntityObjectValue = moment(originalEntityObjectValue).unix();
                            }
                            if (entityValue != entityObjectValue && (!originalEntityObject || entityValue == originalEntityObjectValue)) {
                                scope.dataItems[0].entity[property] = entityObject[property];
                            }
                        }
                    }
                }
                catch (e) {
                    console.warn("Could not update properties: " + JSON.stringify(e));
                }
                finally {
                    if (ignorePropertyChanges && hasWatchFunction) {
                        that.setWatchFunction(scope);
                    }
                }
            }
            actionExecuted(scope, result) {
                var that = this;
                // TODO: replace by validation manager
                that.updateValues(scope, result.items[0], scope.dataItems[0].entity);
                scope.hasChanges = true;
                ////result.items[0];
                ////scope.validationManager.validate(scope, scope.dataItems[0], [], true);
                if (scope.autoRefreshOnDataUpdates) {
                    that.reloadTabsAndBackReferenceCells(scope);
                }
            }
            updateTabItems($scope, enabled) {
                var tabStripDiv = $scope.element.find("div[kendo-tabstrip]");
                if (tabStripDiv) {
                    var tabStrip = tabStripDiv.data("kendoTabStrip");
                    if (tabStrip) {
                        $scope.element.find("li[backreference-tab-index]").toArray().forEach((item) => {
                            if (enabled) {
                                tabStrip.enable(item);
                            }
                            else {
                                tabStrip.disable(item);
                            }
                        });
                    }
                }
            }
            clearShellCache(scope) {
                // TODO: confirm dialog
                var currentScope = scope;
                while (currentScope.$parent) {
                    currentScope = currentScope.$parent;
                    if (currentScope.clearCache) {
                        currentScope.clearCache();
                        break;
                    }
                }
                var $injector = CockpitFramework.Application.ApplicationService.getInjector();
                var applicationService = $injector.get("applicationService");
                applicationService.clearCache();
            }
            registerHotkeys(scope) {
                var that = this;
                if (scope.registeredHotkeys.length) {
                    that.hotkeysService.add(scope.registeredHotkeys);
                }
                else {
                    if (scope.formActions) {
                        scope.formActions.forEach(formAction => {
                            if (formAction.hotkey) {
                                scope.registeredHotkeys.push(that.hotkeysService.createHotkey(formAction.hotkey, formAction.hotkeyDescription, (event, hotkeys) => formAction.hotkeyFunction(event, hotkeys, scope), ["INPUT", "SELECT", "TEXTAREA"]));
                            }
                        });
                    }
                    that.hotkeysService.add(scope.registeredHotkeys);
                }
            }
            setFocus(scope) {
                if ($(scope.element).find($(document.activeElement)).length < 1) {
                    Controls.FormHelperFunctions.setFocusedElement(scope.element);
                }
            }
            decodeString(encodedString) {
                if (encodedString) {
                    if (encodedString.indexOf("data:") == 0) {
                        return encodedString;
                    }
                    else {
                        return window.atob(encodedString);
                    }
                }
                else {
                    return null;
                }
            }
        }
        Controls.Form = Form;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="ViewService.ts" />
/// <reference path="../../TypeScript/Application/ApplicationService.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        class ViewsAreaScopeDeclaration {
        }
        Controls.ViewsAreaScopeDeclaration = ViewsAreaScopeDeclaration;
        class ViewsArea {
            constructor() {
                this.compiledTemplateCache = {};
            }
            static Create($timeout, $compile, $window, $templateCache, $log, cofxHttp, cofxViewService, cofxBusyIndicatorService) {
                var newViewsArea = new ViewsArea();
                // TODO: update right position when multiple views are displayed
                newViewsArea.restrict = "EA";
                newViewsArea.template = "<div class=\"cofx-views-area\" ng-show=\"cofxViewService.views().length > 0\">\
	<div ng-repeat=\"view in cofxViewService.views()\" class=\"cofx-view\" ng-style=\"{ 'margin-left': $index * 40 + 'px' }\">\
		<div class=\"cofx-views-area-view\" ng-style=\"{ 'width': getWidth(view.width) }\">\
			<div class=\"cofx-view-content\" ng-show=\"view.isLoaded\"></div>\
		</div>\
	</div>\
	<div ng-show=\"isBusy\" ng-style=\"{ 'margin-left': (cofxViewService.views().length - 1) * 40 + 'px' }\">\
		<div cofx-busy-indicator ng-style=\"{ 'width': getWidth(cofxViewService.views()[0].width) }\" class=\"cofx-views-area-busy-indicator\"></div>\
	</div>\
</div>";
                newViewsArea.scope = new ViewsAreaScopeDeclaration();
                newViewsArea.$compile = $compile;
                newViewsArea.$timeout = $timeout;
                newViewsArea.cofxHttp = cofxHttp;
                newViewsArea.$window = $window;
                newViewsArea.$templateCache = $templateCache;
                newViewsArea.$log = $log;
                newViewsArea.cofxBusyIndicatorService = cofxBusyIndicatorService;
                // Initialize component
                newViewsArea.link = function ($scope, element, attrs) {
                    newViewsArea.$scope = $scope;
                    newViewsArea.$scope.cofxViewService = cofxViewService;
                    newViewsArea.$scope.closeView = (view) => newViewsArea.$scope.cofxViewService.closeView(view, null);
                    newViewsArea.$scope.cofxViewService.onViewAdded((view) => newViewsArea.viewAdded(view));
                    newViewsArea.$scope.getWidth = (width) => {
                        if (angular.isString(width)) {
                            return width;
                        }
                        else {
                            return width + 'px';
                        }
                    };
                    newViewsArea.rootElement = element.find(".cofx-views-area")[0];
                    newViewsArea.$scope.$on("viewClosed", (eventArgs, viewClosedEventArgs) => {
                        //element.find("input,select,textarea").blur();
                        newViewsArea.$scope.cofxViewService.closeView(newViewsArea.$scope.cofxViewService.views()[newViewsArea.$scope.cofxViewService.views().length - 1], viewClosedEventArgs);
                    });
                    // clear cache when data context is refreshed
                    var $injector = CockpitFramework.Application.ApplicationService.getInjector();
                    var applicationService = $injector.get("applicationService");
                    applicationService.dataContextRefreshed.subscribe(() => {
                        this.compiledTemplateCache = {};
                    });
                };
                return newViewsArea;
            }
            viewAdded(view) {
                var that = this;
                that.cofxBusyIndicatorService.addJob(that.$scope, "loadView", "Load " + view.title);
                that.$timeout(() => {
                    if (view.url) {
                        that.cofxHttp.get(view.url, { cache: that.$templateCache })
                            .then((response) => {
                            var appInsightsService = CockpitFramework.Application.ApplicationService.getInjector().get("appInsightsService");
                            appInsightsService.trackPageView(view.title, view.url);
                            that.renderContent(view, response.data);
                        }, (exception) => {
                            that.$log.error(exception);
                            that.cofxBusyIndicatorService.removeJob(that.$scope, "loadView");
                        }).finally(() => {
                        });
                    }
                    else if (view.content) {
                        that.renderContent(view, view.content);
                    }
                    else {
                        that.$log.error("Could not open view, no url and no conent is specified.");
                        that.cofxBusyIndicatorService.removeJob(that.$scope, "loadView");
                    }
                });
            }
            compileView(view, content) {
                var that = this;
                ////console.log("start compile: " + moment().format("HH:mm:ss.SS"));
                var key = view.url;
                if (!key && view.content) {
                    key = view.content;
                }
                var html = $("<div class=\"cofx-view-inner-content\">" + content + "</div>");
                var elementWithWidth = html.find("[data-default-form-width]");
                if (elementWithWidth.length > 0) {
                    var width = elementWithWidth.first().data("default-form-width");
                    view.width = width;
                }
                if (!that.compiledTemplateCache[key]) {
                    that.compiledTemplateCache[key] = that.$compile(html);
                }
                ////console.log("finished compile: " + moment().format("HH:mm:ss.SS"));
                var template = that.compiledTemplateCache[key];
                return template;
            }
            renderContent(view, content) {
                var that = this;
                ////console.log("start link: " + moment().format("HH:mm:ss.SS"));
                that.$timeout(() => {
                    var compiledView = that.compileView(view, content);
                    var scope = that.$scope.$new(true);
                    for (var parameter in view.scopeParameters) {
                        if (view.scopeParameters.hasOwnProperty(parameter)) {
                            scope[parameter] = view.scopeParameters[parameter];
                        }
                    }
                    view.scope = scope;
                    compiledView(scope, (clonedElement) => {
                        $(that.rootElement).find(".cofx-view-content").last().append(clonedElement);
                    });
                    ////console.log("finished link: " + moment().format("HH:mm:ss.SS"));
                    that.$timeout(() => {
                        view.isLoaded = true;
                        view.scope.$broadcast('viewLoaded');
                        that.cofxBusyIndicatorService.removeJob(that.$scope, "loadView");
                    });
                    if (view.onLoaded) {
                        view.onLoaded();
                    }
                });
            }
        }
        Controls.ViewsArea = ViewsArea;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
"use strict";
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        /**
        * Sets the visibility of an element.
        * @class
        */
        class Visible {
            /**
            * Creates a new Visible directive.
            */
            static Create() {
                var visible = new Visible();
                visible.restrict = "A";
                // Initialize component
                visible.link = function (scope, element, attrs) {
                    scope.$watch(attrs["cofxVisible"], (value) => {
                        Visible.setValue(element, value, "cofxVisible");
                    });
                };
                return visible;
            }
            static setValue(element, value, source) {
                if (value && (value === true || (angular.isString(value) && (value.toLowerCase() == "true" || value.toLowerCase() == "visible")))) {
                    element.removeClass("ng-hide");
                }
                else {
                    element.addClass("ng-hide");
                }
            }
        }
        Controls.Visible = Visible;
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="ActionManager.ts" />
/// <reference path="BusyIndicator.ts" />
/// <reference path="BusyIndicatorService.ts" />
/// <reference path="EditEntityService.ts" />
/// <reference path="Filter.ts" />
/// <reference path="Form.ts" />
/// <reference path="FormScope.ts" />
/// <reference path="IncludeList.ts" />
/// <reference path="ViewsArea.ts" />
/// <reference path="ViewService.ts" />
/// <reference path="Visible.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Controls;
    (function (Controls) {
        var cockpitFrameworkControlModule = angular.module("cockpitframework.controls", ["pascalprecht.translate", "kendo.directives", "cockpitframework.data"]);
        cockpitFrameworkControlModule.directive("cofxBusyIndicator", ["$timeout", Controls.BusyIndicator.Create]);
        cockpitFrameworkControlModule.directive("cofxForm", ["$timeout", "$compile", "$sce", "$log", "$q", "$translate", "cofxHttp", "cofxBusyIndicatorService", "cofxViewService", Controls.Form.Create]);
        cockpitFrameworkControlModule.directive("cofxFilter", ["$timeout", "$compile", "$sce", "$log", "$q", "$translate", Controls.Filter.Create]);
        cockpitFrameworkControlModule.directive("cofxIncludeList", ["$templateCache", "$timeout", "$compile", "$controller", "$q", "cofxHttp", Controls.IncludeList.Create]);
        cockpitFrameworkControlModule.directive("cofxViewsArea", ["$timeout", "$compile", "$window", "$templateCache", "$log", "cofxHttp", "cofxViewService", "cofxBusyIndicatorService", Controls.ViewsArea.Create]);
        cockpitFrameworkControlModule.directive("cofxVisible", [Controls.Visible.Create]);
        cockpitFrameworkControlModule.service("cofxBusyIndicatorService", ["$timeout", "$log", Controls.BusyIndicatorService]);
        cockpitFrameworkControlModule.service("cofxEditEntityService", ["$rootScope", "$q", "$location", "$timeout", "$log", "$translate", "cofxViewService", "cofxBusyIndicatorService", Controls.EditEntityService]);
        cockpitFrameworkControlModule.service("cofxViewService", [Controls.ViewService]);
    })(Controls = CockpitFramework.Controls || (CockpitFramework.Controls = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
var CockpitFramework;
(function (CockpitFramework) {
    var Data;
    (function (Data) {
        class DataSourceGroupItem {
            constructor() {
                this.showWhenGrouped = false;
            }
        }
        Data.DataSourceGroupItem = DataSourceGroupItem;
        ;
        class ArrayService {
            constructor() {
                this.arrayService = CockpitFramework.Application.ApplicationService.getInjector().get("arrayService");
            }
            groupByFunction(items, accessor) {
                var groups = {};
                for (var i = 0; i < items.length; i++) {
                    var group = JSON.stringify(accessor(items[i]));
                    if (group in groups) {
                        groups[group].push(items[i]);
                    }
                    else {
                        groups[group] = [items[i]];
                    }
                }
                var array = [];
                for (var item in groups) {
                    array.push(groups[item]);
                }
                var result = [];
                array.forEach(item => {
                    result.push({ key: accessor(item[0]), values: item.map(i => { return i; }) });
                });
                return result;
            }
            groupBy(items, groupState, options = null) {
                var that = this;
                return that.group(items, groupState, 0, null, options);
            }
            flatten(items) {
                var that = this;
                var result = [];
                that.flattenArray(items, result, 0, []);
                return result;
            }
            aggregate(items, field, aggregate) {
                var values;
                var internalItems = items;
                field.split(".").forEach((field) => {
                    internalItems = internalItems.map((i) => i[field]);
                });
                values = internalItems;
                var result = null;
                if (aggregate == "min") {
                    result = values.sort()[0];
                }
                else if (aggregate == "max") {
                    result = values.sort()[values.length - 1];
                }
                else if (aggregate == "average") {
                    result = values.reduce((previousValue, currentValue, index, array) => {
                        return previousValue + currentValue;
                    }, 0) / values.length;
                }
                else {
                    result = values.reduce((previousValue, currentValue, index, array) => {
                        return previousValue + currentValue;
                    }, 0);
                }
                return result;
            }
            sort(items, column, groupState, dir) {
                var that = this;
                if (!groupState || groupState.length == 0) {
                    var that = this;
                    var field = column.field;
                    var result = 0;
                    items.sort((a, b) => {
                        if (dir) {
                            result = that.compare(that.getMember(a, field), that.getMember(b, field), column.tcDataType);
                            if (result == 0) {
                                result = that.compare(a.ObjectUuid, b.ObjectUuid, "String");
                            }
                            if (dir == "desc") {
                                result = result * -1;
                            }
                            return result;
                        }
                        else {
                            return that.compare(a.ObjectUuid, b.ObjectUuid, "String");
                        }
                    });
                    return items;
                }
                else {
                    var startIndex = -1;
                    var index = 0;
                    var newItems = [];
                    items.forEach((item) => {
                        if (item.isGroup) {
                            if (startIndex >= 0) {
                                var subItems = that.sort(items.slice(startIndex, index), column, null, dir);
                                subItems.forEach(subItem => {
                                    newItems.push(subItem);
                                });
                                startIndex = -1;
                            }
                            newItems.push(item);
                        }
                        else if (startIndex < 0) {
                            startIndex = index;
                        }
                        index++;
                    });
                    if (startIndex >= 0) {
                        var subItems = that.sort(items.slice(startIndex, index), column, null, dir);
                        subItems.forEach(subItem => {
                            newItems.push(subItem);
                        });
                    }
                    return newItems;
                }
            }
            compare(value1, value2, dataType) {
                if (!value1 && !value2) {
                    return 0;
                }
                else if (!value1) {
                    return -1;
                }
                else if (!value2) {
                    return 1;
                }
                else {
                    if (dataType == "String") {
                        if (value2.toString().toLowerCase().localeCompare(value1.toString().toLowerCase()) > 0) {
                            return -1;
                        }
                        else if (value2.toString().toLowerCase().localeCompare(value1.toString().toLowerCase()) < 0) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    }
                    else if (dataType == "Boolean") {
                        if (value2 > value1) {
                            return -1;
                        }
                        else if (value2 < value1) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    }
                    else if (dataType == "Decimal") {
                        if (value2 > value1) {
                            return -1;
                        }
                        else if (value2 < value1) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    }
                    else if (dataType == "DateTime") {
                        if (value2.valueOf() > value1.valueOf()) {
                            return -1;
                        }
                        else if (value2.valueOf() < value1.valueOf()) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    }
                    else {
                        return 0;
                    }
                }
            }
            group(items, groupState, level, parentFullHeader = null, options = null) {
                var that = this;
                if (level >= groupState.length) {
                    return items;
                }
                var groupItem = groupState[level];
                var groupedArray = items.map(item => that.getMember(item, groupItem.field)).sort((value1, value2) => {
                    var result = 0;
                    if (groupItem.dataType === "Boolean") {
                        if ((value1 !== null && value1 !== undefined) && (value2 === null || value2 === undefined)) {
                            result = 1;
                        }
                        else if ((value1 === null || value1 === undefined) && (value2 !== null && value2 !== undefined)) {
                            result = -1;
                        }
                        else if (value1 > value2) {
                            result = 1;
                        }
                        else if (value1 < value2) {
                            result = -1;
                        }
                    }
                    else {
                        if (value1 && !value2) {
                            result = 1;
                        }
                        else if (!value1 && value2) {
                            result = -1;
                        }
                        else if (!value1 && !value2) {
                            result = 0;
                        }
                        else if (typeof value1 === 'string' && typeof value2 === 'string') {
                            if (value2.toString().localeCompare(value1.toString()) > 0) {
                                result = -1;
                            }
                            else if (value2.toString().localeCompare(value1.toString()) < 0) {
                                result = 1;
                            }
                        }
                        else if (value1 > value2) {
                            result = 1;
                        }
                        else if (value1 < value2) {
                            result = -1;
                        }
                    }
                    if (groupItem.dir == "desc") {
                        result = result * -1;
                    }
                    return result;
                });
                groupedArray = groupedArray.reduce(function (previousValue, currentValue, index, array) {
                    if (previousValue.length <= 0 || that.buildHeader(groupItem, currentValue, options) != previousValue[previousValue.length - 1].header) {
                        // create new group row
                        var newRow = new Object();
                        newRow.header = that.buildHeader(groupItem, currentValue, options);
                        newRow.isExpanded = true;
                        if (parentFullHeader) {
                            newRow.fullHeader = parentFullHeader + "_" + newRow.header;
                        }
                        else {
                            newRow.fullHeader = newRow.header;
                        }
                        var subItems = items.filter(item => that.buildHeader(groupItem, that.getMember(item, groupItem.field), options) === newRow.header);
                        //var subItems = items.filter(item => that.getMember(item, groupItem.field) == currentValue);
                        newRow.expressions = angular.copy(subItems[0].expressions);
                        if (newRow.expressions) {
                            Object.getOwnPropertyNames(newRow.expressions).forEach(property => {
                                newRow.expressions[property].value = null;
                            });
                        }
                        newRow.items = that.group(subItems, groupState, level + 1, newRow.fullHeader, options);
                        previousValue.push(newRow);
                    }
                    return previousValue;
                }, []);
                return groupedArray;
            }
            buildHeader(groupItem, title, options = null) {
                var that = this;
                var newTitle = title;
                if ((!title && groupItem.dataType != "Boolean") || title === undefined || title === null) {
                    newTitle = "-";
                }
                else {
                    if (groupItem.dataType == "DateTime") {
                        const date = getTimezoneDate(title);
                        newTitle = kendo.toString(date, groupItem.formatPattern ? groupItem.formatPattern : "g");
                        if (newTitle.indexOf('ww') >= 0) {
                            newTitle = newTitle.replace(/ww/, this.arrayService.getCalendarWeek(date).toString());
                        }
                    }
                    else if (groupItem.dataType == "Date") {
                        const date = getTimezoneDate(title);
                        newTitle = kendo.toString(date, groupItem.formatPattern ? groupItem.formatPattern : "d");
                        if (newTitle.indexOf('ww') >= 0) {
                            newTitle = newTitle.replace(/ww/, this.arrayService.getCalendarWeek(date).toString());
                        }
                    }
                    else if (groupItem.dataType == "Decimal") {
                        newTitle = kendo.toString(kendo.parseFloat(title), groupItem.formatPattern ? groupItem.formatPattern : "0.00");
                    }
                    else if (groupItem.dataType == "Boolean") {
                        if (title === true) {
                            newTitle = (options && options.trueText) ? options.trueText : "true";
                        }
                        else if (title === false) {
                            newTitle = (options && options.falseText) ? options.falseText : "false";
                        }
                        else {
                            newTitle = "-";
                        }
                    }
                }
                return groupItem.title + (groupItem.title ? ": " : "") + newTitle;
            }
            flattenArray(items, result, level, parentGroups) {
                var that = this;
                items.forEach((item) => {
                    item.level = level;
                    item.isGroup = false;
                    result.push(item);
                    if (item.items) {
                        item.isGroup = true;
                        item.entity = { expressions: item.expressions };
                        var count = parentGroups.filter(g => g.level < item.level).length;
                        parentGroups = parentGroups.slice(0, count);
                        parentGroups.push(item);
                        that.flattenArray(item.items, result, level + 1, parentGroups);
                    }
                });
            }
            getMember(item, path) {
                var result = item;
                path.split(".").forEach((member) => {
                    if (result != null) {
                        result = result[member];
                    }
                });
                return result;
            }
        }
        Data.ArrayService = ArrayService;
    })(Data = CockpitFramework.Data || (CockpitFramework.Data = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../Application/ApplicationService.ts" />
/**
 * The cofxHttpService provides methods to communicate with the server.
 */
var CockpitFramework;
(function (CockpitFramework) {
    var Data;
    (function (Data) {
        class HttpProvider {
            constructor() {
                this.$get = ["$http", "$log", ($http, $log) => {
                        var that = this;
                        return new HttpService($http, $log);
                    }];
            }
        }
        Data.HttpProvider = HttpProvider;
        class HttpService {
            constructor($http, $log) {
                this.$http = $http;
                this.$log = $log;
                this.isoDateTimeExpression = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(?:Z|(\+|-)([\d|:]*))?$/;
                this.timezoneOffsetExpression = /(\+|-)(\d\d\:\d\d)$/;
                this.token = "";
            }
            setToken(token) {
                this.token = token;
            }
            get(url, config) {
                return this.$http.get(url, this.buildConfig(url, config));
            }
            post(url, data, config) {
                return this.$http.post(url, data, this.buildConfig(url, config));
            }
            put(url, data, config) {
                return this.$http.put(url, data, this.buildConfig(url, config));
            }
            delete(url, config) {
                return this.$http.delete(url, this.buildConfig(url, config));
            }
            transformRequest(data, headersGetter) {
                return JSON.stringify(this.transformRequestObject(data));
            }
            transformRequestObject(data) {
                if (data) {
                    // TODO: move to ValidationService
                    // validation
                    if (data.hasOwnProperty("entityObject") && data.hasOwnProperty("expressions")) {
                        this.transformRequestObject(data["entityObject"]);
                        return data;
                    }
                    for (var property in data) {
                        if (data.hasOwnProperty(property) && typeof data[property] !== 'string') {
                            if (data[property] instanceof Date) {
                                // remove timezone information from dates
                                var date = data[property];
                                //var momentDate = moment([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()]).utcOffset(0, true);
                                //data[property] = momentDate.format("YYYY-MM-DDTHH:mm:ss");
                                data[property] =
                                    kendo.toString(date.getFullYear(), "0000") + "-"
                                        + kendo.toString(date.getMonth() + 1, "00") + "-"
                                        + kendo.toString(date.getDate(), "00") + "T"
                                        + kendo.toString(date.getHours(), "00") + ":"
                                        + kendo.toString(date.getMinutes(), "00") + ":"
                                        + kendo.toString(date.getSeconds(), "00");
                            }
                            else if (Array.isArray(data[property])) {
                                data[property].forEach((item) => {
                                    this.transformRequestObject(item);
                                });
                            }
                            else if ((data[property] || data[property] == 0) && !isNaN(data[property])) {
                                // convert numbers to strings
                                data[property] = data[property].toString();
                            }
                            else if (data[property] instanceof Object) {
                                // clean sub objects
                                this.transformRequestObject(data[property]);
                            }
                        }
                    }
                }
                return data;
            }
            transformResponse(data, headersGetter, status, url) {
                return data;
            }
            transformResponseObject(data, metadata) {
                if (angular.isObject(data)) {
                    return data;
                }
                else {
                    var response = JSON.parse(data, (key, value) => {
                        if (key == "odata.metadata" || key == "metadata") {
                            return value;
                        }
                        else {
                            return this.transformResponseValue(value, key, metadata);
                        }
                    });
                    return response;
                }
            }
            transformResponseValue(value, key, metadata) {
                if (typeof value === "string") {
                    // do not use metadata for expressions (key === "value"), metadata is only provided for the ResultModelEntity but not for expressions
                    if (key && key !== "value" && metadata && metadata.properties) {
                        if (metadata.properties[key] && metadata.properties[key].type) {
                            switch (metadata.properties[key].type) {
                                case "Edm.Decimal":
                                    if (value && !isNaN(value)) {
                                        return parseFloat(value);
                                    }
                                    return null;
                                case "Edm.Boolean":
                                    if (value && value.toLowerCase() == "true") {
                                        return true;
                                    }
                                    if (value && value.toLowerCase() == "false") {
                                        return false;
                                    }
                                    return null;
                                case "Edm.DateTime":
                                    return this.getDate(value);
                                default:
                                    return value;
                            }
                        }
                    }
                    else {
                        var dateTimeString = this.isoDateTimeExpression.exec(value);
                        if (dateTimeString) {
                            return this.getDate(value);
                        }
                        // TODO: get names of numeric properties
                        if (value && !isNaN(value) && (value.length <= 15 || (value.indexOf(".") >= 0 && value.substr(0, value.indexOf(".")).length <= 15))) {
                            return parseFloat(value);
                        }
                        if (value && value.toLowerCase() == "true") {
                            return true;
                        }
                        if (value && value.toLowerCase() == "false") {
                            return false;
                        }
                    }
                }
                return value;
            }
            getDate(value) {
                var dateTimeString = this.isoDateTimeExpression.exec(value);
                if (dateTimeString) {
                    var timezoneOffsetString = this.timezoneOffsetExpression.exec(value);
                    if (timezoneOffsetString) {
                        return new Date(dateTimeString.input);
                    }
                    else {
                        var newDateTimeString = dateTimeString.input;
                        if (dateTimeString.input[dateTimeString.input.length - 1] == "Z") {
                            newDateTimeString = dateTimeString.input.substr(0, dateTimeString.input.length - 1);
                        }
                        return moment(newDateTimeString).toDate();
                    }
                }
                return null;
            }
            buildConfig(url, config) {
                config = config || {};
                if (config.transformRequest) {
                    config.transformRequest = (angular.isArray(config.transformRequest) ? config.transformRequest : [config.transformRequest]);
                }
                else {
                    config.transformRequest = [];
                }
                if (config.transformResponse) {
                    config.transformResponse = (angular.isArray(config.transformResponse) ? config.transformResponse : [config.transformResponse]);
                }
                else {
                    config.transformResponse = [];
                }
                if (this.token) {
                    if (!config.headers) {
                        config.headers = {};
                    }
                    config.headers["Authorization"] = "Bearer " + this.token;
                }
                var impersonationUsername = CockpitFramework.Application.ApplicationService.getCurrentApplication().impersonationUsername;
                if (impersonationUsername) {
                    if (!config.headers) {
                        config.headers = {};
                    }
                    config.headers["cofx-impersonated-account"] = impersonationUsername;
                }
                config.transformRequest = config.transformRequest.concat((data, headersGetter) => this.transformRequest(data, headersGetter));
                config.transformResponse = config.transformResponse.concat((data, headersGetter, status) => this.transformResponse(data, headersGetter, status, url));
                return config;
            }
        }
        Data.HttpService = HttpService;
    })(Data = CockpitFramework.Data || (CockpitFramework.Data = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="Http.ts" />

/// <reference path="../../typings/tsd.d.ts" />
function getTimezoneDate(date) {
    var momentDate = moment(new Date(date));
    const oldOffset = momentDate.utcOffset();
    var timezoneOffset = kendo.toString(Math.floor(oldOffset / 60), "+00;-00;+00") + ":" + kendo.toString(Math.floor(momentDate.utcOffset() % 60), "00");
    var newDateString = kendo.toString(date, "yyyy-MM-ddTHH:mm:ss");
    if (newDateString[newDateString.length - 1] == "Z") {
        newDateString = newDateString.substr(0, newDateString.length - 1);
    }
    var newDate = new Date(newDateString + timezoneOffset);
    const momentNewDate = moment(newDate);
    const newOffset = momentNewDate.utcOffset();
    if (oldOffset !== newOffset) {
        newDate = moment(newDate).add('minutes', oldOffset - newOffset).toDate();
    }
    return newDate;
}
var CockpitFramework;
(function (CockpitFramework) {
    var Globalization;
    (function (Globalization) {
        class DateFormatPatterns {
            static convertToMomentFormatPattern(format) {
                if (format == "g") {
                    format = CockpitFramework.Globalization.DateFormatPatterns.shortDateTimePattern;
                }
                else if (format == "d") {
                    format = CockpitFramework.Globalization.DateFormatPatterns.shortDatePattern;
                }
                else if (format == "t") {
                    format = CockpitFramework.Globalization.DateFormatPatterns.shortTimePattern;
                }
                format = format.replace(/y/g, "Y");
                format = format.replace(/d/g, "D");
                format = format.replace(/tt/g, "A");
                return format;
            }
        }
        DateFormatPatterns.shortDatePattern = "M/d/yyyy";
        DateFormatPatterns.shortDateTimePattern = "M/d/yyyy h:mm tt";
        DateFormatPatterns.shortTimePattern = "h:mm tt";
        Globalization.DateFormatPatterns = DateFormatPatterns;
    })(Globalization = CockpitFramework.Globalization || (CockpitFramework.Globalization = {}));
})(CockpitFramework || (CockpitFramework = {}));

/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="ArrayService.ts" />
/**
 * The module contains components to communicate with the server and process data.
 * @preferred
 */
var CockpitFramework;
(function (CockpitFramework) {
    var Data;
    (function (Data) {
        angular.module("cockpitframework.data", [])
            .provider("cofxHttp", Data.HttpProvider)
            .service("cofxArrayService", Data.ArrayService);
    })(Data = CockpitFramework.Data || (CockpitFramework.Data = {}));
})(CockpitFramework || (CockpitFramework = {}));




