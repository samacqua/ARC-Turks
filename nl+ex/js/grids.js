
class Grid {
    constructor(height, width, values) {
        this.height = height;
        this.width = width;
        this.grid = new Array(height);
        for (var i = 0; i < height; i++){
            this.grid[i] = new Array(width);
            for (var j = 0; j < width; j++){
                if (values != undefined && values[i] != undefined && values[i][j] != undefined){
                    this.grid[i][j] = values[i][j];
                } else {
                    this.grid[i][j] = 0;
                }
            }
        }
    }
}

function floodfillFromLocation(grid, i, j, symbol) {
    i = parseInt(i);
    j = parseInt(j);
    symbol = parseInt(symbol);

    target = grid[i][j];
    
    if (target == symbol) {
        return;
    }

    function flow(i, j, symbol, target) {
        if (i >= 0 && i < grid.length && j >= 0 && j < grid[i].length) {
            if (grid[i][j] == target) {
                grid[i][j] = symbol;
                flow(i - 1, j, symbol, target);
                flow(i + 1, j, symbol, target);
                flow(i, j - 1, symbol, target);
                flow(i, j + 1, symbol, target);
            }
        }
    }
    flow(i, j, symbol, target);
}

function convertSerializedGridToGridObject(values) {
    height = values.length;
    width = values[0].length;
    return new Grid(height, width, values)
}

function fitCellsToContainer(jqGrid, height, width, containerHeight, containerWidth) {

    candidate_height = Math.floor((containerHeight - height) / height);
    candidate_width = Math.floor((containerWidth - width) / width);

    size = Math.min(candidate_height, candidate_width);
    size = Math.min(MAX_CELL_SIZE, size);

    jqGrid.find('.cell').css('height', size + 'px');
    jqGrid.find('.cell').css('width', size + 'px');

    const col_width = $("#container-fluid").width() / 6;
    $(".pair_preview").height(col_width);
}

function fillJqGridWithData(jqGrid, dataGrid) {
    jqGrid.empty();
    height = dataGrid.height;
    width = dataGrid.width;

    for (var i = 0; i < height; i++){
        var row = $(document.createElement('div'));
        row.addClass('row');
        for (var j = 0; j < width; j++){
            var cell = $(document.createElement('div'));
            cell.addClass('cell');
            cell.attr('x', i);
            cell.attr('y', j);
            setCellSymbol(cell, dataGrid.grid[i][j]);
            row.append(cell);
        }
        jqGrid.append(row);
    }
}

function copyJqGridToDataGrid(jqGrid, dataGrid) {
    row_count = jqGrid.find('.row').length
    if (dataGrid.height != row_count) {
        return
    }
    col_count = jqGrid.find('.cell').length / row_count
    if (dataGrid.width != col_count) {
        return
    }
    jqGrid.find('.row').each(function(i, row) {
        $(row).find('.cell').each(function(j, cell) {
            dataGrid.grid[i][j] = parseInt($(cell).attr('symbol'));
        });
    });
}

function setCellSymbol(cell, symbol) {
    cell.attr('symbol', symbol);
    classesToRemove = ''
    for (i = 0; i < 10; i++) {
        classesToRemove += 'symbol_' + i + ' ';
    }
    cell.removeClass(classesToRemove);
    cell.addClass('symbol_' + symbol);
}