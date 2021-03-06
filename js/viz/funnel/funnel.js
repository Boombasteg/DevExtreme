"use strict";

var tiling = require("./tiling"),
    dynamicSlope = require("./tiling.funnel"),
    dynamicHeight = require("./tiling.pyramid"),
    noop = require("../../core/utils/common").noop,
    Item = require("./item");

tiling.addAlgorithm("dynamicslope", dynamicSlope, true);
tiling.addAlgorithm("dynamicheight", dynamicHeight);

function invertFigure(figure) {
    return figure.map(function(coord, index) {
        return index % 2 ? 1 - coord : coord;
    });
}

var dxFunnel = require("../core/base_widget").inherit({
    _rootClass: "dxf-funnel",

    _rootClassPrefix: "dxf",

    _proxyData: [],

    _optionChangesMap: {
        dataSource: "DATA_SOURCE",
        neckWidth: "NODES_CREATE",
        neckHeight: "NODES_CREATE",
        inverted: "NODES_CREATE",
        algorithm: "NODES_CREATE",
        item: "NODES_CREATE",
        valueField: "NODES_CREATE",
        argumentField: "NODES_CREATE",
        colorField: "NODES_CREATE",
        palette: "NODES_CREATE",
        sortData: "NODES_CREATE"
    },

    _getDefaultSize: function() {
        return { width: 400, height: 400 };
    },

    _createThemeManager: function() {
        return new ThemeManager();
    },

    _optionChangesOrder: ["DATA_SOURCE"],

    _initialChanges: ["DATA_SOURCE"],

    _initCore: function() {
        this._group = this._renderer.g().append(this._renderer.root);
        this._items = [];
    },

    _eventsMap: {
        onHoverChanged: { name: "hoverChanged" },
        onSelectionChanged: { name: "selectionChanged" }
    },

    _disposeCore: noop,

    _applySize: function(rect) {
        this._rect = rect.slice();
        this._change(["TILING"]);
    },

    _change_TILING: function() {
        var that = this,
            items = that._items,
            rect = that._rect;

        this._group.clear();

        items.forEach(function(item, index) {
            var coords = item.figure.map(function(c, index) {
                    var offset = index % 2;
                    return rect[0 + offset] + (rect[2 + offset] - rect[0 + offset]) * c;
                }),
                element = that._renderer.path([], "area")
                    .attr({
                        points: coords
                    })
                    .append(that._group);

            item.coords = coords;
            item.element = element;
        });

        this._requestChange(["TILES"]);
    },

    _customChangesOrder: ["NODES_CREATE", "LAYOUT", "TILING", "TILES"],

    _dataSourceChangedHandler: function() {
        this._requestChange(["NODES_CREATE"]);
    },

    _change_DATA_SOURCE: function() {
        this._updateDataSource();
    },

    _change_NODES_CREATE: function() {
        this._buildNodes();
    },

    _change_TILES: function() {
        this._applyTilesAppearance();
    },

    _suspend: function() {
        if(!this._applyingChanges) {
            this._suspendChanges();
        }
    },
    _resume: function() {
        if(!this._applyingChanges) {
            this._resumeChanges();
        }
    },

    _applyTilesAppearance: function() {
        this._items.forEach(function(item) {
            var state = item.getState();
            item.element.smartAttr(item.states[state]);
        });
    },

    _getProxyData: function(x, y) {
        var that = this,
            data;

        this._proxyData.some(function(callback) {
            data = callback.call(that, x, y);
            if(data) {
                return true;
            }
        });

        return data;
    },

    clearHover: function() {
        this._suspend();
        this._items.forEach(function(item) {
            item.isHovered() && item.hover(false);
        });
        this._resume();
    },

    clearSelection: function() {
        this._suspend();
        this._items.forEach(function(item) {
            item.isSelected() && item.select(false);
        });
        this._resume();
    },

    _getData: function() {
        var that = this,
            data = that._dataSourceItems() || [],
            valueField = that._getOption("valueField", true),
            argumentField = that._getOption("argumentField", true),
            colorField = that._getOption("colorField", true),
            items = data.reduce(function(prev, item) {
                var value = Number(item[valueField]);
                if(value >= 0) {
                    prev.push({
                        value: value,
                        color: item[colorField],
                        argument: item[argumentField]
                    });
                }
                return prev;
            }, []);

        if(that._getOption("sortData", true)) {
            items.sort(function(a, b) {
                return b.value - a.value;
            });
        }

        return items;
    },

    _buildNodes: function() {
        var that = this,
            data = that._getData(),
            palette = that._themeManager.createPalette(that._getOption("palette", true), { useHighlight: true }),
            algorithm = tiling.getAlgorithm(that._getOption("algorithm", true)),
            percents = algorithm.normalizeValues(data),
            itemOptions = that._getOption("item");

        that._items = algorithm.getFigures(percents, that._getOption("neckWidth", true), that._getOption("neckHeight", true))
            .map(function(figure, index) {
                var curData = data[index],
                    node = new Item(that, {
                        figure: figure,
                        data: curData,
                        percent: percents[index],
                        id: index,
                        color: curData.color || palette.getNextColor(),
                        itemOptions: itemOptions
                    });

                return node;
            });

        if(that._getOption("inverted", true)) {
            that._items.forEach(function(item) {
                item.figure = invertFigure(item.figure);
            });
        }

        that._renderer.initHatching();
        that._change(["TILING"]);
    },

    _showTooltip: noop,

    hideTooltip: noop,

    getAllItems: function() {
        return this._items.slice();
    },

    _getMinSize: function() {
        var adaptiveLayout = this._getOption("adaptiveLayout");

        return [adaptiveLayout.width, adaptiveLayout.height];
    }
});

var ThemeManager = require("../core/base_theme_manager").BaseThemeManager.inherit({
    _themeSection: "funnel",
    _fontFields: ["loadingIndicator.font", "title.font", "title.subtitle.font", "tooltip.font", "export.font", "legend.font", "label.font"]
});

require("../../core/component_registrator")("dxFunnel", dxFunnel);
module.exports = dxFunnel;

// PLUGINS_SECTION
dxFunnel.addPlugin(require("../core/data_source").plugin);
