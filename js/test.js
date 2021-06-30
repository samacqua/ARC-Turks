$(window).on('load', function () {

    // parse url
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    TASK_ID = urlParams.get('task') || TASKS[Math.floor(Math.random() * TASKS.length)].toString();

    test_load(TASK_ID);
});

function test_load(task) {
    loadTask(task);
    $('#task_name').text('Task: ' + task);
    updateUrl({"task": task});
}

/**
 * Handle back and forth navigation
 * from https://stackoverflow.com/a/3354511/5416200 (but url stored in query params)
 * @param {Object} e the event that carries the 
 */
window.onpopstate = function(e){
    console.log(e);
    if(e.state){
        loadTask(e.state.task);
        $('#task_name').text('Task: ' + e.state.task);
        document.title = e.state.pageTitle;
    }
};

/**
 * update the url so that the url can be shared to show same information
 * https://stackoverflow.com/a/41542008/5416200
 * @param {Object} response the data that updates the url {task: *task*}
 */
 function updateUrl(response) {
    if ('URLSearchParams' in window) {
        var searchParams = new URLSearchParams(window.location.search);
        searchParams.set("task", response.task);
        var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
        document.title = "ARC Task: " + response.task.toString();
        window.history.pushState({"task": response.task, "pageTitle": document.title}, "", newRelativePathQuery);
    }
}

function check() {
    /**
     * check if output grid same as correct answer.
     */

    update_grid_from_div($(`#output_grid .editable_grid`), CURRENT_OUTPUT_GRID);
    reference_output = TEST_PAIR.output.grid;
    submitted_output = CURRENT_OUTPUT_GRID.grid;

    if (reference_output.length != submitted_output.length || reference_output[0].length != submitted_output[0].length) {
        errorMsg('Wrong answer. Try again.');
        return;
    }

    for (var i = 0; i < reference_output.length; i++) {
        ref_row = reference_output[i];
        for (var j = 0; j < ref_row.length; j++) {
            if (ref_row[j] != submitted_output[i][j]) {
                errorMsg('Wrong answer. Try again.');
                return;
            }
        }
    }

    infoMsg("Correct!");
}
