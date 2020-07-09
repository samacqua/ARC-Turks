// easy task
const PRAC_TASK = 301;

$(window).on('load',function(){

    $('#error_display').hide();
    $('#info_display').hide();
    $("#grid_size_form").css("visibility", "hidden");

    // fill forms with actual text
    $("#what_you_see").val("You should see...");
    $("#what_you_do").val("You have to...");
    $("#grid_size_desc").val("The grid size...");

    // show instructions
    $('#instructionsModal').modal('show');
    loadTask(PRAC_TASK);
});

$(function(){
    /**
     * auto play and auto pause modal videos
     */
    $('#instructions2Modal').on('hidden.bs.modal', function(){
        $(this).find('video')[0].pause();
    });
    $('#instructions2Modal').on('shown.bs.modal', function () {
         $(this).find('video')[0].play();
      });
});

function submit() {
    /**
     * If starting with right phrase and actually entered text, then bring to listening task and pass all info
     */

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
    
    let desc_see = $("#what_you_see").val().trim();
    let desc_do = $("#what_you_do").val().trim();
    let desc_grid = $("#grid_size_desc").val().trim()
    if ( $('#grid_size_desc').css('display') == 'none' || $('#grid_size_desc').css("visibility") == "hidden"){
        desc_grid = "The grid size... does not change";
    }

    window.location.href = `self_play_test.html?task=${PRAC_TASK}&see=${desc_see}&do=${desc_do}&grid=${desc_grid}`;
}

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