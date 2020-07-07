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