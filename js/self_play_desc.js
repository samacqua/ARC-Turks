const PRAC_TASK = 301;

$(window).on('load',function(){
    $('#error_display').hide();
    $('#info_display').hide();

    $("#grid_size_form").css("visibility", "hidden");

    $("#what_you_see").val("You should see...");
    $("#what_you_do").val("You have to...");
    $("#grid_size_desc").val("The grid size...");

    $('#instructionsModal').modal('show');
    loadTask(PRAC_TASK);
});

TASK_DESCRIPTIONS = []; 

function submit() {

    if ($("#what_you_see").val().trim().length < 5) {
        errorMsg("Please enter a description of what you see.");
        return
    }

    if ($("#what_you_do").val().trim().length < 5) {
        errorMsg("Please enter a description of what you change.");
        return
    }

    if ($("#grid_size_desc").val().trim().length < 5) {
        errorMsg("Please enter a description of the grid size.");
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