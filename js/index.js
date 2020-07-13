// easy tasks for demonstration purposes
// const TASKS = [54, 52, 345]; for video demonstration
const TASKS = [370, 258];
const URL_TASKS = TASKS.join('.');

var DESC_SEES = [];
var DESC_DOS = [];
var DESC_GRIDS = [];

var START_TIME;

$(window).on('load',function(){

    $('#error_display').hide();
    $('#info_display').hide();

    $("#grid_size_form").css("visibility", "hidden");

    // fill forms with actual text
    $("#what_you_see").val("You should see...");
    $("#what_you_do").val("You have to...");
    $("#grid_size_desc").val("The grid size...");

    // get consent, then demographic, then present study, then begin solving patterns
    $('#consentModal').modal('show');

    // assign a random id
    const user_id = Math.floor(Math.random()*1e10);
    sessionStorage.setItem("uid", user_id);
    loadTask(TASKS.shift());
});

$(document).ready(function(){
    /**
     * makes it so slider has a label reflecting its value
     */
    $("#age_result").html($("#age_form").val());
    $("#age_form").change(function(){
        $("#age_result").html($(this).val());
    });

    $("#dif_patt_result").html($("#dif_patt_form").val());
    $("#dif_patt_form").change(function(){
        $("#dif_patt_result").html($(this).val());
    });
});  

$(function(){
    /**
     * auto play and auto pause modal videos
     */
    $('#examples_modal').on('hidden.bs.modal', function(){
        $(this).find('video')[0].pause();
    });
    $('#examples_modal').on('shown.bs.modal', function () {
         $(this).find('video')[0].play();
      });
});

$(function()
/**
 * listen for change in check box if grid size changes
 */
{
    $('#grid_size_changes').on('change', function()
    {
        if (this.checked)
        {
            $("#grid_size_form").css("visibility", "visible");
        } else {
            $("#grid_size_form").css("visibility", "hidden");
        }
    });
});

function exit_demographic() {
    /**
     * Get info from demographic modal
     */
    gender = $('#gender_form').find("option:selected").text();
    sessionStorage.setItem("gender", gender);

    age = $('#age_form').val().trim();
    sessionStorage.setItem("age", age);

    $('#demographic_modal').one('hidden.bs.modal', function() { $('#introModal').modal('show'); }).modal('hide');
}

function submit() {
    /**
     * If starting with right phrase and actually entered text, then bring to listening task and pass all info
     */

     DESC_SEES.push($("#what_you_see").val().trim());
     DESC_DOS.push($("#what_you_do").val().trim());
     if ( $('#grid_size_desc').css('display') == 'none' || $('#grid_size_desc').css("visibility") == "hidden"){
        DESC_GRIDS.push("The grid size... does not change");
    } else {
        DESC_GRIDS.push($("#grid_size_desc").val().trim());
    }

     if (TASKS.length != 0) {
        $("#what_you_see").val("You should see...");
        $("#what_you_do").val("You have to...");
        $("#grid_size_desc").val("The grid size...");

        loadTask(TASKS.shift());
        return;
     }

    if ($("#what_you_see").val().trim().length < 20) {
        errorMsg("Please enter a description of what you see.");
        return
    }
    if ($("#what_you_do").val().trim().length < 20) {
        errorMsg("Please enter a description of what you change.");
        return
    }
    if ($("#grid_size_desc").val().trim().length < 10) {
        errorMsg("Please enter a description of the grid size.");
        return
    }

    if (!$("#what_you_see").val().trim().startsWith("You should see")) {
        errorMsg("What you see has to start with \"You should see\"");
        return
    }
    if (!$("#what_you_do").val().trim().startsWith("You have to")) {
        errorMsg("What you do has to start with \"You have to\"");
        return
    }
    if (!$("#grid_size_desc").val().trim().startsWith("The grid size")) {
        errorMsg("The grid size field has to start with \"The grid size\"");
        return
    }

    DESC_SEES = DESC_SEES.join('~');
    DESC_DOS = DESC_DOS.join('~');
    DESC_GRIDS = DESC_GRIDS.join('~');

    window.location.href = `self_play_test.html?tasks=${URL_TASKS}&see=${DESC_SEES}&do=${DESC_DOS}&grid=${DESC_GRIDS}`;
}

function exit_examples_modal() {
    const cur_time = new Date();
    const min_watch_time = 120;
    const time_watched = Math.round((cur_time - START_TIME) / 1000);
    if (time_watched < min_watch_time) {
        errorMsg(`Please watch at least ${min_watch_time - time_watched} more seconds of the video`);
        return;
    }
    $('#examples_modal').one('hidden.bs.modal', function() { $('#instructionsModal').modal('show'); }).modal('hide');
}