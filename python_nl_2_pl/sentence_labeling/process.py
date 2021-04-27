import csv
import random
from nltk import tokenize
import nltk

# hope this works ! 
nltk.download('punkt')

succ_build_ids = set()

with open('build.csv') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        if row['is_success'] == 'True':
            succ_build_ids.add(row['build_id'])

# print (succ_build_ids)
# print (len(succ_build_ids))

# a set of successful description ids with a mapping to their task
succ_desc_ids = dict()
with open('join.csv') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        if row['build_id'] in succ_build_ids:
            succ_desc_ids[row['description_id']] = row['task_id']

# print (succ_desc_ids)
# print (len(succ_desc_ids))

desc_sentences = dict()
with open('description.csv') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        if row['description_id'] in succ_desc_ids:
            # the key is a pair of task_id and description_id
            key = (succ_desc_ids[row['description_id']], row['description_id'])
            val = ()
            # get the input sentences
            paragraph_input = row['description_input'][31:]
            val += (tokenize.sent_tokenize(paragraph_input),)
            # get the grid sentences
            paragraph_gridsize = row['description_output_grid_size'][23:]
            val += (tokenize.sent_tokenize(paragraph_gridsize),)
            # get the output sentences
            paragraph_output = row['description_output'][34:]
            val += (tokenize.sent_tokenize(paragraph_output.replace('.', '. ')),)
            desc_sentences[key] = val

# print (desc_sentences)

# pool a dataset of shuffled sentence 'programs' to be labeled
pool_sentences = []

for task_desc in desc_sentences:
    output_desc = desc_sentences[task_desc][2]
    output_desc = list(filter(lambda x : len(x) > 9 and len(x) < 200, output_desc))
    pool_sentences += output_desc

random.shuffle(pool_sentences)

print (sorted(pool_sentences))

with open('ouput_sentences.txt', "w") as fd:
    for sent in pool_sentences:
        fd.write(sent+'\n')
