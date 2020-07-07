const urlParams = new URLSearchParams(window.location.search);
const t1 = urlParams.get('t1');
const d1 = urlParams.get('d1');
const t2 = urlParams.get('t2');
const d2 = urlParams.get('d2');
const t3 = urlParams.get('t3');
const d3 = urlParams.get('d3');

console.log(t1);
console.log(d1);
console.log(t2);
console.log(d2);
console.log(t3);
console.log(d3);

const ts = [t1, t3];
const ds = [d1, d3];


$(window).on('load',function(){
    $('#error_display').hide();
    $('#info_display').hide();

    $('#instructionsModal').modal('show');

    // to make it appear random
    loadTask(t2);
    $("#description_p").text(d2);
});

function check_grid() {
    syncFromEditionGridToDataGrid();
    reference_output = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output'];
    submitted_output = CURRENT_OUTPUT_GRID.grid;

    if (reference_output.length != submitted_output.length) {
        errorMsg("Wrong answer. Try again.");
        return
    }

    for (var i = 0; i < reference_output.length; i++){
        ref_row = reference_output[i];
        for (var j = 0; j < ref_row.length; j++){
            if (ref_row[j] != submitted_output[i][j]) {
                errorMsg("Wrong answer. Try again.");
                return
            }
        }
    }
    infoMsg("Correct!");

    console.log(ts);
    console.log(ts.length);

    if (ts.length == 0) {
        console.log("ya");
        $("#exitModal").modal("show");
    }

    resetOutputGrid();

    // breaks if you don't reset array
    TEST_PAIRS = new Array();
    loadTask(ts.pop());
    $("#description_p").text(ds.pop());
}

function finish_self_play() {
    const rand_num = Math.random();
    if (rand_num < 0.5) {
        // 'file:///Users/samacquaviva/Documents/Summer%20UROP/Turk/Website%20Complete/speaker.html?first=true'
        window.location.href = '/speaker.html?first=true';
    } else {
        // 'file:///Users/samacquaviva/Documents/Summer%20UROP/Turk/Website%20Complete/listener.html?first=true'
        window.location.href = '/listener.html?first=true';
    }
}