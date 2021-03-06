"use strict";

var $ = require("jquery"),
    common = require("./commonParts/common.js"),
    labelModule = require("viz/series/points/label"),
    vizMocks = require("../../helpers/vizMocks.js"),
    createFunnel = common.createFunnel,
    environment = common.environment,
    stubAlgorithm = common.stubAlgorithm,
    Label = labelModule.Label,
    stubLabel = vizMocks.stubClass(Label),
    labels = require("viz/funnel/label");

var dxFunnel = require("viz/funnel/funnel");
dxFunnel.addPlugin(labels.plugin);

var labelEnvironment = $.extend({}, environment, {
    beforeEach: function() {
        environment.beforeEach.call(this);
        this.itemGroupNumber = 0;
        this.labelGroupNumber = 1;
        this.renderer.bBoxTemplate = { x: 0, y: 0, width: 0, height: 0 };
        this.renderer.bBoxTemplate = { width: 100 };

        stubAlgorithm.getFigures.returns([[0, 0, 1, 1]]);

        var labelBoxes = [
            {
                height: 10,
                width: 100
            }, {
                height: 10,
                width: 45
            }
            ],
            labelBoxesIndex = 0;

        sinon.stub(labelModule, "Label", function() {
            var stub = new stubLabel();
            stub.stub("getBoundingRect").returns(labelBoxes[(labelBoxesIndex++) % labelBoxes.length]);
            stub.stub("getBackgroundPadding").returns(5);
            return stub;
        });

        $("#test-container").css({
            width: 800,
            height: 600
        });
    },
    afterEach: function() {
        environment.afterEach.call(this);
        labelModule.Label.restore();
    },

    labelGroup: function() {
        return this.renderer.g.getCall(this.labelGroupNumber).returnValue;
    }
});

QUnit.module("Initialization", labelEnvironment);

QUnit.test("Create label group on initialization", function(assert) {
    createFunnel({});

    var labelsGroup = this.labelGroup();
    assert.equal(labelsGroup.append.lastCall.args[0], this.renderer.root);
    assert.equal(labelsGroup.attr.lastCall.args[0].className, "labels");
});

QUnit.test("Create labels", function(assert) {
    stubAlgorithm.getFigures.returns([[0], [0]]);
    stubAlgorithm.normalizeValues.returns([1, 0.5]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 2, argument: "One", color: "#123123" }, { value: 5, argument: "Two", color: "#121212" }],
        valueField: "value",
        label: {
            visible: true
        }
    });
    var labelsGroup = this.labelGroup(),
        label = labelModule.Label.getCall(0).returnValue;

    assert.ok(labelsGroup.clear.called);

    assert.equal(labelModule.Label.callCount, 2, "two labels are created");
    assert.equal(labelModule.Label.getCall(0).args[0].renderer, this.renderer);
    assert.equal(labelModule.Label.getCall(0).args[0].labelsGroup, labelsGroup);
    assert.ok(label.draw.calledOnce);

    assert.equal(label.setData.lastCall.args[0].value, 5, "value");
    assert.deepEqual(label.setData.lastCall.args[0].item.data, {
        argument: "Two",
        value: 5,
        color: "#121212"
    }, "data");
    assert.equal(label.setData.lastCall.args[0].item.id, 0);
});

QUnit.test("Create labels with styles", function(assert) {
    stubAlgorithm.getFigures.returns([[0], [0]]);
    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 2 }, { value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            font: {
                color: "red"
            },
            background: {
                dashStyle: "solid"
            },
            textAlign: "left",
            position: "outside",
            horizontalOffset: 0,
            verticalOffset: 0,
            showForZeroValues: false
        }
    });

    var options = labelModule.Label.getCall(0).returnValue.setOptions.lastCall.args[0];

    assert.deepEqual(options.attributes.font, {
        color: "red",
        cursor: "default",
        family: "'Segoe UI', 'Helvetica Neue', 'Trebuchet MS', Verdana",
        size: 12,
        weight: 400
    }, "font");

    assert.deepEqual(options.background, {
        dashStyle: "solid",
        fill: "#5f8b95",
        stroke: "none",
        "stroke-width": 0
    }, "background");

    assert.deepEqual(options.connector, {
        stroke: "#5f8b95",
        "stroke-width": 1,
        opacity: 0.5
    }, "connector");

    assert.deepEqual(options.format, undefined, "format");
    assert.deepEqual(options.horizontalOffset, 0, "horizontalOffset");
    assert.deepEqual(options.verticalOffset, 0, "verticalOffset");
    assert.deepEqual(options.visible, true, "visible");
    assert.deepEqual(options.showForZeroValues, false, "showForZeroValues");
    assert.deepEqual(options.customizeText({ valueText: "value", item: { data: { argument: "argument" } } }), "argument value", "customizeText");
    assert.deepEqual(options.textAlign, "left", "textAlign");
});

QUnit.test("Do not create labels if label.visible set to false", function(assert) {
    stubAlgorithm.getFigures.returns([[0], [0]]);
    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 2 }],
        valueField: "value",
        label: {
            visible: false
        }
    });
    var labelsGroup = this.labelGroup();

    assert.ok(labelsGroup.clear.called);
    assert.equal(labelModule.Label.callCount, 0, "no one label is created");
});

QUnit.test("Reserve space for labels if position outside", function(assert) {
    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "Outside",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var items = this.items();
    assert.equal(items.length, 1);
    assert.deepEqual(items[0].attr.firstCall.args[0].points, [0, 0, 680, 600]);
});

QUnit.test("Reserve space for labels if position outside and horizontal alignment is left", function(assert) {
    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "outside",
            horizontalAlignment: "left",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var items = this.items();
    assert.equal(items.length, 1);
    assert.deepEqual(items[0].attr.firstCall.args[0].points, [120, 0, 800, 600]);
});

QUnit.test("Reserve space for labels if position columns", function(assert) {
    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "columns",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var items = this.items();
    assert.equal(items.length, 1);
    assert.deepEqual(items[0].attr.firstCall.args[0].points, [0, 0, 665, 600]);
});

QUnit.test("Do not reserve space for labels if position inside", function(assert) {
    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "inside",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var items = this.items();
    assert.equal(items.length, 1);
    assert.deepEqual(items[0].attr.firstCall.args[0].points, [0, 0, 800, 600]);
});

QUnit.test("Relayout labels after dataSource changed", function(assert) {
    var funnel = createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "outside",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    funnel.option({
        dataSource: [{ value: 2 }]
    });

    var items = this.items();
    assert.equal(items.length, 1);
    assert.deepEqual(items[0].attr.firstCall.args[0].points, [0, 0, 735, 600]);
});

QUnit.test("Place labels with outside position", function(assert) {
    this.renderer.bBoxTemplate = { width: 100 };

    stubAlgorithm.getFigures.returns([
        [0, 0, 0.5, 0.5],
        [0, 0.6, 1, 0.8]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "Outside",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;
    assert.deepEqual(label.shift.args[0], [360, 330]);

    label = labelModule.Label.getCall(1).returnValue;
    assert.deepEqual(label.shift.args[0], [700, 510]);
});

QUnit.test("Place labels with outside position. inverted", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.8, 0, 0.8]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        inverted: true,
        label: {
            visible: true,
            position: "outside",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;
    assert.deepEqual(label.shift.args[0], [700, 590]);
});

QUnit.test("Place labels with outside position and left horizontal alignment", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 0.5, 0.5]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "Outside",
            horizontalAlignment: "left",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;

    assert.deepEqual(label.shift.args[0], [0, 30]);
});

QUnit.test("Place labels with outside position. horizontalAlignment left. inverted", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.8, 0, 0.8]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        inverted: true,
        label: {
            visible: true,
            horizontalAlignment: "left",
            position: "outside",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;
    assert.deepEqual(label.shift.args[0], [0, 590]);
});

QUnit.test("Place labels with inside position", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.5, 0, 0.5]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "inside",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;
    assert.deepEqual(label.shift.args[0], [365, 175]);
});

QUnit.test("Place labels with inside position, figure is hexagon", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.5, 1, 1, 0, 1, 0, 0.5]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "inside",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;
    assert.deepEqual(label.shift.args[0], [365, 325]);
});

QUnit.test("Place labels with columns position", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.5, 0, 0.5],
        [0, 0, 0.5, 0, 1, 0.5, 0, 0.5]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "columns",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });
    var label1 = labelModule.Label.getCall(0).returnValue,
        label2 = labelModule.Label.getCall(1).returnValue;

    assert.deepEqual(label1.shift.args[0], [700, 30]);
    assert.deepEqual(label2.shift.args[0], [700, 30]);
});

QUnit.test("Place labels with columns position. inverted", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.8, 0, 0.8]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        inverted: true,
        label: {
            visible: true,
            position: "columns",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;
    assert.deepEqual(label.shift.args[0], [700, 590]);
});

QUnit.test("Place labels with columns position. rtl", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.5, 0, 0.5],
        [0, 0, 0.5, 0, 1, 0.5, 0, 0.5]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        valueField: "value",
        rtlEnabled: true,
        label: {
            visible: true,
            position: "columns",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });
    var label1 = labelModule.Label.getCall(0).returnValue,
        label2 = labelModule.Label.getCall(1).returnValue;

    assert.deepEqual(label1.shift.args[0], [700, 30]);
    assert.deepEqual(label2.shift.args[0], [755, 30]);
});

QUnit.test("Place labels with columns position and left horizontal alignment", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.5, 0, 0.5],
        [0, 0, 0.5, 0, 1, 0.5, 0, 0.5]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            horizontalAlignment: "left",
            position: "columns",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });
    var label1 = labelModule.Label.getCall(0).returnValue,
        label2 = labelModule.Label.getCall(1).returnValue;

    assert.deepEqual(label1.shift.args[0], [0, 30]);
    assert.deepEqual(label2.shift.args[0], [0, 30]);
});

QUnit.test("Place labels with columns position. horizontalAlignment left inverted", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.8, 0, 0.8]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        inverted: true,
        label: {
            visible: true,
            position: "columns",
            horizontalAlignment: "left",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;
    assert.deepEqual(label.shift.args[0], [0, 590]);
});

QUnit.test("Place labels with columns position and left horizontal alignment. rtl", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.5, 0, 0.5],
        [0, 0, 0.5, 0, 1, 0.5, 0, 0.5]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        valueField: "value",
        rtlEnabled: true,
        label: {
            visible: true,
            horizontalAlignment: "left",
            position: "columns",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });
    var label1 = labelModule.Label.getCall(0).returnValue,
        label2 = labelModule.Label.getCall(1).returnValue;

    assert.deepEqual(label1.shift.args[0], [0, 30]);
    assert.deepEqual(label2.shift.args[0], [55, 30]);
});

QUnit.test("Connector strategy", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.5, 0, 0.5]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "outsiDe",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue,
        connectorStrategy = labelModule.Label.getCall(0).args[0].strategy,
        figure = label.setFigureToDrawConnector.lastCall.args[0];

    label.getBoundingRect.returns({
        x: 10,
        y: 15,
        height: 20,
        width: 40
    });

    assert.deepEqual(connectorStrategy.getFigureCenter(figure), [679, 0], "center");
    assert.deepEqual(connectorStrategy.findFigurePoint(figure), [679, 0], "figure point");
    assert.deepEqual(connectorStrategy.prepareLabelPoints.call(label), [[ 6, 15 ], [ 46, 15 ], [ 46, 35 ], [ 6, 35 ]], "prepareLabelPoints");
    assert.equal(connectorStrategy.isLabelInside(), false, "isLabelInside");
});

QUnit.test("Connector strategy. left horizontalAlignment", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.5, 0, 0.5]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "outside",
            horizontalAlignment: "left",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue,
        connectorStrategy = labelModule.Label.getCall(0).args[0].strategy,
        figure = label.setFigureToDrawConnector.lastCall.args[0];

    label.getBoundingRect.returns({
        x: 10,
        y: 15,
        height: 20,
        width: 40
    });

    assert.deepEqual(connectorStrategy.getFigureCenter(figure), [121, 0], "center");
    assert.deepEqual(connectorStrategy.findFigurePoint(figure), [121, 0], "figure point");
    assert.deepEqual(connectorStrategy.prepareLabelPoints.call(label), 	[ [ 14, 15 ], [ 54, 15 ], [ 54, 35 ], [ 14, 35 ]], "prepareLabelPoints");
});


QUnit.test("Connector strategy. inverted", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.5, 0, 0.5]
    ]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        inverted: true,
        label: {
            visible: true,
            position: "outside",
            horizontalAlignment: "left",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    var label = labelModule.Label.getCall(0).returnValue,
        connectorStrategy = labelModule.Label.getCall(0).args[0].strategy,
        figure = label.setFigureToDrawConnector.lastCall.args[0];

    label.getBoundingRect.returns({
        x: 10,
        y: 15,
        height: 20,
        width: 40
    });

    assert.deepEqual(connectorStrategy.getFigureCenter(figure), [121, 599], "center");
    assert.deepEqual(connectorStrategy.prepareLabelPoints.call(label), 	[ [ 14, 14 ], [ 54, 14 ], [ 54, 34 ], [ 14, 34 ]], "prepareLabelPoints");
});

QUnit.test("change label option", function(assert) {
    stubAlgorithm.getFigures.returns([
        [0, 0, 1, 0, 1, 0.5, 0, 0.5]
    ]);

    var funnel = createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        valueField: "value",
        label: {
            visible: true,
            position: "outside",
            horizontalOffset: 15,
            verticalOffset: 30
        }
    });

    this.labelGroup().clear.reset();

    funnel.option({
        label: {
            position: "inside"
        }
    });

    assert.equal(this.labelGroup().clear.callCount, 1);
    assert.equal(labelModule.Label.callCount, 2);

    var label = labelModule.Label.getCall(1).returnValue;
    assert.deepEqual(label.shift.args[0], [392.5, 175]);
});

QUnit.module("Adaptive layout", $.extend({}, labelEnvironment, {
    beforeEach: function() {
        labelEnvironment.beforeEach.call(this);

        stubAlgorithm.getFigures.returns([
            [0, 0, 1, 1], [0, 0, 1, 1]
        ]);

        $("#test-container").css({
            width: 240
        });
    }
}));

QUnit.test("Hide labels", function(assert) {
    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 2 }],
        label: {
            visible: true,
            position: "outside"
        },
        adaptiveLayout: {
            width: 150,
            keepLabels: false
        }
    });

    assert.deepEqual(this.items()[0].attr.firstCall.args[0].points, [0, 0, 240, 600]);
    assert.ok(labelModule.Label.getCall(0).returnValue.hide.called);
    assert.ok(labelModule.Label.getCall(1).returnValue.hide.called);
    assert.ok(!labelModule.Label.getCall(0).returnValue.clearVisibility.called);
});

QUnit.test("Show hidden labels", function(assert) {
    var funnel = createFunnel({
            algorithm: "stub",
            dataSource: [{ value: 1 }, { value: 2 }],
            label: {
                visible: true,
                position: "outside"
            },
            adaptiveLayout: {
                width: 150,
                keepLabels: false
            }
        }),
        label = labelModule.Label.getCall(0).returnValue;

    label.hide.reset();
    label.resetEllipsis.reset();

    funnel.option({
        size: {
            width: 400
        }
    });

    assert.deepEqual(this.items()[0].attr.firstCall.args[0].points, [0, 0, 295, 600]);
    assert.ok(!label.hide.called);
    assert.ok(label.clearVisibility.called);
    assert.ok(label.resetEllipsis.called);
});

QUnit.test("Do not hide labels if keepLabels true", function(assert) {
    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 2 }],
        label: {
            visible: true,
            position: "outside"
        },
        adaptiveLayout: {
            width: 150,
            keepLabels: true
        }
    });

    assert.deepEqual(this.items()[0].attr.firstCall.args[0].points, [0, 0, 150, 600]);
    assert.ok(!labelModule.Label.getCall(0).returnValue.hide.called);
    assert.ok(!labelModule.Label.getCall(1).returnValue.hide.called);
});

QUnit.test("Do not hide labels if keepLabels true. Container width less than adaptiveLayout", function(assert) {
    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 2 }],
        label: {
            visible: true,
            position: "outside"
        },
        adaptiveLayout: {
            width: 150,
            keepLabels: true
        },
        size: {
            width: 140
        }
    });

    assert.deepEqual(this.items()[0].attr.firstCall.args[0].points, [0, 0, 140, 600]);
    assert.ok(!labelModule.Label.getCall(0).returnValue.hide.called);
    assert.ok(!labelModule.Label.getCall(1).returnValue.hide.called);
});

QUnit.test("Apply label ellipsis and correct label coordinates", function(assert) {
    stubAlgorithm.getFigures.returns([[0.1, 0, 0.9, 1], [0.2, 0, 0.8, 1]]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 2 }],
        label: {
            visible: true,
            position: "columns"
        },
        adaptiveLayout: {
            width: 150,
            keepLabels: true
        },
        size: {
            width: 180
        }
    });

    assert.equal(labelModule.Label.getCall(0).returnValue.fit.lastCall.args[0], 40);
    assert.ok(!labelModule.Label.getCall(1).returnValue.stub("fit").called);
});

QUnit.test("Apply label ellipsis and correct label coordinates. Right horizontalAlignment", function(assert) {

    stubAlgorithm.getFigures.returns([[0.1, 0, 0.9, 1], [0.2, 0, 0.8, 1]]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        label: {
            visible: true,
            position: "columns",
            horizontalAlignment: "right"
        },
        adaptiveLayout: {
            width: 150,
            keepLabels: true
        },
        size: {
            width: 180
        }
    });

    assert.equal(labelModule.Label.getCall(0).returnValue.fit.lastCall.args[0], 40);
    assert.ok(!labelModule.Label.getCall(1).returnValue.stub("fit").called);
});

QUnit.test("Correct label pos if label out from left", function(assert) {

    stubAlgorithm.getFigures.returns([[0.1, 0, 0.9, 1], [0.2, 0, 0.8, 1]]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        label: {
            visible: true,
            position: "columns",
            horizontalAlignment: "left"
        },
        rtlEnabled: true,
        adaptiveLayout: {
            width: 150,
            keepLabels: true
        },
        size: {
            width: 180
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;

    assert.equal(label.shift.lastCall.args[0], 0);
});

QUnit.test("Correct label pos if label out from right", function(assert) {

    stubAlgorithm.getFigures.returns([[0.1, 0, 0.9, 1], [0.2, 0, 0.8, 1]]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }, { value: 1 }],
        label: {
            visible: true,
            position: "columns",
            horizontalAlignment: "right"
        },
        adaptiveLayout: {
            width: 150,
            keepLabels: true
        },
        size: {
            width: 180
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;

    assert.equal(label.shift.lastCall.args[0], 80);
});

QUnit.test("Correct label pos if label out from top", function(assert) {

    stubAlgorithm.getFigures.returns([[0, 0, 1, 0, 1, 0.1, 0, 0.1]]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        label: {
            visible: true,
            position: "inside"
        },
        adaptiveLayout: {
            width: 150,
            keepLabels: true
        },
        size: {
            width: 180,
            height: 50,
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;

    assert.equal(label.shift.lastCall.args[1], 0);
});

QUnit.test("Correct label pos if label out from top", function(assert) {

    stubAlgorithm.getFigures.returns([[0, 0.9, 1, 0.9, 1, 1, 0, 1]]);

    createFunnel({
        algorithm: "stub",
        dataSource: [{ value: 1 }],
        label: {
            visible: true,
            position: "inside"
        },
        adaptiveLayout: {
            width: 150,
            keepLabels: true
        },
        size: {
            width: 180,
            height: 50,
        }
    });

    var label = labelModule.Label.getCall(0).returnValue;

    assert.equal(label.shift.lastCall.args[1], 40);
});
