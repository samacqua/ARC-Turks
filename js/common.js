$.fn.modal.prototype.constructor.Constructor.Default.backdrop = 'static';
$.fn.modal.prototype.constructor.Constructor.Default.keyboard =  false;

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

function exit_message() {
    console.log(USER_ID);
    $("#finish_modal_uid").text(USER_ID.toString());
    // so the modal can't be dismissed, from https://stackoverflow.com/questions/22207377/disable-click-outside-of-bootstrap-modal-area-to-close-modal
    $('#finished_modal').modal({backdrop: 'static', keyboard: false}); 
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

     var speaker_tasks_done = sessionStorage.getItem('s');
     var listener_tasks_done = sessionStorage.getItem('l');

    if (speaker_tasks_done + listener_tasks_done >= 10) {
        $("finished_modal").modal('show');
    }

    // to ensure speaker and listener in first two tasks
    if (speaker_tasks_done == 0 && listener_tasks_done != 0) {
        speaker_tasks_done++;
        sessionStorage.setItem('s', speaker_tasks_done);
        window.location.href = 'speaker.html';
    }
    if (listener_tasks_done == 0 && speaker_tasks_done != 0) {
        listener_tasks_done++;
        sessionStorage.setItem('l', listener_tasks_done);
        window.location.href = 'listener.html';
    }

    const rand_num = Math.random();
    if (rand_num < 0.5) {
        speaker_tasks_done++;
        sessionStorage.setItem('s', speaker_tasks_done);
        window.location.href = 'speaker.html';
    } else {
        listener_tasks_done++;
        sessionStorage.setItem('l', listener_tasks_done);
        window.location.href = 'listener.html';
    }
}

var globalResizeTimer = null;

$(window).resize(function() {
    if(globalResizeTimer != null) window.clearTimeout(globalResizeTimer);
    globalResizeTimer = window.setTimeout(function() {
        resizeOutputGrid();
        loadTask(TASK_ID);
    }, 500);
});