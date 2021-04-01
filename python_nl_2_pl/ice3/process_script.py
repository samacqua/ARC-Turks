import re

lines = open("ice_code.txt").readlines()

# a list of problems
task_func = dict()

task_number = None
primitives = []

for line in lines:
    # start grabbing a new problem on keyword taski
    if 'taski' in line:
        task_number = re.findall(r'\d+', line)[0]
        # store task_func as just one giant string
        task_func[task_number] = ''
    else:
        # grow the giant function string lul
        task_func[task_number] += line
        # we're lucky ice3 always write functions this way:
        # 'filterCol(' i.e. a word followed immediately with left paren
        all_prims_used = re.findall(r'[a-zA-Z]+\(', line)
        for prim_name in all_prims_used:
            if prim_name not in primitives:
                primitives.append(prim_name)

# print (task_func)
# print (primitives)

task_proglabels = []
for task_number in task_func:
    func_str = task_func[task_number]
    # get the prims again, deduplicate with set
    func_prims = set(re.findall(r'[a-zA-Z]+\(', func_str))
    # generate the multi-label class for the particular task_number
    labels = sorted([primitives.index(prim) for prim in func_prims])
    task_proglabels.append((task_number, labels))

print ("the primitive name list")
print (primitives)
print ("the small set of multi-labels, format: [(task_id_str, [primitive_name_id.. ]) .. ]")
print (task_proglabels)
