$.fn.modal.prototype.constructor.Constructor.Default.backdrop = 'static';
$.fn.modal.prototype.constructor.Constructor.Default.keyboard =  false;

function errorMsg(msg) {
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);

    console.log(msg);


    $('#error_display').html(msg);
    $('#error_display').css({"visibility": "visible"});
    $('#error_display').show();
    $('#error_display').fadeOut(5000);
}

function infoMsg(msg) {
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);

    console.log(msg);

    $('#info_display').html(msg);
    $('#info_display').css({"visibility": "visible"});
    $('#info_display').fadeIn(300);
    $('#info_display').delay(3000).fadeOut(300);
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

function next_task(s, l, age, gender, uid) {
    /**
     * go to next task, randomly choose listener or speaker
     * but make sure listener and speaker in first two tasks
     * pass all info about demographics and uid
     */

    if (s+l >= 10) {
        $("finished_modal").modal('show');
    }

    // to ensure speaker and listener in first two tasks
    if (s == 0 && l != 0) {
        s++;
        window.location.href = 'speaker.html?s=' + s + '&l=' + l +'&age=' + age + '&gender=' + gender + '&uid=' + uid;
        return;
    }

    if (l == 0 && s != 0) {
        l++;
        window.location.href = 'listener.html?s=' + s + '&l=' + l + '&age=' + age + '&gender=' + gender + '&uid=' + uid;
        return;
    }

    const rand_num = Math.random();
    if (rand_num < 0.5) {
        s++;
        window.location.href = 'speaker.html?s=' + s + '&l=' + l +'&age=' + age + '&gender=' + gender + '&uid=' + uid;
    } else {
        l++
        window.location.href = 'listener.html?s=' + s + '&l=' + l +'&age=' + age + '&gender=' + gender + '&uid=' + uid;
    }
}