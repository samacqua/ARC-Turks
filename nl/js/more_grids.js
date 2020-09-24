
// Internal state.
var CURRENT_INPUT_GRID = new Grid(3, 3);
var CURRENT_OUTPUT_GRID = new Grid(3, 3);
var TEST_PAIRS = new Array();
var CURRENT_TEST_PAIR_INDEX = 0;
var COPY_PASTE_DATA = new Array();

// Cosmetic.
var EDITION_GRID_HEIGHT = 500;
var EDITION_GRID_WIDTH = 500;
var MAX_CELL_SIZE = 100;

var TASK_ID;
var SELECTED_EXAMPLE = null;

function refreshEditionGrid(jqGrid, dataGrid) {
    fillJqGridWithData(jqGrid, dataGrid);
    setUpEditionGridListeners(jqGrid);

    const col_width = $("#container-fluid").width() / 3.2;
    fitCellsToContainer(jqGrid, dataGrid.height, dataGrid.width, col_width, col_width);
    initializeSelectable();
}

function syncFromEditionGridToDataGrid() {
    copyJqGridToDataGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
}

function syncFromDataGridToEditionGrid() {
    refreshEditionGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
}

function getSelectedSymbol() {
    selected = $('#symbol_picker .selected-symbol-preview')[0];
    return $(selected).attr('symbol');
}

function setUpEditionGridListeners(jqGrid) {
    jqGrid.find('.cell').click(function(event) {
        cell = $(event.target);
        symbol = getSelectedSymbol();

        mode = $('input[name=tool_switching]:checked').val();
        if (mode == 'floodfill') {
            // If floodfill: fill all connected cells.
            syncFromEditionGridToDataGrid();
            grid = CURRENT_OUTPUT_GRID.grid;
            floodfillFromLocation(grid, cell.attr('x'), cell.attr('y'), symbol);
            syncFromDataGridToEditionGrid();

            // if in tutorial and in challenge to flood fill yellow, check completion
            const isStart = !(window.location.href.includes("listener") || window.location.href.includes("speaker"));
            if (isStart) {
                if ($("#objective-text").text().includes("yellow")) {
                    pre_continue();
                }
            }

        }
        else if (mode == 'edit') {
            // Else: fill just this cell.
            setCellSymbol(cell, symbol);

            // if in tutorial and in challenge to draw green squares, check completion
            const isStart = !(window.location.href.includes("listener") || window.location.href.includes("speaker"));
            if (isStart) {
                if ($("#objective-text").text().includes("green")) {
                    pre_continue();
                }
            }
        }
    });
}

function fillPairPreview(pairId, inputGrid, outputGrid) {
    var pairSlot = $('#pair_preview_' + pairId);
    if (!pairSlot.length) {
        // Create HTML for pair.
        pairSlot = $('<div id="pair_preview_' + pairId + '" class="pair_preview" index="' + pairId + '"></div>');
        pairSlot.appendTo('#task_preview');
    }
    var jqInputGrid = pairSlot.find('.input_preview');
    if (!jqInputGrid.length) {
        jqInputGrid = $('<div class="input_preview"></div>');
        jqInputGrid.appendTo(pairSlot);
    }

    var jqArrow = pairSlot.find('.arrow');
    if (!jqArrow.length) {
        jqArrow = $('<div class="arrow"></div>');
        jqArrow.appendTo(pairSlot);

        var elem = document.createElement("img");
        elem.src = 'img/arrow.png';
        elem.setAttribute("id", "arrow");

        const needsExample = window.location.href.includes("speaker") && window.location.href.includes("ex");
        if (needsExample) {
            var text = document.createElement("p");
            text.innerHTML = pairId+1;
            text.setAttribute("id", "io_id");
            jqArrow.append(text);
        }

        jqArrow.append(elem);
    }

    var jqOutputGrid = pairSlot.find('.output_preview');
    if (!jqOutputGrid.length) {
        jqOutputGrid = $('<div class="output_preview"></div>');
        jqOutputGrid.appendTo(pairSlot);
    }

    const col_width = $("#container-fluid").width() / 6 - 60;

    fillJqGridWithData(jqInputGrid, inputGrid);
    fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, col_width, col_width);
    fillJqGridWithData(jqOutputGrid, outputGrid);
    fitCellsToContainer(jqOutputGrid, outputGrid.height, outputGrid.width, col_width, col_width);
}

// const LISTENER_TYPES = 

// // if 0, then NL and io example, if 1, then just NL, if 2, then just io example
// var LISTENER_TYPE = 0;

function loadJSONTask(train, test) {
    $('#modal_bg').hide();

    const isSpeakerEx = window.location.href.includes("speaker") && window.location.href.includes("ex");
    if (isSpeakerEx) {
        for (var i = 0; i < train.length; i++) {

            var option = $("<option></option>").val(i+1);
            option.html(i+1);

            $("#selectExampleIO").append(option);
        }
    }

    const isListener = window.location.href.includes("listener");
    const isStart = !(isListener || window.location.href.includes("speaker"));

    $("#task_preview").html("");

    if ((isListener || isStart) && SELECTED_EXAMPLE == -1) {
        $("#task_preview").html("There is no input-output example for this description.")
    }

    for (var i = 0; i < train.length; i++) {

        // if loading listener task, thn only load the chosen example, if any
        if ((isListener || isStart) && i != SELECTED_EXAMPLE) {
            continue;
        }

        pair = train[i];
        values = pair['input'];
        input_grid = convertSerializedGridToGridObject(values)
        values = pair['output'];
        output_grid = convertSerializedGridToGridObject(values)
        fillPairPreview(i, input_grid, output_grid);
    }
    for (var i=0; i < test.length; i++) {
        pair = test[i];
        TEST_PAIRS.push(pair);
    }
    values = TEST_PAIRS[0]['input'];

    CURRENT_INPUT_GRID = convertSerializedGridToGridObject(values);

    fillTestInput(CURRENT_INPUT_GRID);
    CURRENT_TEST_PAIR_INDEX = 0;
    $('#current_test_input_id_display').html('1');
    $('#total_test_input_count_display').html(test.length);
}

function loadTaskFromFile(e) {
    var file = e.target.files[0];
    if (!file) {
        errorMsg('No file selected');
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;

        try {
            contents = JSON.parse(contents);
            train = contents['train'];
            test = contents['test'];
        } catch (e) {
            errorMsg('Bad file format');
            return;
        }
        loadJSONTask(train, test);

        $('#load_task_file_input')[0].value = "";
    };
    reader.readAsText(file);
}

var TASKS_DESCRIBED = [];

function randomTask() {
    var subset = "training";
    $.getJSON("https://api.github.com/repos/samacqua/ARC-Turks/contents/common/data/" + subset, function(tasks) {
        var task_index = Math.floor(Math.random() * tasks.length);
        console.log(task_index);
        TASKS_DESCRIBED.push(task_index);
        var task = tasks[task_index];
        $.getJSON(task["download_url"], function(json) {
            try {
                train = json['train'];
                test = json['test'];
            } catch (e) {
                errorMsg('Bad file format');
                return;
            }
            loadJSONTask(train, test);
            TASK_ID = task_index;
            //$('#load_task_file_input')[0].value = "";
        })
    })
}

function loadTask(task_index) {
    console.log(task_index);
    var subset = "training";
    $.getJSON("https://api.github.com/repos/samacqua/ARC-Turks/contents/common/data/" + subset, function(tasks) {
        var task = tasks[task_index];
        TASKS_DESCRIBED.push(task_index);

        $.getJSON(task["download_url"], function(json) {
            try {
                train = json['train'];
                test = json['test'];
            } catch (e) {
                errorMsg('Bad file format');
                return;
            }
            loadJSONTask(train, test);
            TASK_ID = task_index;
            //$('#load_task_file_input')[0].value = "";
        })
    })
}

function fillTestInput(inputGrid) {

    jqInputGrid = $('#evaluation_input');
    fillJqGridWithData(jqInputGrid, inputGrid);

    const col_width = $("#container-fluid").width() / 3.1;
    fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, col_width, col_width);
}

function copyToOutput() {
    syncFromEditionGridToDataGrid();
    CURRENT_OUTPUT_GRID = convertSerializedGridToGridObject(CURRENT_INPUT_GRID.grid);
    syncFromDataGridToEditionGrid();
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
}

function initializeSelectable() {
    try {
        $('.selectable_grid').selectable('destroy');
    }
    catch (e) {
    }
    toolMode = $('input[name=tool_switching]:checked').val();
    if (toolMode == 'select') {
        $('.selectable_grid').selectable(
            {
                autoRefresh: false,
                filter: '> .row > .cell',
                start: function(event, ui) {
                    $('.ui-selected').each(function(i, e) {
                        $(e).removeClass('ui-selected');
                        console.log("bb");
                    });
                }
            }
        );
    }
}

// Initial event binding.

$(document).ready(function () {
    $('#symbol_picker').find('.symbol_preview').click(function(event) {
        symbol_preview = $(event.target);
        $('#symbol_picker').find('.symbol_preview').each(function(i, preview) {
            $(preview).removeClass('selected-symbol-preview');
        })
        symbol_preview.addClass('selected-symbol-preview');

        toolMode = $('input[name=tool_switching]:checked').val();
        if (toolMode == 'select') {
            $('.edition_grid').find('.ui-selected').each(function(i, cell) {
                symbol = getSelectedSymbol();
                setCellSymbol($(cell), symbol);
            });
        }
    });

    $('.edition_grid').each(function(i, jqGrid) {
        setUpEditionGridListeners($(jqGrid));
    });

    $('.load_task').on('change', function(event) {
        loadTaskFromFile(event);
    });

    $('.load_task').on('click', function(event) {
      event.target.value = "";
    });

    $('input[type=radio][name=tool_switching]').change(function() {
        initializeSelectable(true);
        toolMode = $('input[name=tool_switching]:checked').val();
        if (toolMode == 'select') {
            infoMsg('Drag over an area to select, and press "C" to copy');
        } else if (toolMode == 'tool_floodfill') {
            infoMsg('Click anywhere in the output to flood-fill that area with the selected color.');
        } else if (toolMode == 'edit') {
            infoMsg('Click anywhere in the output to color that cell with the selected color.');
        }
    });

    $('body').keydown(function(event) {
        mode = $('input[name=tool_switching]:checked').val();

        if (mode != 'select') {
            return;
        }
        // Copy and paste functionality.
        if (event.which == 67) {
            // Press C
            
            selected = $('.ui-selected');
            if (selected.length == 0) {
                return;
            }

            COPY_PASTE_DATA = [];
            for (var i = 0; i < selected.length; i ++) {
                x = parseInt($(selected[i]).attr('x'));
                y = parseInt($(selected[i]).attr('y'));
                symbol = parseInt($(selected[i]).attr('symbol'));
                COPY_PASTE_DATA.push([x, y, symbol]);
            }
            infoMsg('Cells copied! Select a target cell and press "V" to paste at location.');

        }
        if (event.which == 86) {
            // Press V
            if (COPY_PASTE_DATA.length == 0) {
                errorMsg('No data to paste.');
                return;
            }
            selected = $('.edition_grid').find('.ui-selected');
            if (selected.length == 0) {
                errorMsg('Select a target cell on the output grid.');
                return;
            }

            jqGrid = $(selected.parent().parent()[0]);

            if (selected.length == 1) {
                targetx = parseInt(selected.attr('x'));
                targety = parseInt(selected.attr('y'));

                xs = new Array();
                ys = new Array();
                symbols = new Array();

                for (var i = 0; i < COPY_PASTE_DATA.length; i ++) {
                    xs.push(COPY_PASTE_DATA[i][0]);
                    ys.push(COPY_PASTE_DATA[i][1]);
                    symbols.push(COPY_PASTE_DATA[i][2]);
                }

                minx = Math.min(...xs);
                miny = Math.min(...ys);
                for (var i = 0; i < xs.length; i ++) {
                    x = xs[i];
                    y = ys[i];
                    symbol = symbols[i];
                    newx = x - minx + targetx;
                    newy = y - miny + targety;
                    res = jqGrid.find('[x="' + newx + '"][y="' + newy + '"] ');
                    if (res.length == 1) {
                        cell = $(res[0]);
                        setCellSymbol(cell, symbol);
                    }
                }


                // if in tutorial and in challenge to copy-paste, check completion
                const isStart = !(window.location.href.includes("listener") || window.location.href.includes("speaker"));
                if (isStart) {
                    if ($("#objective-text").text().includes("copy")) {
                        pre_continue('copy_paste');
                    }
                }

            } else {
                errorMsg('Can only paste at a specific location; only select *one* cell as paste destination.');
            }
        }
    });
});


function parseSizeTuple(size) {
    size = size.split('x');
    if (size.length != 2) {
        alert('Grid size should have the format "3x3", "5x7", etc.');
        return;
    }
    if ((size[0] < 1) || (size[1] < 1)) {
        alert('Grid size should be at least 1. Cannot have a grid with no cells.');
        return;
    }
    if ((size[0] > 30) || (size[1] > 30)) {
        alert('Grid size should be at most 30 per side. Pick a smaller size.');
        return;
    }
    return size;
}


function resizeOutputGrid() {
    size = $('#output_grid_size').val();
    size = parseSizeTuple(size);
    height = parseInt(size[1]);
    width = parseInt(size[0]);

    jqGrid = $('#output_grid .edition_grid');
    syncFromEditionGridToDataGrid();
    dataGrid = JSON.parse(JSON.stringify(CURRENT_OUTPUT_GRID.grid));
    CURRENT_OUTPUT_GRID = new Grid(height, width, dataGrid);
    refreshEditionGrid(jqGrid, CURRENT_OUTPUT_GRID);
}

function resetOutputGrid() {
    syncFromEditionGridToDataGrid();
    CURRENT_OUTPUT_GRID = new Grid(3, 3);
    syncFromDataGridToEditionGrid();
    resizeOutputGrid();
}

function copyFromInput() {
    syncFromEditionGridToDataGrid();
    CURRENT_OUTPUT_GRID = convertSerializedGridToGridObject(CURRENT_INPUT_GRID.grid);
    syncFromDataGridToEditionGrid();
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
}