var DESCRIPTIONS_TYPE;

// so can't exit modal by pressing outside of it
$.fn.modal.prototype.constructor.Constructor.Default.backdrop = 'static';
$.fn.modal.prototype.constructor.Constructor.Default.keyboard =  false;

/**
 * show an error message at the top of the screen.
 * @param {*} msg the message to display
 */
function errorMsg(msg) {
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);
    $('#error_display').hide();
    $('#info_display').hide();

    console.log(msg);

    $('#error_display').html(msg);
    $('#error_display').css({"visibility": "visible"});
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
    $('#info_display').css({"visibility": "visible"});
    $('#info_display').fadeIn(300);
    $('#info_display').delay(6000).fadeOut(300);
}

/**
 * Checks equality of two arrays
 */
function arraysEqual(a1,a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1)==JSON.stringify(a2);
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
    $("#finish_modal_uid").text(uid.toString());
    $("#finished_modal").modal('show');

    const end_time = new Date();
    const delta_time = (parseInt(end_time.getTime()) - parseInt(sessionStorage.getItem('start_time'))) / 1000;

    set_user_complete_time(uid, delta_time, 'time_to_complete');
}

/**
 * go to next task
 */
function next_task(first_task=false) {

    var num_tasks_complete = parseInt(sessionStorage.getItem('items_complete'));

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

            select_casino(force_listener).then(task => {

                select_arm(task).then(desc_id => {
                    if (desc_id == -1) {
                        console.log("speaker:", task);
                        window.location.href = `speaker.html?task=${task}`;
                    } else {
                        console.log("listener:", task, desc_id);
                        window.location.href = `listener.html?task=${task}&id=${desc_id}&ver=false`;
                    }
                }).catch(error => {
                    console.log(error);
                });
            }).catch(error => {
                console.log(error);
            });

        } else {
            const task = task_desc[0]
            const desc_id = task_desc[1]
            console.log("unused desc:", task, desc_id);
            window.location.href = `listener.html?task=${task}&id=${desc_id}&ver=false`;
        }

    }).catch(error => {
        console.log(error);
    });
}

function scroll_highlight_objective() {
    $([document.documentElement, document.body]).animate({
        scrollTop: $('#objective-col').offset().top-10
    }, 1000);

    $('#objective-col').css('-webkit-box-shadow', '0 0 40px purple');
    $('#objective-col').css('-moz-box-shadow', '0 0 40px purple');
    $('#objective-col').css('box-shadow', '0 0 40px purple');

    setTimeout(function() {
        $('#objective-col').css('-webkit-box-shadow', '0 0 0px rgba(0,0,0,0)');
        $('#objective-col').css('-moz-box-shadow', '0 0 0px rgba(0,0,0,0)');
        $('#objective-col').css('box-shadow', '0 0 0px rgba(0,0,0,0)');
    }, 2000);
}

/**
 * resize the grids if the window size changes
 */
var globalResizeTimer = null;
$(window).resize(function() {
    if(globalResizeTimer != null) window.clearTimeout(globalResizeTimer);
    globalResizeTimer = window.setTimeout(function() {
        console.log('resize');
        try {
            resizeOutputGrid();
        } catch (err) {
            console.log("no output grid");
        }
        loadTask(TASK_ID);
    }, 500);
});

/**
 * update the progress bar at the top of the screen
 * @param {*} tasks_inc true if want to increment number of tasks complete
 * @param {*} prac_inc true if want to increment number of practice tasks complete
 */
function update_progress_bar(tasks_inc=false, prac_inc=false) {
    var tasks_complete = parseInt(sessionStorage.getItem('items_complete'));
    var prac_complete = parseInt(sessionStorage.getItem('prac_complete'));

    if (tasks_inc) {
        tasks_complete++;
        sessionStorage.setItem('items_complete', tasks_complete);
    }
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

/**
 * Display a modal with the given title, text, and exit function.
 */
function show_modal(title, body_elements, button_title, action) {
    $("#generic_modal_title").text(title);
    for (i=0; i<body_elements.length;i++) {
        const element = body_elements[i];
        $("#generic_modal_body").append(element);
    }
    $("#generic_modal_exit_btn").html(button_title);
    $("#generic_modal_exit_btn").attr("onclick", `${action}`);

    $("#generic_modal").modal('show');
}

function field_exists(field) {
    var url = window.location.href;
    if(url.indexOf('?' + field + '=') != -1)
        return true;
    else if(url.indexOf('&' + field + '=') != -1)
        return true;
    return false
}