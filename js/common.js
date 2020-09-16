// makes it so can't exit out modal by pressing outside of it
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

    get_unused_desc().then(task_desc => {

        if (task_desc == -1) {

            // force listener if haven't completed enough tasks
            const force_listener = (num_tasks_complete <= MIN_TASKS_BEFORE_SPEAKER);

            select_casino(force_listener).then(task => {

                select_arm(task).then(desc_id => {
                    if (desc_id == -1) {
                        console.log("speaker");
                        console.log(task);
                        window.location.href = `speaker.html?task=${task}`;
                    } else {
                        console.log("listener");
                        console.log(task, desc_id);
                        window.location.href = `listener.html?task=${task}&id=${desc_id}`;
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
            console.log("unused desc");
            console.log(task, desc_id);
            window.location.href = `listener.html?task=${task}&id=${desc_id}`;
        }

    }).catch(error => {
        console.log(error);
    });
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
 * set up tooltip
 */
$(window).on('load',function(){
    $('a[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        html: true
    });
});