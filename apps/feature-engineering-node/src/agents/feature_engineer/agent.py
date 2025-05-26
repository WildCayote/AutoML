import os
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv, find_dotenv

from .utils.prompts import CODE_GENERATION_PROMPT, CODE_CORRECTION_PROMPT
from .utils.state import CodeState
from .utils.nodes import generate_code, correct_code
from .utils.edges import needs_correction


load_dotenv(find_dotenv())

llm = ChatOpenAI(
    base_url=os.environ.get('BASE_URL'),
    api_key=os.environ.get('API_KEY'),
    model=os.environ.get('MODEL_NAME'),
    temperature=1
)

# initialize the agents
code_generator = CODE_GENERATION_PROMPT | llm | StrOutputParser()
code_corrector = CODE_CORRECTION_PROMPT| llm | StrOutputParser()

# initialize the nodes
generate_code_node = lambda state: generate_code(code_generator, state)
correct_code_node = lambda state: correct_code(code_corrector, state)

# create the graph
graph = StateGraph(CodeState)

# add the nodes
graph.add_node("generate", RunnableLambda(generate_code_node))
graph.add_node("correct", RunnableLambda(correct_code_node))
graph.set_entry_point("generate")

# add the edges
graph.add_conditional_edges("generate", needs_correction, {"correct": "correct", END: END})
graph.add_conditional_edges("correct", needs_correction, {"correct": "correct", END: END})

# compile the graph
feature_engineer = graph.compile()