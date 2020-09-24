const TOTAL_TASKS_TO_COMPLETE = 3;
const MIN_TASKS_BEFORE_SPEAKER = 2;
const TOTAL_PRAC_TASKS = 2;
const MIN_WORDS = 100;
const DESCRIPTIONS_TYPE = "language"; // "language_and_example" "example"

// easy tasks for demonstration purposes
const PRAC_TASKS = [
    {
        "task": 341,
        "grid_desc": "The grid size... does not change.",
        "see_desc": "In the input, you should see... a light blue 2x2 square with 4 colored cells around it.",
        "do_desc": "To make the output, you have to... move each colored cell on top of the corner of the light blue square that it is closest to.",
        "selected_example": 0
    },
    {
        "task": 258,
        "grid_desc": "The grid size... changes to the size of the colored object.",
        "see_desc": "In the input, you should see... a colored object on a blue background.",
        "do_desc": "To make the output, you have to... zoom in on the object, and replace all blue with black.",
        "selected_example": 0
    }
];

const GRID_SIZE_PREFIX = "The grid size...";
const SHOULD_SEE_PREFIX = "In the input, you should see...";
const HAVE_TO_PREFIX = "To make the output, you have to...";