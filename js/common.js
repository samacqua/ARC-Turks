$.fn.modal.prototype.constructor.Constructor.Default.backdrop = 'static';
$.fn.modal.prototype.constructor.Constructor.Default.keyboard =  false;
const TOTAL_TASKS_TO_COMPLETE = 6;


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

$(window).on('load',function(){
    $('a[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        html: true
    });
});

function next_task() {
    /**
     * go to next task, randomly choose listener or speaker
     * but make sure listener and speaker in first two tasks
     */

     var speaker_tasks_done = parseInt(sessionStorage.getItem('s'));
     var listener_tasks_done = parseInt(sessionStorage.getItem('l'));
     console.log(speaker_tasks_done);
     console.log(listener_tasks_done);

    const rand_num = Math.random();
    if (rand_num < 0.5) {
        speaker_tasks_done++;
        sessionStorage.setItem('s', speaker_tasks_done);
        window.location.href = 'speaker.html';
        return;
    } else {
        listener_tasks_done++;
        sessionStorage.setItem('l', listener_tasks_done);
        window.location.href = 'listener.html';
        return;
    }
}

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

function update_progress_bar(increment=true) {
    var stage_num = sessionStorage.getItem('items_complete');

    if (increment) {
        stage_num++;
        sessionStorage.setItem('items_complete', stage_num);
    }

    const tot_tasks = 11;
    const percent_complete = stage_num / tot_tasks * 100;

    $(".progress-bar").animate({
        width: `${percent_complete}%`
    }, 1000);
}