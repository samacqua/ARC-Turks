const TOTAL_TASKS_TO_COMPLETE = 6;
const TOTAL_PRAC_TASKS = 3; // 1 for instructions, 2 for practice tasks

// easy tasks for demonstration purposes
// 78 for video demonstration
const PRAC_TASKS = [
    // {
    //     "task": 78,
    //     "grid_desc": "The grid size... changes to 3x3.",
    //     "see_desc": "In the input, you should see... a large grid with multiple copies of a few 3x3 shapes.",
    //     "do_desc": "To make the output, you have to... zoom in on the shape that appears the most in the input."
    // },    
        
    {
        "task": 370,
        "grid_desc": "The grid size... does not change.",
        "see_desc": "In the input, you should see... two blue dots.",
        "do_desc": "To make the output, you have to... place a green plus sign exactly half-way between the two blue dots.",
        "selected_example": 0
    },
    {
        "task": 258,
        "grid_desc": "The grid size... changes to the size of the colored object.",
        "see_desc": "In the input, you should see... a colored object on a blue background.",
        "do_desc": "To make the output, you have to... zoom in on the object, and replace all blue with black."
    }
];

const QUIZ_QUESTIONS = [
    {
        question: "Your goal is to...",
        answers: {
            a: 'create grids that look like other grids',
            b: 'write a description of the transformation based on grid examples so that another person can create the correct output grid',
            c: 'use a description of the pattern to create the correct output grid'
        },
        correctAnswer: 'c'
    },
    {
        question: "It is important to...",
        answers: {
            a: 'Use as few attempts as possible.',
            b: 'Complete the tasks as fast as possible.',
            c: 'Use as many colors as possible.'
        },
        correctAnswer: 'a'
    },
    {
        question: "To edit the output grid, what are the 3 modes you can use and their correct description?",
        answers: {
            a: '1). Draw -- to edit individual pixels. 2). Flood fill -- to fill in entire areas. 3). Copy-paste -- to copy a section of the grid.',
            b: '1). Draw -- to edit individual pixels. 2). Stamper -- to place down a stamp of a shape. 3). Line -- to make a line between two pixels.',
            c: 'There is only one mode.'
        },
        correctAnswer: 'a'
    },
    {
        question: "If you give up, will you be given a bonus for completing that task?",
        answers: {
            a: 'Yes.',
            b: 'No.',
        },
        correctAnswer: 'b'
    }
];