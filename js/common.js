var DESCRIPTIONS_TYPE;

// so can't exit modal by pressing outside of it
$.fn.modal.prototype.constructor.Constructor.Default.backdrop = 'static';
$.fn.modal.prototype.constructor.Constructor.Default.keyboard = false;

/**
 * show an error message at the top of the screen.
 * @param {*} msg the message to display
 */
function errorMsg(msg) {
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);
    $('#error_display').hide();
    $('#info_display').hide();

    console.warn(msg);

    $('#error_display').html(msg);
    $('#error_display').css({ "visibility": "visible" });
    $('#error_display').fadeIn(300);
    $('#error_display').delay(6000).fadeOut(300);
}

/**
 * show an info message at the top of the screen.
 * @param {*} msg the message to display
 */
function infoMsg(msg) {
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);
    $('#error_display').hide();
    $('#info_display').hide();

    console.log(msg);

    $('#info_display').html(msg);
    $('#info_display').css({ "visibility": "visible" });
    $('#info_display').fadeIn(300);
    $('#info_display').delay(6000).fadeOut(300);
}

/**
 * Checks equality of two arrays
 */
function arraysEqual(a1, a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1) == JSON.stringify(a2);
}

/**
 * Shuffles array in place. from https://stackoverflow.com/a/6274381/5416200
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/**
 * Show the user their id
 */
function finish() {
    const uid = sessionStorage.getItem('uid') || "no uid";
    $("#finish_modal_uid").text(uid.toString());
    $("#finished_modal").modal('show');

    update_progress_bar();

    const end_time = new Date();
    const delta_time = (parseInt(end_time.getTime()) - parseInt(sessionStorage.getItem('start_time') || 0)) / 1000;

    set_user_complete_time(uid, delta_time, 'time_to_complete');
}

function get_next_task(first_task = false) {

    return new Promise(function (resolve, reject) {
        var num_tasks_complete = parseInt(sessionStorage.getItem('items_complete') || 0);

        if (!first_task) {
            // increment number of tasks complete if not loading the first task, bc next task is called after completing a task
            num_tasks_complete++;
        }

        if (num_tasks_complete >= TOTAL_TASKS_TO_COMPLETE) {
            return resolve("finish");
        }

        get_unused_desc(DESCRIPTIONS_TYPE).then(task_desc => {

            if (task_desc == -1) {

                // force listener if haven't completed enough tasks
                const force_listener = (num_tasks_complete <= MIN_TASKS_BEFORE_SPEAKER);

                select_casino(force_listener, DESCRIPTIONS_TYPE).then(task => {

                    select_arm(task, DESCRIPTIONS_TYPE).then(desc_id => {
                        if (desc_id == -1) {
                            return resolve(`speaker.html?task=${task}`);
                        } else {
                            return resolve(`listener.html?task=${task}&id=${desc_id}&ver=false`);
                        }
                    }).catch(error => {
                        console.error(error);
                    });
                }).catch(error => {
                    console.error(error);
                });

            } else {
                const task = task_desc[0]
                const desc_id = task_desc[1]
                return resolve(`listener.html?task=${task}&id=${desc_id}&ver=false`);
            }

        }).catch(error => {
            console.error(error);
        });
    });
}

/**
 * go to next task
 */
function next_task(first_task = false) {

    var num_tasks_complete = parseInt(sessionStorage.getItem('items_complete') || 0);

    if (!first_task) {
        // increment number of tasks complete if not loading the first task, bc next task is called after completing a task
        num_tasks_complete++;
        sessionStorage.setItem('items_complete', num_tasks_complete);
    }

    if (num_tasks_complete >= TOTAL_TASKS_TO_COMPLETE) {
        finish();
        return;
    }

    get_unused_desc(DESCRIPTIONS_TYPE).then(task_desc => {

        if (task_desc == -1) {

            // force listener if haven't completed enough tasks
            const force_listener = (num_tasks_complete <= MIN_TASKS_BEFORE_SPEAKER);

            select_casino(force_listener, DESCRIPTIONS_TYPE).then(task => {

                select_arm(task, DESCRIPTIONS_TYPE).then(desc_id => {
                    if (desc_id == -1) {
                        console.log("speaker:", task);
                        window.location.href = `speaker.html?task=${task}`;
                    } else {
                        console.log("listener:", task, desc_id);
                        window.location.href = `listener.html?task=${task}&id=${desc_id}&ver=false`;
                    }
                }).catch(error => {
                    console.error(error);
                });
            }).catch(error => {
                console.error(error);
            });

        } else {
            const task = task_desc[0]
            const desc_id = task_desc[1]
            console.log("unused desc:", task, desc_id);
            window.location.href = `listener.html?task=${task}&id=${desc_id}&ver=false`;
        }

    }).catch(error => {
        console.error(error);
    });
}

function scroll_highlight_objective() {
    $([document.documentElement, document.body]).animate({
        scrollTop: $('#objective-col').offset().top - 10
    }, 1000);

    $('#objective-col').css('-webkit-box-shadow', '0 0 40px purple');
    $('#objective-col').css('-moz-box-shadow', '0 0 40px purple');
    $('#objective-col').css('box-shadow', '0 0 40px purple');

    setTimeout(function () {
        $('#objective-col').css('-webkit-box-shadow', '0 0 0px rgba(0,0,0,0)');
        $('#objective-col').css('-moz-box-shadow', '0 0 0px rgba(0,0,0,0)');
        $('#objective-col').css('box-shadow', '0 0 0px rgba(0,0,0,0)');
    }, 2000);
}

/**
 * resize the grids if the window size changes
 */
var globalResizeTimer = null;
$(window).resize(function () {
    if (globalResizeTimer != null) window.clearTimeout(globalResizeTimer);
    globalResizeTimer = window.setTimeout(function () {
        try {
            resizeOutputGrid();
        } catch (err) {
            console.warn("Tried to resize the output grid, but there is no output grid to resize.");
        }
        loadTask(TASK_ID);
    }, 500);
});

/**
 * update the progress bar at the top of the screen
 * @param {*} prac_inc true if want to increment number of practice tasks complete
 */
function update_progress_bar(prac_inc = false) {
    var tasks_complete = parseInt(sessionStorage.getItem('items_complete') || 0);
    var prac_complete = parseInt(sessionStorage.getItem('prac_complete') || 0);
    if (prac_inc) {
        prac_complete++;
        sessionStorage.setItem('prac_complete', prac_complete);
    }

    // + 1 is for instructions
    const tot_tasks = TOTAL_TASKS_TO_COMPLETE + TOTAL_PRAC_TASKS + 1;
    const percent_complete = (tasks_complete + prac_complete) / tot_tasks * 100;

    $(".progress-bar").animate({
        width: `${percent_complete}%`
    }, 1000);
}

/**
 * Correctly sizes the progress bar for the number of practice tasks and actual tasks
 */
function size_progress_bar() {
    const total = TOTAL_TASKS_TO_COMPLETE + TOTAL_PRAC_TASKS + 1;   // +1 for tutorial

    const instructions_width = 1 / total * 100;
    const tutorial_width = TOTAL_PRAC_TASKS / total * 100;
    const tasks_width = 100 - instructions_width - tutorial_width;

    $("#instructions_label").css("width", `${instructions_width}%`);
    $("#tutorial_label").css("width", `${tutorial_width}%`);
    $("#done_label").css("width", `${tasks_width}%`);
}

// create random id so queue and desc have same id
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}